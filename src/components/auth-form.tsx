'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid Outlook email address.' }).refine(
    (email) => email.endsWith('.edu'),
    { message: 'Please use your college-provided Outlook ID (e.g., name@college.edu).' }
  ),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
});

type FormValues = z.infer<typeof formSchema>;

export function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const role = searchParams.get('role') || 'student';
  const [activeTab, setActiveTab] = useState('login');
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    // Mocking auth logic
    console.log({ action: activeTab, role, data });

    if (activeTab === 'register') {
      toast({
        title: 'Registration Successful!',
        description: 'You can now log in with your new credentials.',
      });
      // In a real app, you would handle user creation here.
      // For this demo, we'll just switch to the login tab.
      setActiveTab('login'); 
      form.reset();
    } else {
      toast({
        title: 'Login Successful!',
        description: 'Redirecting to your dashboard...',
      });
       // In a real app, you would handle login and session management here.
      setTimeout(() => {
        const dashboardUrl = role === 'professor' ? '/professor-dashboard' : '/student-dashboard';
        router.push(dashboardUrl);
      }, 1000);
    }
  };

  const roleTitle = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{roleTitle} Portal</CardTitle>
        <CardDescription>
          {activeTab === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
             <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                 <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                           <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input placeholder="your.name@college.edu" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                       <FormControl>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="••••••••" {...field} className="pl-10"/>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Login</Button>
              </form>
             </Form>
          </TabsContent>
          <TabsContent value="register">
             <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                 <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                           <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input placeholder="your.name@college.edu" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Create Password</FormLabel>
                       <FormControl>
                         <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="Choose a strong password" {...field} className="pl-10" />
                         </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Register</Button>
              </form>
             </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
