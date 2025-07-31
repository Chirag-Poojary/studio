import { DashboardHeader } from '@/components/dashboard-header';
import { FaceEnrollment } from '@/components/student/face-enrollment';
import { AttendanceHistory } from '@/components/student/attendance-history';

export default function StudentDashboard() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <DashboardHeader userType="Student" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40">
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-semibold mb-4">Welcome, Student!</h1>
          </div>
          <FaceEnrollment />
          <AttendanceHistory />
        </div>
      </main>
    </div>
  );
}
