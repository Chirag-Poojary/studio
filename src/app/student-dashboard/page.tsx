
'use client'

import { DashboardHeader } from '@/components/dashboard-header';
import { AttendanceHistory } from '@/components/student/attendance-history';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { LogOut, QrCode } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck } from 'lucide-react';
import { FaceEnrollment } from '@/components/student/face-enrollment';
import Link from 'next/link';

export default function StudentDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    // In a real app, you would clear the session/token here
    router.push('/');
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <DashboardHeader userType="Student">
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </DashboardHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40">
         <div className="grid gap-4 md:grid-cols-2 md:gap-8">
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-6 w-6 text-primary"/>
                            Student Dashboard
                        </CardTitle>
                        <CardDescription>Welcome! Here you can view your attendance history and manage your biometric enrollment.</CardDescription>
                    </CardHeader>
                     <CardContent>
                        <p className="text-sm text-muted-foreground">To mark your attendance, use your phone's camera to scan the QR code displayed by your professor. This will open the verification page in your browser.</p>
                    </CardContent>
                </Card>
                
                <FaceEnrollment />
            </div>

            <AttendanceHistory />
        </div>
      </main>
    </div>
  );
}
