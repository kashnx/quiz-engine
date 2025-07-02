"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { QuizifyButton } from '@/components/custom/Quizify-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Loader2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import {cn} from '@/lib/utils';

const GoogleIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24"
    className="text-black"
  >
    <path 
      fill="currentColor"
      d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.19,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.19,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.19,22C17.6,22 21.5,18.33 21.5,12.33C21.5,11.76 21.35,11.1 21.35,11.1Z" 
    />
  </svg>
);

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/profile');
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('ACCESS GRANTED. WELCOME SOLDIER.');
      router.push('/my-quizzes');
    } catch (error) {
      const firebaseError = error as FirebaseError;
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        toast.error('MISSION ABORTED: SIGN-IN WINDOW TERMINATED');
      } else if (firebaseError.code === 'auth/cancelled-popup-request') {
        toast.error('MULTIPLE ACCESS ATTEMPTS DETECTED');
      } else {
        console.error('AUTHENTICATION FAILURE:', error);
        toast.error(firebaseError.message || 'SECURITY BREACH: ACCESS DENIED');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading || user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-[#00f0ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-4 border-[#ff4d00] bg-[#0a0a0a]">
        <CardHeader className="items-center text-center border-b-4 border-[#ff4d00] pb-8">
          <div className="w-20 h-20 bg-[#00f0ff] rounded-full flex items-center justify-center mb-4">
            <Lock className="h-10 w-10 text-black" />
          </div>
          <CardTitle className="text-3xl font-black uppercase tracking-wider text-[#00f0ff]">
            SECURE ACCESS
          </CardTitle>
          <CardDescription className="text-gray-400 font-mono mt-2">
            // IDENTIFICATION REQUIRED //
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-6">
            <p className="text-gray-300 text-center font-mono">
              VERIFY YOUR IDENTITY TO ACCESS THE QUIZ WARZONE
            </p>
            
            <QuizifyButton
              className={cn(
                "w-full py-4 text-lg font-black uppercase tracking-wider border-4",
                isSigningIn 
                  ? "border-gray-700 text-gray-500 bg-black cursor-not-allowed"
                  : "border-[#00f0ff] bg-[#00f0ff] text-black hover:bg-black hover:text-[#00f0ff] transition-all duration-200"
              )}
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
            >
              {isSigningIn ? (
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
              ) : (
                <div className="mr-3">
                  <GoogleIcon />
                </div>
              )}
              {isSigningIn ? 'AUTHENTICATING...' : 'GOOGLE SECURE LOGIN'}
            </QuizifyButton>

            <div className="border-t-4 border-[#ff4d00] pt-6">
              <p className="text-xs text-gray-500 font-mono text-center">
                WARNING: UNAUTHORIZED ACCESS WILL BE MET WITH EXTREME PREJUDICE
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}