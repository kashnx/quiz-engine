"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from 'next/navigation' 
import { QuizifyButton } from "@/components/custom/Quizify-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, RotateCcw, Home, Trophy, Target, Loader2 } from "lucide-react"
import type { QuizQuestion } from "@/ai/flows/create-quiz-flow"
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase"
import { doc, getDoc, Timestamp } from "firebase/firestore"
import toast from "react-hot-toast"
import { useAuth } from "@/contexts/auth-context"; 

interface StoredQuizResults {
  id: string; 
  quizId: string;
  userId?: string | null;
  answers: Record<string, number>;
  score: number;
  correct: number;
  total: number;
  questionsSnapshot: QuizQuestion[]; 
  quizTitle?: string;
  submittedAt: Timestamp | Date; 
}

export default function QuizResultsPage() {
  const params = useParams<{ quizId: string; resultId: string; }>() 
  const { user, loading: authLoading } = useAuth(); 

  const [results, setResults] = useState<StoredQuizResults | null>(null)
  const [isLoadingResults, setIsLoadingResults] = useState(true);

  useEffect(() => {
    console.log("QuizResultsPage: Mounted. Current params:", params);
    if (!authLoading && !user) {
      console.log("QuizResultsPage: User not logged in, but page might be public or awaiting auth state.");
      // No redirect here, page might be accessible publicly or auth state is loading
    }
  }, [user, authLoading, params]); // Removed router from deps as it's not used here

  useEffect(() => {
    const currentQuizId = params.quizId;
    const currentResultId = params.resultId;
    console.log(`QuizResultsPage: Fetching results for quizId: ${currentQuizId}, resultId: ${currentResultId}`);

    if (currentResultId && currentQuizId) { 
      const fetchResults = async () => {
        setIsLoadingResults(true);
        try {
          const resultDocRef = doc(db, "quizResults", currentResultId as string);
          const resultDocSnap = await getDoc(resultDocRef);

          if (resultDocSnap.exists()) {
            const data = resultDocSnap.data() as Omit<StoredQuizResults, 'id'>;
            if (data.quizId !== currentQuizId) {
                console.error(`QuizResultsPage: Mismatch! Result ${currentResultId} is for quiz ${data.quizId}, but URL has quiz ${currentQuizId}.`);
                toast.error("Result data mismatch. Cannot display results.");
                setResults(null);
            } else if (!data.questionsSnapshot || data.questionsSnapshot.length === 0) {
                 toast.error("Quiz result data is incomplete (missing questions snapshot).");
                 console.error("QuizResultsPage: Incomplete data for resultId:", currentResultId);
                 setResults(null);
            } else {
                 setResults({ id: resultDocSnap.id, ...data });
                 console.log("QuizResultsPage: Results loaded successfully for resultId:", currentResultId);
            }
          } else {
            toast.error("Quiz results not found.");
            console.error("QuizResultsPage: No results found in Firestore for resultId:", currentResultId);
            setResults(null);
          }
        } catch (error) {
          console.error("QuizResultsPage: Error fetching quiz results from Firestore:", error);
          toast.error("Failed to load quiz results.");
          setResults(null);
        }
        setIsLoadingResults(false);
      };
      fetchResults();
    } else {
        setIsLoadingResults(false);
        setResults(null);
        const missingParamsError = `Quiz ID or Result ID missing from URL. quizId: ${currentQuizId}, resultId: ${currentResultId}`;
        if(currentQuizId || currentResultId) { // Avoid toast if both are undefined on initial mount before params are ready
            toast.error(missingParamsError);
        }
        console.error("QuizResultsPage:", missingParamsError);
    }
  }, [params.resultId, params.quizId, params]) // Added params to dep array

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }
  
  const getScoreBadgeInfo = (score: number) => {
    if (score >= 90) return { text: "Excellent!", variant: "default", className: "bg-green-500 hover:bg-green-600 text-white" }  as const
    if (score >= 80) return { text: "Great Job!", variant: "default", className: "bg-sky-500 hover:bg-sky-600 text-white" } as const
    if (score >= 60) return { text: "Good Effort", variant: "default", className: "bg-yellow-500 hover:bg-yellow-600 text-white" } as const
    return { text: "Needs Improvement", variant: "destructive" } as const
  }

  if (authLoading || isLoadingResults ) { 
    return (
        <div className="min-h-screen bg-background py-8 flex justify-center items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (!results) { 
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4">
        <Trophy className="h-16 w-16 text-muted-foreground mb-6" />
        <h2 className="text-2xl font-bold text-foreground mb-3">No Results Found</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          The results for this quiz session may not exist, an error occurred, or the URL is incorrect. Please check the URL or try again.
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            {params.quizId && (
              <Link href={`/quiz/${params.quizId}`}>
                  <QuizifyButton variant="threed">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try Quiz Again
                  </QuizifyButton>
              </Link>
            )}
            <Link href="/my-quizzes">
                <QuizifyButton variant="threed">
                <Home className="mr-2 h-4 w-4" />
                My Quizzes
                </QuizifyButton>
            </Link>
        </div>
      </div>
    )
  }
  
  const scoreBadgeInfo = getScoreBadgeInfo(results.score)

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-card rounded-full shadow-lg border border-border mb-4">
            <Trophy className={`h-16 w-16 ${getScoreColor(results.score)}`} />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Quiz Complete!</h1>
          <p className="text-lg text-muted-foreground mb-1">Results for: {results.quizTitle || "Your Quiz"}</p>
          <Badge variant={scoreBadgeInfo.variant} className={cn("text-md py-1 px-3", scoreBadgeInfo.className)}>
            {scoreBadgeInfo.text}
          </Badge>
        </div>

        <Card className="mb-8 bg-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-5xl font-bold mb-1">
              <span className={getScoreColor(results.score)}>{results.score}%</span>
            </CardTitle>
            <CardDescription className="mt-1 text-md">
              You answered {results.correct} out of {results.total} questions correctly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-3xl font-bold text-green-500">{results.correct}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <div className="text-3xl font-bold text-red-500">{results.total - results.correct}</div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold text-primary">{results.total}</div>
                <div className="text-sm text-muted-foreground">Total Questions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-bold text-foreground">Question Review</h2>
          {results.questionsSnapshot.map((question, index) => {
            const userAnswerIndex = results.answers[question.id];
            const isCorrect = userAnswerIndex === question.correctAnswerIndex;

            return (
              <Card key={question.id} className={`bg-card border-l-4 ${isCorrect ? "border-l-green-500" : "border-l-red-500"}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg flex-1 text-card-foreground">
                      Question {index + 1}: {question.questionText}
                    </CardTitle>
                    {isCorrect ? (
                      <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 ml-4" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 ml-4" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {question.options.map((option, optionIndex) => {
                    const isThisUserAnswer = userAnswerIndex === optionIndex;
                    const isThisCorrectAnswer = question.correctAnswerIndex === optionIndex;

                    let optionClassName = "p-3 rounded-lg border ";
                    if (isThisCorrectAnswer) {
                      optionClassName += "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400";
                    } else if (isThisUserAnswer && !isThisCorrectAnswer) {
                      optionClassName += "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400";
                    } else {
                      optionClassName += "bg-muted/50 border-border text-muted-foreground";
                    }

                    return (
                      <div key={optionIndex} className={cn(optionClassName, "flex items-center justify-between")}>
                        <span>{option}</span>
                        <div className="flex items-center space-x-2">
                          {isThisUserAnswer && (
                            <Badge variant="outline" className={cn("text-xs", !isThisCorrectAnswer && "border-red-500/50 text-red-600")}>
                              Your Answer
                            </Badge>
                          )}
                          {isThisCorrectAnswer && (
                             <Badge variant="outline" className="text-xs border-green-500/50 text-green-600 bg-green-500/10">
                              Correct
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                   {userAnswerIndex === undefined && !isCorrect && ( 
                     <div className="p-3 rounded-lg border bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400">
                       You did not answer this question. The correct answer was: {question.options[question.correctAnswerIndex]}
                     </div>
                   )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link href={`/quiz/${results.quizId}`}>
            <QuizifyButton variant="threed" className="w-full sm:w-auto">
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake Quiz
            </QuizifyButton>
          </Link>
          <Link href="/my-quizzes">
            <QuizifyButton variant="threed" className="w-full sm:w-auto">
              <Home className="mr-2 h-4 w-4" />
              Back to My Quizzes
            </QuizifyButton>
          </Link>
        </div>
      </div>
    </div>
  )
}
    
