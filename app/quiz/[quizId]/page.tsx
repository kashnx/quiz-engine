"use client"

import {useState, useEffect, useCallback, useTransition} from "react"
import {useRouter, useParams} from "next/navigation"
import Link from "next/link";
import {QuizifyButton} from "@/components/custom/Quizify-button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group"
import {Label} from "@/components/ui/label"
import {Progress} from "@/components/ui/progress"
import {Clock, ChevronLeft, ChevronRight, Loader2, CopyPlus, Users} from "lucide-react" 
import type { QuizData } from "@/ai/flows/create-quiz-flow"
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase"; 
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/auth-context"; 
import toast from "react-hot-toast";
import { cloneQuizAction } from "./actions"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function QuizPage() {
    const router = useRouter(); 
    const params = useParams<{ quizId: string; }>(); 
    const { user, loading: authLoading } = useAuth(); 

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, number>>({})
    const [timeLeft, setTimeLeft] = useState(1800) // 30 minutes
    const [quiz, setQuiz] = useState<QuizData | null>(null);
    const [isLoadingQuiz, setIsLoadingQuiz] = useState(true); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isForeignQuiz, setIsForeignQuiz] = useState(false);
    const [isCloning, startCloningTransition] = useTransition();


    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const currentQuizId = params.quizId;
        if (currentQuizId) { 
            const fetchQuiz = async () => {
                setIsLoadingQuiz(true);
                setIsForeignQuiz(false); 
                try {
                    
                    const quizDocRef = doc(db, "quizzes", currentQuizId as string); 
                    const quizDocSnap = await getDoc(quizDocRef);

                    if (quizDocSnap.exists()) {
                        const fetchedQuizData = { id: quizDocSnap.id, ...quizDocSnap.data(), userId: quizDocSnap.data()?.userId || null } as QuizData;
                        setQuiz(fetchedQuizData);
                        setAnswers({}); 
                        if (user && fetchedQuizData.userId !== user.uid) {
                            setIsForeignQuiz(true);
                            console.log("QuizPage: This is a foreign quiz. Owner:", fetchedQuizData.userId, "Current user:", user.uid);
                        } else if (user && fetchedQuizData.userId === user.uid) {
                            console.log("QuizPage: This quiz belongs to the current user.");
                        }
                    } else {
                        setQuiz(null);
                        toast.error("Quiz not found.");
                    }
                } catch (error) {
                    console.error("QuizPage: Error fetching quiz:", error);
                    toast.error("Failed to load quiz.");
                    setQuiz(null);
                }
                setIsLoadingQuiz(false);
            };
            fetchQuiz();
        } else {
            setIsLoadingQuiz(false); 
            setQuiz(null);
            console.error("QuizPage: quizId is missing from URL params.");
        }
    }, [params.quizId, user, authLoading]);

    const handleSubmitQuiz = useCallback(async () => {
        if (!quiz || isSubmitting || !user || isForeignQuiz) {
            return;
        }
        setIsSubmitting(true);
        toast.loading("Submitting your answers...", { id: "submit-toast"});
        let submissionSuccessful = false;

        try {
            let correct = 0
            quiz.questions.forEach((question) => {
                if (answers[question.id] === question.correctAnswerIndex) {
                    correct++
                }
            })
            const score = Math.round((correct / quiz.questions.length) * 100)

            const resultData = {
                quizId: quiz.id, 
                userId: user.uid, 
                answers,
                score,
                correct,
                total: quiz.questions.length,
                questionsSnapshot: quiz.questions, 
                quizTitle: quiz.title,
                submittedAt: serverTimestamp(), 
            };

            const resultDocRef = await addDoc(collection(db, "quizResults"), resultData);
            toast.dismiss("submit-toast");
            toast.success("Quiz submitted! Taking you to results...");
            router.push(`/quiz/${quiz.id}/results/${resultDocRef.id}`);
            submissionSuccessful = true;
            // Do not set isSubmitting to false here; overlay persists until unmount
        } catch (error) {
            console.error("QuizPage: Error submitting quiz results:", error);
            toast.dismiss("submit-toast");
            toast.error("Failed to submit your results. Please try again.");
            // Error occurred, isSubmitting will be set to false in finally
        } finally {
            if (!submissionSuccessful) {
                setIsSubmitting(false); // Only hide overlay if submission failed before navigation
            }
        }
    }, [quiz, isSubmitting, user, answers, router, isForeignQuiz]);

    useEffect(() => {
        if (!quiz || isLoadingQuiz || isSubmitting || authLoading || !user || isForeignQuiz || isCloning) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (!isSubmitting) handleSubmitQuiz(); 
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [quiz, isLoadingQuiz, isSubmitting, authLoading, user, handleSubmitQuiz, isForeignQuiz, isCloning]);

    const handleCloneAndStartQuiz = async () => {
        if (!user || !quiz || !params.quizId) {
            toast.error("Cannot add quiz. User or quiz data is missing.");
            return;
        }
        
        startCloningTransition(async () => {
            const toastId = "cloning-toast";
            toast.loading("Adding quiz to your collection...", { id: toastId });
            try {
                const idToken = await user.getIdToken(true);
                if (!idToken || typeof idToken !== 'string' || idToken.trim() === '') {
                    toast.dismiss(toastId);
                    toast.error("Authentication error: Could not retrieve a valid token. Please sign out and sign in again.");
                    console.error("handleCloneAndStartQuiz: Failed to get ID token from user or token is invalid/empty.");
                    return; 
                }

                const result = await cloneQuizAction(params.quizId as string, idToken);

                if (result.newQuizId) {
                    toast.dismiss(toastId);
                    toast.success(result.message || "Quiz added successfully!");
                    router.push(`/quiz/${result.newQuizId}`);
                } else {
                    toast.dismiss(toastId);
                    toast.error(result.error || "Failed to add quiz to your collection.");
                }
            } catch (error) {
                toast.dismiss(toastId);
                console.error("Error cloning quiz:", error);
                toast.error("An unexpected error occurred while adding the quiz.");
            }
        });
    };


    const handleAnswerChange = (questionId: string, answerIndex: number) => {
        setAnswers((prev) => ({ ...prev, [questionId]: answerIndex, }));
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    if (authLoading || isLoadingQuiz ) { 
        return (
            <div className="min-h-screen bg-background py-8 flex justify-center items-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    if (!authLoading && !user && !isLoadingQuiz) {
         return (
            <div className="min-h-screen bg-background py-8 flex justify-center items-center">
                <p className="text-muted-foreground">Redirecting to login...</p>
                <Loader2 className="ml-2 h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }


    if (!quiz) { 
        return (
             <div className="min-h-screen bg-background py-8 flex flex-col justify-center items-center text-center px-4">
                <h2 className="text-2xl font-bold text-foreground mb-4">Quiz Not Found</h2>
                <p className="text-muted-foreground mb-4">This quiz may not exist or has been removed.</p>
                <Link href="/my-quizzes">
                    <QuizifyButton variant="threed">Go to My Quizzes</QuizifyButton>
                </Link>
            </div>
        );
    }
    
    if (isForeignQuiz && user) {
        return (
            <div className="min-h-screen bg-background py-8 flex flex-col items-center justify-center px-4">
                <Card className="max-w-xl w-full shadow-2xl rounded-lg">
                    <CardHeader className="text-center p-6 sm:p-8">
                        <Users className="h-16 w-16 text-primary mx-auto mb-4" />
                        <CardTitle className="text-3xl font-bold text-foreground mb-2">{quiz.title}</CardTitle>
                        <CardDescription className="text-lg text-muted-foreground max-w-md mx-auto">
                            {quiz.description || `A quiz with ${quiz.questionCount} questions.`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 sm:p-8 space-y-6">
                        <Alert className="bg-accent/50 border-primary/30">
                            <Users className="h-5 w-5 text-primary" />
                            <AlertTitle className="font-semibold text-primary">Shared Quiz</AlertTitle>
                            <AlertDescription className="text-muted-foreground">
                                This quiz was shared by another user. Add it to your collection to take it and track your results.
                            </AlertDescription>
                        </Alert>
                        <div className="flex flex-col space-y-4">
                            <QuizifyButton
                                variant="threed"
                                size="lg"
                                onClick={handleCloneAndStartQuiz}
                                disabled={isCloning}
                                className="w-full py-3 text-lg"
                            >
                                {isCloning ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <CopyPlus className="mr-2 h-5 w-5" />
                                )}
                                {isCloning ? "Adding to Collection..." : "Add to My Quizzes & Start"}
                            </QuizifyButton>
                            <Link href="/my-quizzes" className="w-full">
                                 <QuizifyButton variant="outlined" size="lg" className="w-full py-3 text-lg">
                                    <ChevronLeft className="mr-2 h-5 w-5" />
                                    Back to My Quizzes
                                </QuizifyButton>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    const currentQuestionData = quiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

    return (
        <div className="min-h-screen bg-background py-8">
            {(isSubmitting || isCloning) && (
                <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex flex-col justify-center items-center z-[100] p-4 text-center">
                    <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
                    <h2 className="text-2xl font-semibold text-foreground mb-2">
                        {isSubmitting ? "Finalizing Your Quiz" : "Preparing Quiz..."}
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        {isSubmitting ? "Calculating score and preparing results..." : "Please wait..."}
                    </p>
                </div>
            )}

            <div className={cn(
                "max-w-4xl mx-auto px-4 transition-all duration-300",
                (isSubmitting || isCloning) ? 'blur-md pointer-events-none opacity-50' : 'blur-none opacity-100'
            )}>
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold text-foreground">{quiz.title}</h1>
                        <div className="flex items-center space-x-2 text-lg font-medium text-muted-foreground">
                            <Clock className="h-5 w-5 text-primary"/>
                            <span className={timeLeft < 300 ? "text-destructive" : ""}>{formatTime(timeLeft)}</span>
                        </div>
                    </div>
                    <Progress value={progress} className="w-full h-2.5"/>
                    <p className="text-sm text-muted-foreground mt-2">
                        Question {currentQuestionIndex + 1} of {quiz.questions.length}
                    </p>
                </div>

                <Card className="mb-8 bg-card">
                    <CardHeader>
                        <CardTitle className="text-xl text-card-foreground">{currentQuestionData.questionText}</CardTitle>
                        <CardDescription>Select the best answer from the options below.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup
                            value={answers[currentQuestionData.id]?.toString() ?? ""}
                            onValueChange={(value) => handleAnswerChange(currentQuestionData.id, Number.parseInt(value))}
                            className="space-y-3"
                            disabled={isSubmitting || isCloning}
                        >
                            {currentQuestionData.options.map((option, index) => (
                                <Label 
                                    htmlFor={`option-${currentQuestionData.id}-${index}`} 
                                    key={index}
                                    className={cn("flex items-center space-x-3 p-4 rounded-lg border border-input hover:bg-accent/50 cursor-pointer transition-colors",
                                        answers[currentQuestionData.id] === index ? "bg-primary/10 border-primary ring-2 ring-primary" : "",
                                        (isSubmitting || isCloning) && "cursor-not-allowed opacity-70"
                                    )}
                                >
                                    <RadioGroupItem value={index.toString()} id={`option-${currentQuestionData.id}-${index}`} disabled={isSubmitting || isCloning}/>
                                    <span className="flex-1 text-foreground">
                                        {option}
                                    </span>
                                </Label>
                            ))}
                        </RadioGroup>
                    </CardContent>
                </Card>

                <div className="flex justify-between">
                    <QuizifyButton
                        variant="threed"
                        onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0 || isSubmitting || isCloning}
                    >
                        <ChevronLeft className="mr-2 h-4 w-4"/>
                        Previous
                    </QuizifyButton>

                    {currentQuestionIndex === quiz.questions.length - 1 ? (
                        <QuizifyButton variant="threed" onClick={handleSubmitQuiz} disabled={isSubmitting || !user || isCloning}>
                             {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit Quiz"
                            )}
                        </QuizifyButton>
                    ) : (
                        <QuizifyButton
                            variant="threed"
                            onClick={() => setCurrentQuestionIndex((prev) => Math.min(quiz.questions.length - 1, prev + 1))}
                            disabled={isSubmitting || isCloning}
                        >
                            Next
                            <ChevronRight className="ml-2 h-4 w-4"/>
                        </QuizifyButton>
                    )}
                </div>
            </div>
        </div>
    )
}

