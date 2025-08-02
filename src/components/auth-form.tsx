
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
import { Mail, Lock, Loader2, ArrowLeft, User, UserCheck, Library } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { FaceEnrollment } from '@/components/student/face-enrollment';
import { enrollFace } from '@/ai/flows/enroll-face';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid Outlook email address.' }).refine(
    (email) => email.endsWith('@vit.edu.in'),
    { message: 'Please use your college-provided Outlook ID (e.g., name@vit.edu.in).' }
  ),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
  rollNo: z.string().min(1, { message: "Roll number is required."}).optional(),
}).refine(data => {
    // make rollNo required for students
    const role = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('role') || 'student';
    return role !== 'student' || (data.rollNo && data.rollNo.length > 0);
}, {
    message: "Roll number is required for students.",
    path: ["rollNo"],
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
      rollNo: '',
    },
  });

  const handleRegistrationDetailsSubmit = (data: FormValues) => {
    if (role === 'student') {
      setRegistrationData(data);
      setRegistrationStep('face-enrollment');
    } else {
      completeRegistration(data);
    }
  };
  
  const completeRegistration = async (data: FormValues, faceDataUri?: string) => {
    setIsLoading(true);
    const { email, password, rollNo } = data;
    try {
      // Step 1: Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 2: Prepare user data for Firestore
      const userData: { email: string | null; role: string; faceDataUri?: string; rollNo?: string } = {
        email: user.email,
        role: role,
      };

      if (role === 'student') {
        if (faceDataUri) {
            userData.faceDataUri = faceDataUri;
        } else {
            throw new Error("Face enrollment is required for student registration.");
        }
        if (rollNo) {
            userData.rollNo = rollNo;
        }
      }

      // Step 3: Save user data to Firestore
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
        description: error.code === 'auth/email-already-in-use' 
            ? 'This email is already registered. Please log in.' 
            : (error.message || 'An unknown error occurred.'),
      });
      setRegistrationStep('details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceEnrolled = async (faceDataUri: string) => {
      if (registrationData) {
          setIsLoading(true);
          try {
              const result = await enrollFace({
                  studentPhotoDataUri: faceDataUri,
                  studentId: registrationData.rollNo || `temp-id-${Date.now()}` // Use roll no or temp id
              });

              if (result.success) {
                  // Now that face enrollment is verified by AI, complete the registration
                  await completeRegistration(registrationData, faceDataUri);
              } else {
                  throw new Error(result.message || "Face enrollment failed AI check.");
              }
          } catch (error: any) {
              toast({
                  variant: 'destructive',
                  title: 'Enrollment Failed',
                  description: error.message || "Could not complete registration."
              });
              setIsLoading(false);
          }
      }
  };


  const handleLoginSubmit = async (data: FormValues) => {
    setIsLoading(true);
    const { email, password } = data;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userRole = userDoc.data().role;
         toast({
          title: 'Login Successful!',
          description: 'Redirecting to your dashboard...',
        });

        const dashboardUrl = userRole === 'professor' ? '/professor-dashboard' : '/student-dashboard';
        router.push(dashboardUrl);
      } else {
         throw new Error("User role not found in database.");
      }

    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.code === 'auth/invalid-credential' ? 'Invalid email or password.' : 'An error occurred during login.',
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
        <form onSubmit={form.handleSubmit(handleRegistrationDetailsSubmit)} className="space-y-6 pt-4">
           {role === 'student' && (
              <FormField
                control={form.control}
                name="rollNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roll Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                         <Library className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                         <Input placeholder="e.g. S21101" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
           )}
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
            <TabsTrigger value="login" disabled={isLoading || (role === 'student' && registrationStep === 'face-enrollment')}>Login</TabsTrigger>
            <TabsTrigger value="register" disabled={isLoading}>Register</TabsTrigger>
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
