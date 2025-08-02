
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
import { Mail, Lock, Loader2, ArrowLeft, User, UserCheck } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { FaceEnrollment } from '@/components/student/face-enrollment';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid Outlook email address.' }).refine(
    (email) => email.endsWith('@vit.edu.in'),
    { message: 'Please use your college-provided Outlook ID (e.g., name@vit.edu.in).' }
  ),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
});

type FormValues = z.infer<typeof formSchema>;
type RegistrationStep = 'details' | 'face-enrollment';

export function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const role = searchParams.get('role') || 'student';
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('details');
  const [registrationData, setRegistrationData] = useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleRegistrationSubmit = async (data: FormValues) => {
    setIsLoading(true);
    if (role === 'student') {
      setRegistrationData(data);
      setRegistrationStep('face-enrollment');
    } else {
      await completeRegistration(data);
    }
    setIsLoading(false);
  };
  
  const completeRegistration = async (data: FormValues, faceDataUri?: string) => {
    setIsLoading(true);
    const { email, password } = data;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData: { email: string | null; role: string; faceDataUri?: string } = {
        email: user.email,
        role: role,
      };

      if (role === 'student' && faceDataUri) {
        userData.faceDataUri = faceDataUri;
      }

      await setDoc(doc(db, 'users', user.uid), userData);

      toast({
        title: 'Registration Successful!',
        description: 'You can now log in with your new credentials.',
      });
      setActiveTab('login');
      setRegistrationStep('details');
      form.reset();
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceEnrolled = (faceDataUri: string) => {
    if (registrationData) {
      completeRegistration(registrationData, faceDataUri);
    }
  };

  const handleLoginSubmit = async (data: FormValues) => {
    setIsLoading(true);
    const { email, password } = data;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      const userDocRef = doc(db, 'users', auth.currentUser!.uid);
      const userDoc = await getDoc(userDocRef);
      const userRole = userDoc.exists() ? userDoc.data().role : 'student';

      toast({
        title: 'Login Successful!',
        description: 'Redirecting to your dashboard...',
      });

      const dashboardUrl = userRole === 'professor' ? '/professor-dashboard' : '/student-dashboard';
      router.push(dashboardUrl);

    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'Invalid credentials or user not found.',
      });
    } finally {
        setIsLoading(false);
    }
  };

  const roleTitle = role.charAt(0).toUpperCase() + role.slice(1);
  
  const renderRegisterForm = () => {
    if (role === 'student' && registrationStep === 'face-enrollment') {
      return (
        <div>
           <Button variant="ghost" size="sm" onClick={() => { setRegistrationStep('details'); setIsLoading(false); }} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Details
          </Button>
          <FaceEnrollment onEnrollmentComplete={handleFaceEnrolled} isPartOfRegistration={true} />
        </div>
      );
    }
    return (
       <Form {...form}>
        <form onSubmit={form.handleSubmit(handleRegistrationSubmit)} className="space-y-6 pt-4">
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
            {isLoading ? <Loader2 className="animate-spin" /> : (role === 'student' ? 'Next: Enroll Face' : 'Register')}
          </Button>
        </form>
       </Form>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            {role === 'student' ? <UserCheck /> : <User />}
            {roleTitle} Portal
        </CardTitle>
        <CardDescription>
          {activeTab === 'login' 
            ? 'Sign in to your account' 
            : (registrationStep === 'details' ? 'Create a new account' : 'Step 2: Face Enrollment')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(tab) => { setActiveTab(tab); setRegistrationStep('details'); form.reset(); setIsLoading(false); }} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" disabled={isLoading}>Login</TabsTrigger>
            <TabsTrigger value="register" disabled={isLoading || (role === 'student' && registrationStep === 'face-enrollment')}>Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
             <Form {...form}>
              <form onSubmit={form.handleSubmit(handleLoginSubmit)} className="space-y-6 pt-4">
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
            {renderRegisterForm()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
