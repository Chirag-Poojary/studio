'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const mockHistory = [
  { subject: 'Data Structures', date: '2023-10-26', status: 'Present' },
  { subject: 'Algorithms', date: '2023-10-25', status: 'Present' },
  { subject: 'Database Systems', date: '2023-10-24', status: 'Absent' },
  { subject: 'Operating Systems', date: '2023-10-23', status: 'Present' },
  { subject: 'Computer Networks', date: '2023-10-22', status: 'Present' },
  { subject: 'Software Engineering', date: '2023-10-21', status: 'Present' },
];

export function AttendanceHistory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance History</CardTitle>
        <CardDescription>A log of your attendance records for recent lectures.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4 pr-4">
            {mockHistory.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.subject}</p>
                    <p className="text-sm text-muted-foreground">{item.date}</p>
                  </div>
                  <Badge variant={item.status === 'Present' ? 'default' : 'destructive'} className={item.status === 'Present' ? 'bg-green-500' : ''}>
                    {item.status}
                  </Badge>
                </div>
                {index < mockHistory.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
