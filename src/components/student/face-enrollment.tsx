
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle, Loader2, RefreshCw, UserCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { enrollFace } from '@/ai/flows/enroll-face';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

type EnrollmentStatus = 'idle' | 'camera_on' | 'picture_taken' | 'enrolling' | 'enrolled' | 'enrollment_failed';

type FaceEnrollmentProps = {
  onEnrollmentComplete?: (faceDataUri: string) => void;
  isPartOfRegistration?: boolean;
};

export function FaceEnrollment({ onEnrollmentComplete, isPartOfRegistration = false }: FaceEnrollmentProps) {
  const [status, setStatus] = useState<EnrollmentStatus>('idle');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const [enrollmentMessage, setEnrollmentMessage] = useState('');

  useEffect(() => {
    setIsClient(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        if (!isPartOfRegistration) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().faceDataUri) {
            setStatus('enrolled');
            setImageSrc(userDoc.data().faceDataUri);
          } else {
            setStatus('idle');
          }
        }
      } else {
         if (isPartOfRegistration) {
            // For registration, we create a temporary user object for the AI flow
            setCurrentUser({ uid: `temp-id-${Date.now()}` });
         }
      }
    });
    return () => unsubscribe();
  }, [isPartOfRegistration]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera(); 
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus('camera_on');
      } catch (error) {
        console.error("Error accessing camera: ", error);
        toast({
          variant: "destructive",
          title: "Camera Error",
          description: "Could not access your camera. Please check your browser permissions.",
        });
        setStatus('idle');
      }
    }
  }, [toast, stopCamera]);


  const takePicture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImageSrc(dataUrl);
        setStatus('picture_taken');
        stopCamera();
      }
    }
  }, [stopCamera]);
  
  const handleEnrollment = async () => {
    if (!imageSrc || !currentUser) return;
    setStatus('enrolling');
    try {
      const result = await enrollFace({
        studentPhotoDataUri: imageSrc,
        studentId: currentUser.uid,
      });

      if (result.success) {
        setEnrollmentMessage(result.message);
        setStatus('enrolled');
        if (isPartOfRegistration && onEnrollmentComplete) {
            onEnrollmentComplete(imageSrc);
             toast({
                title: "Enrollment Successful!",
                description: "Completing your registration...",
            });
        } else if (!isPartOfRegistration && currentUser.uid) { // Ensure there is a real user
            await updateDoc(doc(db, 'users', currentUser.uid), {
              faceDataUri: imageSrc
            });
            toast({
                title: "Enrollment Successful!",
                description: result.message,
            });
        }
      } else {
        throw new Error(result.message || "The AI model could not verify a clear face in the photo. Please try again.");
      }
    } catch (error) {
      console.error("Enrollment failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred. Please try again.";
      setEnrollmentMessage(errorMessage);
      setStatus('enrollment_failed');
      toast({
        variant: "destructive",
        title: "Enrollment Failed",
        description: errorMessage,
      });
    }
  };

  const reset = () => {
    setImageSrc(null);
    setStatus('idle');
    setEnrollmentMessage('');
    if (!videoRef.current?.srcObject) {
       startCamera();
    }
  };

  useEffect(() => {
    if (status === 'idle' && isClient && !videoRef.current?.srcObject) {
      startCamera();
    }
    // Only stop camera if it's not needed anymore
    return () => {
        if(status !== 'camera_on' && status !== 'picture_taken') {
            stopCamera();
        }
    }
  }, [status, isClient, startCamera, stopCamera]);

  if (!isClient) {
    return (
        <Card>
            <CardHeader><CardTitle>Face Biometrics</CardTitle></CardHeader>
            <CardContent><div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div></CardContent>
        </Card>
    );
  }
  
  if (status === 'enrolled' && !isPartOfRegistration) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-6 w-6 text-green-500" />
                    Biometric Enrollment Complete
                </CardTitle>
                <CardDescription>Your face is registered for attendance verification.</CardDescription>
            </CardHeader>
            <CardContent>
                <Alert variant="default" className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 !text-green-600" />
                    <AlertTitle className="text-green-800">You're all set!</AlertTitle>
                    <AlertDescription className="text-green-700">
                        You can now use face verification to mark your attendance during live lecture sessions.
                    </AlertDescription>
                </Alert>
                {imageSrc && (
                    <div className="mt-4 text-center">
                        <img src={imageSrc} alt="Enrolled face" className="rounded-lg mx-auto border w-40 h-40 object-cover" />
                        <p className="text-xs text-muted-foreground mt-2">Your registered image.</p>
                    </div>
                )}
            </CardContent>
             <CardFooter>
                <Button variant="outline" onClick={reset}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Re-enroll
                </Button>
            </CardFooter>
        </Card>
    );
  }

  const Wrapper = isPartOfRegistration ? 'div' : Card;
  const wrapperProps = isPartOfRegistration ? {} : { className: "w-full" };

  return (
    <Wrapper {...wrapperProps}>
      {!isPartOfRegistration && (
        <CardHeader>
          <CardTitle>Face Biometric Enrollment</CardTitle>
          <CardDescription>
            Register your face to use our secure, one-tap attendance system.
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className="flex flex-col items-center justify-center">
        <div className="w-64 h-64 rounded-lg bg-secondary flex items-center justify-center overflow-hidden border">
          {status === 'camera_on' && <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />}
          {imageSrc && <img src={imageSrc} alt="Student snapshot" className="w-full h-full object-cover  scale-x-[-1]" />}
          {(status === 'idle' && !imageSrc) && <Loader2 className="w-16 h-16 text-muted-foreground animate-spin" />}
          {status === 'enrolling' && <Loader2 className="w-16 h-16 text-primary animate-spin" />}
          {status === 'enrolled' && isPartOfRegistration && <CheckCircle className="w-16 h-16 text-green-500" />}
          {status === 'enrollment_failed' && <AlertTriangle className="w-16 h-16 text-destructive" />}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        {enrollmentMessage && (status === 'enrollment_failed' || status === 'enrolled') && (
             <Alert variant={status === 'enrollment_failed' ? 'destructive' : 'default'} className="mt-4">
                <AlertTitle>{status === 'enrollment_failed' ? 'Enrollment Failed' : 'Enrollment Note'}</AlertTitle>
                <AlertDescription>{enrollmentMessage}</AlertDescription>
            </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-center gap-2">
        {status === 'camera_on' && <Button onClick={takePicture}>Take Picture</Button>}
        {(status === 'picture_taken' || status === 'enrollment_failed') && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retake
            </Button>
            <Button onClick={handleEnrollment}>Enroll This Picture</Button>
          </div>
        )}
         {status === 'enrolling' && (
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enrolling...
          </Button>
        )}
        {status === 'enrolled' && isPartOfRegistration && (
            <p className="text-green-600 font-semibold text-center">Enrollment successful! Completing registration...</p>
        )}
      </CardFooter>
    </Wrapper>
  );
}
