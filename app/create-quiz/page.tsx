"use client"

import React from "react"
import { useState, useEffect, useTransition, useActionState } from "react"
import { useRouter } from "next/navigation"
import { QuizifyButton } from "@/components/custom/Quizify-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FileText, Loader2, AlertCircle, AlertTriangle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"
import { createQuizAction } from "./actions"
import type { QuizData } from "@/ai/flows/create-quiz-flow"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PDFDocument } from 'pdf-lib';
import { upload_limit, questions_range, pages_limit } from "@/config/upload";

const initialState: { quiz?: QuizData; pdfStorageUrl?: string; error?: string; message?: string } = {};

export default function CreateQuizPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [questionCount, setQuestionCount] = useState("10")
  const [progressValue, setProgressValue] = useState(0)
  const [isSaving, setIsSaving] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    type: 'file' | 'ai' | 'storage' | 'general' | 'payload';
    message: string;
    details?: string;
  } | null>(null);

  const [isPendingAction, startTransition] = useTransition();
  const [formState, formAction] = useActionState(createQuizAction, initialState);

  const progressIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setErrorDetails(null);

    if (file) {
      if (file.type === "application/pdf") {
        if (file.size <= upload_limit * 1024 * 1024) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pageCount = pdfDoc.getPageCount();

            if (pageCount > pages_limit) {
              setErrorDetails({
                type: 'file',
                message: "DOCUMENT TOO LARGE",
                details: `MAXIMUM ${pages_limit} PAGES. SPLIT YOUR FILE.`
              });
              setSelectedFile(null);
              event.target.value = "";
              return;
            }

            setSelectedFile(file);
            setProgressValue(0);
          } catch (error) {
            console.error("Error reading PDF:", error);
            setErrorDetails({
              type: 'file',
              message: "CORRUPTED FILE",
              details: "UNABLE TO PROCESS DOCUMENT. TRY AGAIN."
            });
            setSelectedFile(null);
            event.target.value = "";
          }
        } else {
          setErrorDetails({
            type: 'file',
            message: "FILE TOO HEAVY",
            details: `MAXIMUM ${upload_limit}MB. COMPRESS OR SPLIT.`
          });
          setSelectedFile(null);
          event.target.value = "";
        }
      } else {
        setErrorDetails({
          type: 'file',
          message: "INVALID FORMAT",
          details: "PDF FILES ONLY."
        });
        setSelectedFile(null);
        event.target.value = "";
      }
    } else {
      setSelectedFile(null);
    }
  }

  useEffect(() => {
    if (formState?.message && !formState.error && formState.quiz && user) {
      const saveData = async () => {
        setIsSaving(true);
        toast.loading("SECURING QUIZ IN DATABASE...", { id: "saving-toast" });

        const quizDataFromAI = formState.quiz!;

        const quizToSave = {
          id: quizDataFromAI.id,
          title: quizDataFromAI.title,
          description: quizDataFromAI.description,
          questionCount: quizDataFromAI.questionCount,
          questions: quizDataFromAI.questions,
          userId: user.uid,
          createdAt: serverTimestamp(),
          isPublic: true,
          ...(formState.pdfStorageUrl && { pdfStorageUrl: formState.pdfStorageUrl }),
        };

        try {
          const quizDocRef = doc(db, 'quizzes', quizDataFromAI.id);
          await setDoc(quizDocRef, quizToSave);
          toast.dismiss("saving-toast");
          toast.success('QUIZ LOCKED AND LOADED!');
          router.push("/my-quizzes");
        } catch (dbError) {
          console.error("Firestore save error:", dbError);
          toast.dismiss("saving-toast");
          toast.error(`DATABASE FAILURE: ${dbError instanceof Error ? dbError.message : "UNKNOWN ERROR"}`);
        } finally {
          setIsSaving(false);
        }
      };
      saveData();
    }
    if (formState?.error) {
      toast.error(formState.error.toUpperCase());
    }
  }, [formState, router, user]);

  useEffect(() => {
    if (formState?.error) {
      let errorMessage = formState.error;
      let errorType: 'file' | 'ai' | 'storage' | 'general' | 'payload' = 'general';
      let details = '';

      if (errorMessage.includes('Content Too Large') || errorMessage.includes('Request Entity Too Large') || errorMessage.includes('413')) {
        errorType = 'payload';
        errorMessage = "DATA OVERLOAD";
        details = "REDUCE FILE SIZE OR QUESTION COUNT.";
      } else if (errorMessage.includes('PDF') || errorMessage.includes('file')) {
        errorType = 'file';
      } else if (errorMessage.includes('AI') || errorMessage.includes('generation')) {
        errorType = 'ai';
      } else if (errorMessage.includes('Storage') || errorMessage.includes('upload')) {
        errorType = 'storage';
      }

      if (errorType !== 'payload' && errorMessage.includes(':')) {
        const [mainMessage, detail] = errorMessage.split(':');
        details = detail.trim();
        errorMessage = mainMessage.trim();
      }

      setErrorDetails({
        type: errorType,
        message: errorMessage.toUpperCase(),
        details: details.toUpperCase()
      });
    }
  }, [formState?.error]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      toast.error("ACCESS DENIED: LOGIN REQUIRED");
      router.push('/login');
      return;
    }
    if (!selectedFile || !questionCount) {
      toast.error("MISSING INPUT: PDF AND QUESTION COUNT REQUIRED")
      return
    }
    const count = Number.parseInt(questionCount)
    if (count < questions_range[0] || count > questions_range[1]) {
      toast.error(`INVALID RANGE: ${questions_range[0]}-${questions_range[1]} QUESTIONS ONLY`)
      return
    }

    const formData = new FormData();
    formData.append('pdfFile', selectedFile);
    formData.append('questionCount', questionCount);
    formData.append('userId', user.uid);

    setProgressValue(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      setProgressValue((prev) => {
        if (prev >= 90) {
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 300);

    startTransition(() => {
      formAction(formData);
    });
  };

  useEffect(() => {
    if (!isPendingAction) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      if (formState?.quiz) {
        setProgressValue(100);
      } else if (formState?.error) {
        setTimeout(() => setProgressValue(0), 1000);
      }
    }
  }, [isPendingAction, formState]);

  if (authLoading || (!authLoading && !user)) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-[#00f0ff]" />
      </div>
    );
  }

  const isProcessing = isPendingAction || isSaving;

  return (
    <div className="min-h-screen bg-black text-white py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-10 border-b-4 border-[#ff4d00] pb-6">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider mb-2">
            <span className="text-[#00f0ff]">FORGE</span> YOUR QUIZ
          </h1>
          <p className="text-gray-400 font-mono">
            // UPLOAD. PROCESS. DOMINATE. //
          </p>
        </div>

        <Card className="border-4 border-[#00f0ff] bg-[#0a0a0a]">
          <CardHeader className="border-b-4 border-[#00f0ff]">
            <CardTitle className="text-2xl font-black uppercase tracking-wider text-[#ff4d00]">
              QUIZ GENERATOR 9000
            </CardTitle>
            <CardDescription className="text-gray-400 font-mono">
              FEED IT DOCUMENTS. IT SPITS OUT CHALLENGES.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <Label htmlFor="pdf-upload" className="block text-lg font-black uppercase tracking-wider mb-3 text-[#00f0ff]">
                  DOCUMENT INPUT
                </Label>
                <p className="text-gray-400 font-mono text-sm mb-4">
                  MAX {upload_limit}MB / {pages_limit} PAGES. NO COMPROMISES.
                </p>
                <div
                  className={cn(
                    "p-8 text-center transition-all duration-300 border-4",
                    selectedFile
                      ? "border-[#ff4d00] bg-[#1a0a0a]"
                      : "border-dashed border-[#00f0ff] hover:border-[#ff4d00] bg-[#0a0a0a]",
                    isProcessing && "opacity-70"
                  )}
                >
                  <input 
                    id="pdf-upload" 
                    name="pdfFile" 
                    type="file" 
                    accept=".pdf" 
                    onChange={handleFileChange} 
                    className="hidden" 
                    disabled={isProcessing} 
                  />
                  <label 
                    htmlFor="pdf-upload" 
                    className={cn(
                      "cursor-pointer block w-full",
                      isProcessing ? "cursor-not-allowed" : ""
                    )}
                  >
                    {selectedFile ? (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 bg-[#ff4d00] rounded-full flex items-center justify-center">
                          <FileText className="h-10 w-10 text-black" />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-white">{selectedFile.name}</p>
                          <p className="text-sm text-gray-400 font-mono">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 border-4 border-[#00f0ff] rounded-full flex items-center justify-center">
                          <Plus className="h-10 w-10 text-[#00f0ff]" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white">DRAG & DROP</p>
                          <p className="text-sm text-gray-400 font-mono">PDF FILES ONLY</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {errorDetails && (
                <Alert className={cn(
                  "border-4 font-mono",
                  errorDetails.type === 'file' && "border-[#ff4d00] bg-[#1a0a0a] text-[#ff4d00]",
                  errorDetails.type === 'ai' && "border-[#00f0ff] bg-[#0a1a1a] text-[#00f0ff]",
                  errorDetails.type === 'storage' && "border-[#ff0000] bg-[#1a0a0a] text-[#ff0000]",
                  errorDetails.type === 'payload' && "border-[#ff00ff] bg-[#1a0a1a] text-[#ff00ff]",
                  errorDetails.type === 'general' && "border-[#ff4d00] bg-[#1a0a0a] text-[#ff4d00]"
                )}>
                  <AlertCircle className="h-6 w-6" />
                  <AlertTitle className="font-black uppercase tracking-wider">
                    {errorDetails.message}
                  </AlertTitle>
                  {errorDetails.details && (
                    <AlertDescription className="text-sm mt-2">
                      {errorDetails.details}
                    </AlertDescription>
                  )}
                </Alert>
              )}

              <div className="space-y-4">
                <Label htmlFor="question-count" className="block text-lg font-black uppercase tracking-wider text-[#00f0ff]">
                  QUESTION QUOTA
                </Label>
                <Input
                  id="question-count"
                  name="questionCount"
                  type="number"
                  placeholder={`ENTER ${questions_range[0]}-${questions_range[1]}`}
                  value={questionCount}
                  onChange={(e) => {
                    setQuestionCount(e.target.value);
                    setErrorDetails(null);
                  }}
                  min={questions_range[0].toString()}
                  max={questions_range[1].toString()}
                  className="bg-black border-4 border-[#00f0ff] text-white py-4 px-6 font-mono focus:border-[#ff4d00] focus:ring-0"
                  disabled={isProcessing}
                />
              </div>

              {(isPendingAction || isSaving) && (
                <div className="space-y-6 pt-4">
                  <div className="flex items-center space-x-4">
                    <Loader2 className="h-6 w-6 animate-spin text-[#00f0ff]" />
                    <span className="text-lg font-mono">
                      {isPendingAction ? "CRUNCHING DATA..." : "SECURING QUIZ..."}
                    </span>
                  </div>
                  <Progress 
                    value={progressValue} 
                    className="w-full h-3 bg-black border-2 border-[#00f0ff]"
                    indicatorClassName={cn(
                      isPendingAction ? "bg-[#00f0ff]" : "bg-[#ff4d00]"
                    )}
                  />
                  <div className="text-right font-mono text-sm text-gray-400">
                    {progressValue.toFixed(0)}% COMPLETE
                  </div>
                </div>
              )}

              <QuizifyButton
                type="submit"
                className={cn(
                  "w-full py-6 text-lg font-black uppercase tracking-wider border-4",
                  isProcessing || !selectedFile || !questionCount 
                    ? "border-gray-700 text-gray-500 bg-black cursor-not-allowed"
                    : "border-[#ff4d00] bg-[#ff4d00] text-black hover:bg-black hover:text-[#ff4d00] transition-all duration-200"
                )}
                disabled={isProcessing || !selectedFile || !questionCount}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    {isPendingAction ? "PROCESSING..." : "SECURING..."}
                  </>
                ) : (
                  <>
                    <Plus className="mr-3 h-6 w-6" />
                    FORGE QUIZ
                  </>
                )}
              </QuizifyButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}