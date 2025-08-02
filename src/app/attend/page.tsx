'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Camera, CheckCircle, XCircle, UserCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { verifyFace } from '@/ai/flows/verify-face';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

type AttendanceStatus = 'idle' | 'locating' | 'location_ok' | 'location_fail' | 'camera_on' | 'verifying' | 'verified_ok' | 'verified_fail';

function AttendanceProcessor() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const { toast } = useToast();

  const [status, setStatus] = useState<AttendanceStatus>('idle');
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setCurrentUser({ uid: user.uid, ...userDoc.data() });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const startCamera = useCallback(async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus('camera_on');
        setProgress(66);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Camera Error', description: 'Could not access camera.' });
      }
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);
  
  const takePictureAndVerify = useCallback(async () => {
    if (videoRef.current && canvasRef.current && currentUser) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg');
            stopCamera();
            setStatus('verifying');
            setProgress(80);

            const enrolledFaceDataUri = currentUser.faceDataUri;
            if (!enrolledFaceDataUri) {
                toast({ variant: 'destructive', title: 'Not Enrolled', description: 'You have not enrolled your face. Please enroll from your dashboard.' });
                setStatus('verified_fail');
                return;
            }

            try {
                const result = await verifyFace({
                    livePhotoDataUri: dataUrl,
                    enrolledFaceDataUri: enrolledFaceDataUri,
                    studentName: currentUser.email // or a name field if you have one
                });
                if (result.isMatch) {
                    setStatus('verified_ok');
                    setProgress(100);
                    toast({ title: 'Attendance Marked!', description: `Confidence: ${(result.confidence * 100).toFixed(2)}%` });
                    
                    // Add student to session attendance
                    if (sessionId) {
                        const sessionDocRef = doc(db, 'sessions', sessionId);
                        await updateDoc(sessionDocRef, {
                            attendedStudents: arrayUnion({
                                uid: currentUser.uid,
                                email: currentUser.email,
                                name: currentUser.email.split('@')[0], // a temporary name
                                rollNo: `S${currentUser.uid.substring(0,4)}`,
                                checkInTime: new Date().toISOString()
                            })
                        });
                        // also add to student's record
                        const userDocRef = doc(db, 'users', currentUser.uid);
                        const sessionDetails = (await getDoc(sessionDocRef)).data();
                        await updateDoc(userDocRef, {
                          attendanceHistory: arrayUnion({
                            sessionId,
                            subject: sessionDetails?.subject || 'Unknown Subject',
                            date: sessionDetails?.lectureDate || new Date().toISOString(),
                            status: 'Present'
                          })
                        });
                    }

                } else {
                    setStatus('verified_fail');
                    toast({ variant: 'destructive', title: 'Verification Failed', description: result.reason });
                }
            } catch (error) {
                setStatus('verified_fail');
                toast({ variant: 'destructive', title: 'Error', description: 'An error occurred during verification.' });
            }
        }
    }
  }, [stopCamera, toast, currentUser, sessionId]);

  useEffect(() => {
    if (status === 'idle') {
      setStatus('locating');
      setProgress(10);
      // Mock geolocation check
      setTimeout(() => {
        // Mock success
        setStatus('location_ok');
        setProgress(33);
        // Automatically start camera
        startCamera();
      }, 1500);
    }
  }, [status, startCamera]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const renderContent = () => {
    switch (status) {
      case 'locating':
        return <div className="text-center"><Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" /><p className="mt-4">Checking your location...</p></div>;
      case 'location_ok':
      case 'camera_on':
        return (
          <div className="text-center">
            <div className="w-64 h-64 rounded-full bg-secondary mx-auto flex items-center justify-center overflow-hidden border-4 border-green-500">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
            </div>
            <p className="mt-4 text-green-600 font-semibold flex items-center justify-center gap-2"><MapPin/> Location Verified</p>
            <p className="text-muted-foreground text-sm">Position yourself in the frame and take a picture.</p>
            <Button onClick={takePictureAndVerify} className="mt-4" size="lg"><Camera className="mr-2"/> Verify My Face</Button>
          </div>
        );
      case 'verifying':
        return <div className="text-center"><Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" /><p className="mt-4">Verifying your identity...</p></div>;
      case 'verified_ok':
        return (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
            <h2 className="text-2xl font-bold mt-4">Attendance Marked!</h2>
            <p className="text-muted-foreground">You have been successfully marked present for this lecture.</p>
          </div>
        );
      case 'verified_fail':
      case 'location_fail':
         return (
          <div className="text-center">
            <XCircle className="h-16 w-16 mx-auto text-destructive" />
            <h2 className="text-2xl font-bold mt-4">Attendance Failed</h2>
            <p className="text-muted-foreground">{status === 'location_fail' ? "You are not in the allowed range for this lecture." : "Face verification failed. Please try again or contact your professor."}</p>
             <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">Try Again</Button>
          </div>
        );
      default:
        return <div className="text-center"><Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" /></div>;
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserCheck /> Attendance Verification</CardTitle>
          <CardDescription>Session ID: {sessionId || 'Loading...'}</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[350px] flex items-center justify-center">
          {renderContent()}
        </CardContent>
        <Progress value={progress} className="w-full h-2 rounded-b-lg" />
        <canvas ref={canvasRef} className="hidden" />
      </Card>
    </main>
  );
}

export default function AttendPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin"/></div>}>
            <AttendanceProcessor />
        </Suspense>
    )
}
