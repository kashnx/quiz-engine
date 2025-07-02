"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from 'next/navigation' 
import { QuizifyButton } from "@/components/custom/Quizify-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, RotateCcw, Home, Trophy, Target, Loader2, Share2, BarChart2 } from "lucide-react"
import type { QuizQuestion } from "@/ai/flows/create-quiz-flow"
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase"
import { doc, getDoc, Timestamp } from "firebase/firestore"
import toast from "react-hot-toast"
import { useAuth } from "@/contexts/auth-context"; 
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

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
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!params.resultId || !params.quizId) return;
      
      setIsLoadingResults(true);
      try {
        const resultDocRef = doc(db, "quizResults", params.resultId as string);
        const resultDocSnap = await getDoc(resultDocRef);

        if (resultDocSnap.exists()) {
          const data = resultDocSnap.data() as Omit<StoredQuizResults, 'id'>;
          if (data.quizId !== params.quizId) {
            toast.error("RESULT DATA MISMATCH");
            setResults(null);
          } else if (!data.questionsSnapshot?.length) {
            toast.error("INCOMPLETE QUIZ DATA");
            setResults(null);
          } else {
            setResults({ id: resultDocSnap.id, ...data });
          }
        } else {
          toast.error("RESULTS NOT FOUND");
          setResults(null);
        }
      } catch (error) {
        console.error("ERROR FETCHING RESULTS:", error);
        toast.error("FAILED TO LOAD RESULTS");
        setResults(null);
      }
      setIsLoadingResults(false);
    };

    fetchResults();
  }, [params.resultId, params.quizId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#00f0ff]"
    if (score >= 60) return "text-[#ffcc00]"
    return "text-[#ff4d00]"
  }
  
  const getScoreBadgeInfo = (score: number) => {
    if (score >= 90) return { text: "EXCELLENT!", variant: "default", className: "bg-[#00f0ff] hover:bg-[#00c0ff] text-black" }
    if (score >= 80) return { text: "GREAT JOB!", variant: "default", className: "bg-[#00a0ff] hover:bg-[#0080ff] text-black" }
    if (score >= 60) return { text: "GOOD EFFORT", variant: "default", className: "bg-[#ffcc00] hover:bg-[#ffaa00] text-black" }
    return { text: "NEEDS WORK", variant: "destructive", className: "bg-[#ff4d00] hover:bg-[#ff3300] text-black" }
  }

  const handleShareResults = async () => {
    try {
      setIsSharing(true);
      if (!results) return;
      
      const shareData = {
        title: `QUIZ RESULTS: ${results.score}%`,
        text: `I SCORED ${results.score}% ON "${results.quizTitle}"! TRY IT YOURSELF.`,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("LINK COPIED TO CLIPBOARD!");
      }
    } catch (err) {
      console.error("SHARE ERROR:", err);
    } finally {
      setIsSharing(false);
    }
  };

  if (authLoading || isLoadingResults) { 
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#00f0ff]" />
      </div>
    );
  }

  if (!results) { 
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-black flex flex-col items-center justify-center text-center px-4"
      >
        <Trophy className="h-16 w-16 text-[#ff4d00] mb-6" />
        <h2 className="text-2xl font-black uppercase tracking-wider text-white mb-3">NO RESULTS FOUND</h2>
        <p className="text-gray-400 font-mono mb-6 max-w-md">
          RESULTS MAY NOT EXIST OR URL IS INCORRECT. CHECK AND TRY AGAIN.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          {params.quizId && (
            <Link href={`/quiz/${params.quizId}`}>
              <QuizifyButton variant="threed" className="bg-[#ff4d00] border-[#ff4d00] text-black hover:bg-black hover:text-[#ff4d00]">
                <RotateCcw className="mr-2 h-4 w-4" />
                RETRY QUIZ
              </QuizifyButton>
            </Link>
          )}
          <Link href="/my-quizzes">
            <QuizifyButton variant="threed" className="bg-[#00f0ff] border-[#00f0ff] text-black hover:bg-black hover:text-[#00f0ff]">
              <Home className="mr-2 h-4 w-4" />
              MY QUIZZES
            </QuizifyButton>
          </Link>
        </div>
      </motion.div>
    )
  }
  
  const scoreBadgeInfo = getScoreBadgeInfo(results.score)
  const submissionDate = results.submittedAt instanceof Timestamp 
    ? results.submittedAt.toDate().toLocaleDateString() 
    : new Date(results.submittedAt).toLocaleDateString();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black py-8"
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* Header Section */}
        <motion.div 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-center mb-8 border-b-4 border-[#ff4d00] pb-6"
        >
          <div className="inline-block p-3 bg-black rounded-full border-4 border-[#00f0ff] mb-4 shadow-lg shadow-[#00f0ff]/20">
            <Trophy className={`h-16 w-16 ${getScoreColor(results.score)}`} />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-wider mb-2 bg-gradient-to-r from-[#00f0ff] to-[#ff00ff] bg-clip-text text-transparent">
            QUIZ TERMINATED
          </h1>
          <p className="text-gray-400 font-mono mb-1">
            {results.quizTitle || "YOUR QUIZ"} • {submissionDate}
          </p>
          <Badge variant={scoreBadgeInfo.variant} className={cn(
            "text-md py-1 px-3 mt-2 font-mono tracking-wider",
            scoreBadgeInfo.className
          )}>
            {scoreBadgeInfo.text}
          </Badge>
        </motion.div>

        {/* Score Summary Card */}
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
        >
          <Card className="mb-8 bg-[#0a0a0a] border-4 border-[#00f0ff] shadow-lg shadow-[#00f0ff]/10">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-5xl font-black uppercase tracking-wider mb-1">
                <span className={getScoreColor(results.score)}>{results.score}%</span>
              </CardTitle>
              <Progress 
                value={results.score} 
                className="h-3 mt-4 bg-black border-2 border-[#00f0ff]" 
                indicatorClassName={cn(
                  results.score >= 80 ? "bg-[#00f0ff]" :
                  results.score >= 60 ? "bg-[#ffcc00]" : "bg-[#ff4d00]"
                )}
              />
              <CardDescription className="mt-4 text-gray-400 font-mono">
                YOU ANSWERED {results.correct} OUT OF {results.total} QUESTIONS CORRECTLY.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="p-4 bg-[#00f0ff]/10 rounded-lg border-2 border-[#00f0ff]"
                >
                  <CheckCircle className="h-8 w-8 text-[#00f0ff] mx-auto mb-2" />
                  <div className="text-3xl font-black text-[#00f0ff]">{results.correct}</div>
                  <div className="text-sm text-gray-400 font-mono">CORRECT</div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="p-4 bg-[#ff4d00]/10 rounded-lg border-2 border-[#ff4d00]"
                >
                  <XCircle className="h-8 w-8 text-[#ff4d00] mx-auto mb-2" />
                  <div className="text-3xl font-black text-[#ff4d00]">{results.total - results.correct}</div>
                  <div className="text-sm text-gray-400 font-mono">INCORRECT</div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="p-4 bg-[#ff00ff]/10 rounded-lg border-2 border-[#ff00ff]"
                >
                  <Target className="h-8 w-8 text-[#ff00ff] mx-auto mb-2" />
                  <div className="text-3xl font-black text-[#ff00ff]">{results.total}</div>
                  <div className="text-sm text-gray-400 font-mono">TOTAL</div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Question Review */}
        <div className="space-y-6 mb-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black uppercase tracking-wider text-[#00f0ff]">
              QUESTION ANALYSIS
            </h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <QuizifyButton 
                  variant="threed"
                  onClick={handleShareResults}
                  disabled={isSharing}
                  className="bg-[#ff00ff] border-[#ff00ff] text-black hover:bg-black hover:text-[#ff00ff] gap-2"
                >
                  {isSharing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  SHARE
                </QuizifyButton>
              </TooltipTrigger>
              <TooltipContent className="bg-black border-2 border-[#ff00ff] text-white font-mono">
                BROADCAST YOUR RESULTS
              </TooltipContent>
            </Tooltip>
          </div>

          {results.questionsSnapshot.map((question, index) => {
            const userAnswerIndex = results.answers[question.id];
            const isCorrect = userAnswerIndex === question.correctAnswerIndex;

            return (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`bg-[#0a0a0a] border-l-4 ${isCorrect ? "border-l-[#00f0ff]" : "border-l-[#ff4d00]"} shadow-lg`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg flex-1 font-mono">
                        <span className="text-[#ffcc00]">Q{index + 1}:</span> {question.questionText}
                      </CardTitle>
                      {isCorrect ? (
                        <CheckCircle className="h-6 w-6 text-[#00f0ff] flex-shrink-0 ml-4" />
                      ) : (
                        <XCircle className="h-6 w-6 text-[#ff4d00] flex-shrink-0 ml-4" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {question.options.map((option, optionIndex) => {
                      const isThisUserAnswer = userAnswerIndex === optionIndex;
                      const isThisCorrectAnswer = question.correctAnswerIndex === optionIndex;

                      let optionClassName = "p-3 rounded-lg border-2 font-mono ";
                      if (isThisCorrectAnswer) {
                        optionClassName += "bg-[#00f0ff]/10 border-[#00f0ff] text-[#00f0ff]";
                      } else if (isThisUserAnswer && !isThisCorrectAnswer) {
                        optionClassName += "bg-[#ff4d00]/10 border-[#ff4d00] text-[#ff4d00]";
                      } else {
                        optionClassName += "bg-[#1a1a1a] border-[#333] text-gray-400 hover:bg-[#222]";
                      }

                      return (
                        <div 
                          key={optionIndex} 
                          className={cn(optionClassName, "flex items-center justify-between")}
                        >
                          <span>{option}</span>
                          <div className="flex items-center space-x-2">
                            {isThisUserAnswer && (
                              <Badge variant="outline" className={cn(
                                "text-xs font-mono",
                                !isThisCorrectAnswer && "border-[#ff4d00]/50 text-[#ff4d00]"
                              )}>
                                YOUR ANSWER
                              </Badge>
                            )}
                            {isThisCorrectAnswer && (
                              <Badge variant="outline" className="text-xs font-mono border-[#00f0ff]/50 text-[#00f0ff] bg-[#00f0ff]/10">
                                CORRECT
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {userAnswerIndex === undefined && !isCorrect && ( 
                      <div className="p-3 rounded-lg border-2 bg-[#ffcc00]/10 border-[#ffcc00] text-[#ffcc00] font-mono">
                        NO ANSWER PROVIDED. CORRECT: {question.options[question.correctAnswerIndex]}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Action Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row justify-center items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Link href={`/quiz/${results.quizId}`}>
            <QuizifyButton variant="threed" className="bg-[#ff4d00] border-[#ff4d00] text-black hover:bg-black hover:text-[#ff4d00]">
              <RotateCcw className="mr-2 h-4 w-4" />
              RETRY QUIZ
            </QuizifyButton>
          </Link>
          <Link href="/my-quizzes">
            <QuizifyButton variant="threed" className="bg-[#00f0ff] border-[#00f0ff] text-black hover:bg-black hover:text-[#00f0ff]">
              <Home className="mr-2 h-4 w-4" />
              MY QUIZZES
            </QuizifyButton>
          </Link>
          <Link href={`/quiz/${results.quizId}/stats`}>
            <QuizifyButton variant="threed" className="bg-[#ff00ff] border-[#ff00ff] text-black hover:bg-black hover:text-[#ff00ff]">
              <BarChart2 className="mr-2 h-4 w-4" />
              STATS
            </QuizifyButton>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  )
}