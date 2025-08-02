
'use client'

import { DashboardHeader } from '@/components/dashboard-header';
import { AttendanceHistory } from '@/components/student/attendance-history';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { LogOut, QrCode } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function StudentDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    // In a real app, you would clear the session/token here
    router.push('/');
  };

  const handleScan = () => {
    // In a real application, you would navigate to a dedicated scanner page.
    // For this prototype, we'll assume the user scans the QR with their phone's camera,
    // which opens the /attend page. This button is for guidance.
    router.push('/attend'); 
  }

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
                        <CardDescription>Welcome! View your attendance history or scan a code to mark attendance.</CardDescription>
                    </CardHeader>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <QrCode className="h-6 w-6 text-primary"/>
                            Mark Attendance
                        </CardTitle>
                        <CardDescription>Ready to check in for your lecture?</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert>
                            <AlertTitle>How to Mark Attendance</AlertTitle>
                            <AlertDescription>
                                Use your phone's camera to scan the QR code your professor is displaying. This will take you to the verification page to mark your attendance.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>

            <AttendanceHistory />
        </div>
      </main>
    </div>
  );
}
