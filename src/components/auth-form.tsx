
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
import { Mail, Lock, Loader2 } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid Outlook email address.' }).refine(
    (email) => email.endsWith('@vit.edu.in'),
    { message: 'Please use your college-provided Outlook ID (e.g., name@vit.edu.in).' }
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
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    const { email, password } = data;

    if (activeTab === 'register') {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store user role in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: role,
        });

        toast({
          title: 'Registration Successful!',
          description: 'You can now log in with your new credentials.',
        });
        setActiveTab('login');
        form.reset();
      } catch (error: any) {
        console.error("Registration error:", error);
        toast({
          variant: 'destructive',
          title: 'Registration Failed',
          description: error.message || 'An unknown error occurred.',
        });
      }
    } else { // Login
      try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Login Successful!',
          description: 'Redirecting to your dashboard...',
        });
        setTimeout(() => {
          const dashboardUrl = role === 'professor' ? '/professor-dashboard' : '/student-dashboard';
          router.push(dashboardUrl);
        }, 1000);
      } catch (error: any) {
        console.error("Login error:", error);
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: error.message || 'Invalid credentials or user not found.',
        });
      }
    }
    setIsLoading(false);
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
            <TabsTrigger value="login" disabled={isLoading}>Login</TabsTrigger>
            <TabsTrigger value="register" disabled={isLoading}>Register</TabsTrigger>
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
                           <Input placeholder="your.name@vit.edu.in" {...field} className="pl-10" />
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Login'}
                </Button>
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
                           <Input placeholder="your.name@vit.edu.in" {...field} className="pl-10" />
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Register'}
                </Button>
              </form>
             </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
