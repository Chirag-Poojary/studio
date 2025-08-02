'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LectureForm } from '@/components/professor/lecture-form';
import { DashboardHeader } from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';


export default function ProfessorDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    // In a real app, you would clear the session/token here
    router.push('/');
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <DashboardHeader userType="Professor">
         <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </DashboardHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40">
        <div className="grid gap-4 md:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Create New Lecture Session</CardTitle>
              <CardDescription>
                Fill in the details below to start a new attendance session and generate a QR code for students.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LectureForm />
            </CardContent>
          </Card>
          {/* Future implementation: Display past lecture sessions here */}
        </div>
      </main>
    </div>
  );
}
