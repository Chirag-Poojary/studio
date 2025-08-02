'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, Users, XCircle, CheckCircle, Hourglass } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardHeader } from '@/components/dashboard-header';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

type Student = {
  name: string;
  rollNo: string;
  email: string;
};

export default function SessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;

  const [attendedStudents, setAttendedStudents] = useState<Student[]>([]);
  const [sessionActive, setSessionActive] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0); 

  const lectureDetails = useMemo(() => {
    return {
      department: searchParams.get('department') || 'N/A',
      year: searchParams.get('year') || 'N/A',
      division: searchParams.get('division') || 'N/A',
      subject: searchParams.get('subject') || 'N/A',
      lectureDate: searchParams.get('lectureDate') ? new Date(searchParams.get('lectureDate')!).toLocaleDateString() : 'N/A',
      lectureTime: searchParams.get('lectureTime') || 'N/A',
    };
  }, [searchParams]);

  useEffect(() => {
    setIsClient(true);
    const urlToEncode = `${window.location.origin}/attend?sessionId=${sessionId}`;
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(urlToEncode)}`);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    
    const sessionDocRef = doc(db, 'sessions', sessionId);
    const unsubscribe = onSnapshot(sessionDocRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            setAttendedStudents(data.attendedStudents || []);
            setSessionActive(data.active);
            setTotalStudents(data.totalStudents || 60); // Mock total students or get from session data
        }
    });

    return () => unsubscribe();
  }, [sessionId]);

  const endSession = async () => {
    if (sessionId) {
      const sessionDocRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionDocRef, { active: false });
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <DashboardHeader userType="Professor" />
      <main className="flex-1 p-4 md:p-8 bg-muted/40">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{lectureDetails.subject}</CardTitle>
                <CardDescription>
                  {lectureDetails.department} - {lectureDetails.year} (Div: {lectureDetails.division})
                </CardDescription>
                 <div className="flex items-center text-sm text-muted-foreground pt-2">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>{lectureDetails.lectureDate} at {lectureDetails.lectureTime}</span>
                </div>
              </CardHeader>
              <CardContent>
                <Alert variant={sessionActive ? "default" : "destructive"}>
                  {sessionActive ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  <AlertTitle>{sessionActive ? "Session is Live" : "Session Ended"}</AlertTitle>
                  <AlertDescription>
                    {sessionActive ? "Students can now scan the QR code to mark their attendance." : "This attendance session is no longer active."}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle>Real-time Attendance</CardTitle>
                        <CardDescription>
                            Students who have successfully checked in will appear here.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <span className="font-bold text-2xl">{attendedStudents.length}</span>
                        <span className="text-sm text-muted-foreground">/ {totalStudents}</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {attendedStudents.length > 0 ? attendedStudents.map((student, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarImage src={`https://placehold.co/40x40.png?text=${student.name.charAt(0)}`} />
                                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{student.name}</p>
                                        <p className="text-sm text-muted-foreground">Roll No: {student.rollNo}</p>
                                    </div>
                                </div>
                                <Badge variant="secondary">Checked In</Badge>
                            </div>
                        )) : (
                             <div className="text-center py-8 text-muted-foreground">
                                <Hourglass className="mx-auto h-8 w-8 mb-2"/>
                                <p>Waiting for students to check in...</p>
                             </div>
                        )}
                    </div>
                </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Scan to Attend</CardTitle>
                <CardDescription>
                  {sessionActive ? "Students should scan this code." : "This code is now inactive."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isClient && qrCodeUrl ? (
                  <div className={`relative w-[250px] h-[250px] mx-auto ${!sessionActive ? 'opacity-20' : ''}`}>
                    <Image
                      src={qrCodeUrl}
                      alt="Lecture QR Code"
                      width={250}
                      height={250}
                      className="rounded-lg border"
                    />
                  </div>
                ) : (
                  <Skeleton className="w-[250px] h-[250px] mx-auto rounded-lg" />
                )}
              </CardContent>
            </Card>
            <Button 
                onClick={endSession} 
                disabled={!sessionActive} 
                className="w-full" 
                variant="destructive"
                size="lg"
            >
              <XCircle className="mr-2 h-4 w-4" />
              End Session
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
