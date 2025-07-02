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
import { motion } from "framer-motion"

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
    const [hasError, setHasError] = useState(false);

    // Handle auth redirect
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Fetch quiz data
    useEffect(() => {
        const currentQuizId = params.quizId;
        
        if (!currentQuizId || authLoading) {
            return;
        }

        const fetchQuiz = async () => {
            setIsLoadingQuiz(true);
            setHasError(false);
            setIsForeignQuiz(false);
            
            try {
                const quizDocRef = doc(db, "quizzes", currentQuizId); 
                const quizDocSnap = await getDoc(quizDocRef);

                if (!quizDocSnap.exists()) {
                    throw new Error("Quiz not found");
                }

                const fetchedQuizData = { 
                    id: quizDocSnap.id, 
                    ...quizDocSnap.data(), 
                    userId: quizDocSnap.data()?.userId || null 
                } as QuizData;
                
                setQuiz(fetchedQuizData);
                setAnswers({});

                if (user && fetchedQuizData.userId !== user.uid) {
                    setIsForeignQuiz(true);
                }
            } catch (error) {
                console.error("Error fetching quiz:", error);
                setHasError(true);
                toast.error(error instanceof Error ? error.message : "Failed to load quiz");
                setQuiz(null);
            } finally {
                setIsLoadingQuiz(false);
            }
        };

        fetchQuiz();
    }, [params.quizId, user, authLoading]);

    // Handle quiz submission
    const handleSubmitQuiz = useCallback(async () => {
        if (!quiz || isSubmitting || !user || isForeignQuiz) {
            return;
        }
        setIsSubmitting(true);
        toast.loading("PROCESSING RESULTS...", { id: "submit-toast"});
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
            toast.success("RESULTS LOCKED IN!");
            router.push(`/quiz/${quiz.id}/results/${resultDocRef.id}`);
            submissionSuccessful = true;
        } catch (error) {
            console.error("Error submitting quiz results:", error);
            toast.dismiss("submit-toast");
            toast.error("SUBMISSION FAILED. TRY AGAIN.");
        } finally {
            if (!submissionSuccessful) {
                setIsSubmitting(false);
            }
        }
    }, [quiz, isSubmitting, user, answers, router, isForeignQuiz]);

    // Timer logic
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

    // Clone quiz functionality
    const handleCloneAndStartQuiz = async () => {
        if (!user || !quiz || !params.quizId) {
            toast.error("AUTHENTICATION FAILURE");
            return;
        }
        
        startCloningTransition(async () => {
            const toastId = "cloning-toast";
            toast.loading("CLONING QUIZ DATA...", { id: toastId });
            try {
                const idToken = await user.getIdToken(true);
                if (!idToken) {
                    throw new Error("AUTH TOKEN INVALID");
                }

                const result = await cloneQuizAction(params.quizId, idToken);

                if (result.newQuizId) {
                    toast.dismiss(toastId);
                    toast.success("QUIZ CLONED SUCCESSFULLY!");
                    router.push(`/quiz/${result.newQuizId}`);
                } else {
                    throw new Error(result.error || "CLONING FAILED");
                }
            } catch (error) {
                toast.dismiss(toastId);
                console.error("Error cloning quiz:", error);
                toast.error(error instanceof Error ? error.message.toUpperCase() : "SYSTEM ERROR");
            }
        });
    };

    const handleAnswerChange = (questionId: string, answerIndex: number) => {
        setAnswers((prev) => ({ ...prev, [questionId]: answerIndex }));
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    // Loading states
    if (authLoading || (isLoadingQuiz && !hasError)) {
        return (
            <div className="min-h-screen bg-black flex justify-center items-center">
                <Loader2 className="h-12 w-12 animate-spin text-[#00f0ff]" />
            </div>
        );
    }

    // Auth redirect state
    if (!authLoading && !user) {
         return (
            <div className="min-h-screen bg-black flex justify-center items-center">
                <p className="text-gray-400 font-mono">AUTHENTICATING...</p>
                <Loader2 className="ml-2 h-6 w-6 animate-spin text-[#00f0ff]" />
            </div>
        );
    }

    // Error state
    if (hasError || !quiz) {
        return (
            <div className="min-h-screen bg-black flex flex-col justify-center items-center text-center px-4">
                <h2 className="text-2xl font-black uppercase tracking-wider text-[#ff4d00] mb-4">QUIZ NOT FOUND</h2>
                <p className="text-gray-400 font-mono mb-4">DATA CORRUPTED OR DELETED</p>
                <Link href="/my-quizzes">
                    <QuizifyButton variant="threed" className="bg-[#00f0ff] border-[#00f0ff] text-black hover:bg-black hover:text-[#00f0ff]">
                        RETURN TO SAFETY
                    </QuizifyButton>
                </Link>
            </div>
        );
    }
    
    // Foreign quiz state
    if (isForeignQuiz && user) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-screen bg-black flex flex-col items-center justify-center px-4"
            >
                <Card className="max-w-xl w-full shadow-2xl rounded-lg border-4 border-[#00f0ff] bg-[#0a0a0a]">
                    <CardHeader className="text-center p-6 sm:p-8">
                        <Users className="h-16 w-16 text-[#ff4d00] mx-auto mb-4" />
                        <CardTitle className="text-3xl font-black uppercase tracking-wider text-[#00f0ff] mb-2">{quiz.title}</CardTitle>
                        <CardDescription className="text-lg text-gray-400 font-mono max-w-md mx-auto">
                            {quiz.description || `// ${quiz.questionCount} QUESTIONS READY //`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 sm:p-8 space-y-6">
                        <Alert className="bg-[#0a1a1a] border-2 border-[#00f0ff]">
                            <Users className="h-5 w-5 text-[#00f0ff]" />
                            <AlertTitle className="font-black uppercase tracking-wider text-[#00f0ff]">SECURE ACCESS REQUIRED</AlertTitle>
                            <AlertDescription className="text-gray-400 font-mono">
                                // FOREIGN QUIZ DETECTED // CLONE TO LOCAL STORAGE //
                            </AlertDescription>
                        </Alert>
                        <div className="flex flex-col space-y-4">
                            <QuizifyButton
                                variant="threed"
                                size="lg"
                                onClick={handleCloneAndStartQuiz}
                                disabled={isCloning}
                                className="w-full py-3 text-lg bg-[#ff4d00] border-[#ff4d00] text-black hover:bg-black hover:text-[#ff4d00]"
                            >
                                {isCloning ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <CopyPlus className="mr-2 h-5 w-5" />
                                )}
                                {isCloning ? "CLONING..." : "ACQUIRE & LAUNCH"}
                            </QuizifyButton>
                            <Link href="/my-quizzes" className="w-full">
                                 <QuizifyButton 
                                    variant="threed" 
                                    size="lg" 
                                    className="w-full py-3 text-lg bg-[#00f0ff] border-[#00f0ff] text-black hover:bg-black hover:text-[#00f0ff]"
                                >
                                    <ChevronLeft className="mr-2 h-5 w-5" />
                                    ABORT MISSION
                                </QuizifyButton>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }
    
    // Main quiz interface
    const currentQuestionData = quiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

    return (
        <div className="min-h-screen bg-black py-8">
            {(isSubmitting || isCloning) && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col justify-center items-center z-[100] p-4 text-center">
                    <Loader2 className="h-16 w-16 animate-spin text-[#00f0ff] mb-6" />
                    <h2 className="text-2xl font-black uppercase tracking-wider text-[#ff4d00] mb-2">
                        {isSubmitting ? "PROCESSING RESULTS" : "INITIALIZING QUIZ"}
                    </h2>
                    <p className="text-lg text-gray-400 font-mono">
                        {isSubmitting ? "// ANALYZING PERFORMANCE //" : "// PREPARING ENVIRONMENT //"}
                    </p>
                </div>
            )}

            <div className={cn(
                "max-w-4xl mx-auto px-4 transition-all duration-300",
                (isSubmitting || isCloning) ? 'blur-md pointer-events-none opacity-50' : 'blur-none opacity-100'
            )}>
                <motion.div 
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    className="mb-8 border-b-4 border-[#ff4d00] pb-6"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-black uppercase tracking-wider bg-gradient-to-r from-[#00f0ff] to-[#ff00ff] bg-clip-text text-transparent">
                            {quiz.title}
                        </h1>
                        <div className="flex items-center space-x-2 text-lg font-mono text-gray-400">
                            <Clock className="h-5 w-5 text-[#ff4d00]"/>
                            <span className={timeLeft < 300 ? "text-[#ff4d00]" : ""}>{formatTime(timeLeft)}</span>
                        </div>
                    </div>
                    <Progress 
                        value={progress} 
                        className="w-full h-2.5 bg-black border-2 border-[#00f0ff]"
                        indicatorClassName="bg-[#ff4d00]"
                    />
                    <p className="text-sm text-gray-400 font-mono mt-2">
                        // QUESTION {currentQuestionIndex + 1} OF {quiz.questions.length} //
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="mb-8 bg-[#0a0a0a] border-4 border-[#00f0ff] shadow-lg shadow-[#00f0ff]/10">
                        <CardHeader>
                            <CardTitle className="text-xl font-mono text-[#00f0ff]">
                                <span className="text-[#ffcc00]">Q{currentQuestionIndex + 1}:</span> {currentQuestionData.questionText}
                            </CardTitle>
                            <CardDescription className="text-gray-400 font-mono">
                                // SELECT CORRECT RESPONSE //
                            </CardDescription>
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
                                        className={cn(
                                            "flex items-center space-x-3 p-4 rounded-lg border-2 font-mono transition-colors",
                                            answers[currentQuestionData.id] === index 
                                                ? "bg-[#00f0ff]/10 border-[#00f0ff] ring-2 ring-[#00f0ff] text-[#00f0ff]" 
                                                : "bg-[#1a1a1a] border-[#333] text-gray-400 hover:bg-[#222]",
                                            (isSubmitting || isCloning) && "cursor-not-allowed opacity-70"
                                        )}
                                    >
                                        <RadioGroupItem 
                                            value={index.toString()} 
                                            id={`option-${currentQuestionData.id}-${index}`} 
                                            disabled={isSubmitting || isCloning}
                                            className="border-2 border-[#00f0ff] data-[state=checked]:bg-[#ff4d00]"
                                        />
                                        <span className="flex-1">
                                            {option}
                                        </span>
                                    </Label>
                                ))}
                            </RadioGroup>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div 
                    className="flex justify-between"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <QuizifyButton
                        variant="threed"
                        onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0 || isSubmitting || isCloning}
                        className="bg-[#00f0ff] border-[#00f0ff] text-black hover:bg-black hover:text-[#00f0ff]"
                    >
                        <ChevronLeft className="mr-2 h-4 w-4"/>
                        PREVIOUS
                    </QuizifyButton>

                    {currentQuestionIndex === quiz.questions.length - 1 ? (
                        <QuizifyButton 
                            variant="threed" 
                            onClick={handleSubmitQuiz} 
                            disabled={isSubmitting || !user || isCloning}
                            className="bg-[#ff4d00] border-[#ff4d00] text-black hover:bg-black hover:text-[#ff4d00]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    PROCESSING...
                                </>
                            ) : (
                                "TERMINATE QUIZ"
                            )}
                        </QuizifyButton>
                    ) : (
                        <QuizifyButton
                            variant="threed"
                            onClick={() => setCurrentQuestionIndex((prev) => Math.min(quiz.questions.length - 1, prev + 1))}
                            disabled={isSubmitting || isCloning}
                            className="bg-[#ff00ff] border-[#ff00ff] text-black hover:bg-black hover:text-[#ff00ff]"
                        >
                            NEXT
                            <ChevronRight className="ml-2 h-4 w-4"/>
                        </QuizifyButton>
                    )}
                </motion.div>
            </div>
        </div>
    )
}