"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, BarChartHorizontalBig, AlertTriangle, Percent, ListChecks, CheckCircle, XCircle } from "lucide-react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import toast from "react-hot-toast"
import type { QuizQuestion } from "@/ai/flows/create-quiz-flow"

interface StoredQuizResult {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  correct: number;
  total: number;
  quizTitle?: string;
  submittedAt: Timestamp; 
  questionsSnapshot?: QuizQuestion[];
}

interface ChartData {
  name: string;
  score: number;
}

const formatDate = (timestamp: Timestamp | undefined) => {
  if (!timestamp) return "N/A";
  return timestamp.toDate().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [quizResults, setQuizResults] = useState<StoredQuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuizzesTaken: 0,
    averageScore: 0,
    totalQuestionsAnswered: 0,
    totalCorrectAnswers: 0,
    overallAccuracy: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && !authLoading) {
      const fetchHistory = async () => {
        setIsLoading(true);
        try {
          const q = query(
            collection(db, "quizResults"),
            where("userId", "==", user.uid),
            orderBy("submittedAt", "desc")
          );
          const querySnapshot = await getDocs(q);
          const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoredQuizResult));
          setQuizResults(results);

          if (results.length > 0) {
            const totalQuizzes = results.length;
            const totalScoreSum = results.reduce((acc, r) => acc + r.score, 0);
            const avgScore = totalQuizzes > 0 ? Math.round(totalScoreSum / totalQuizzes) : 0;
            const totalQuestions = results.reduce((acc, r) => acc + r.total, 0);
            const totalCorrect = results.reduce((acc, r) => acc + r.correct, 0);
            const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

            setStats({
              totalQuizzesTaken: totalQuizzes,
              averageScore: avgScore,
              totalQuestionsAnswered: totalQuestions,
              totalCorrectAnswers: totalCorrect,
              overallAccuracy: accuracy,
            });

            const recentResultsForChart = results.slice(0, 10).reverse();
            setChartData(
              recentResultsForChart.map(r => ({
                name: r.quizTitle || `Quiz ${formatDate(r.submittedAt)}`,
                score: r.score,
              }))
            );
          } else {
            setStats({ totalQuizzesTaken: 0, averageScore: 0, totalQuestionsAnswered: 0, totalCorrectAnswers: 0, overallAccuracy: 0 });
            setChartData([]);
          }
        } catch (error) {
          console.error("Error fetching quiz history:", error);
          toast.error("DATA RETRIEVAL FAILED");
        } finally {
          setIsLoading(false);
        }
      };
      fetchHistory();
    }
  }, [user, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-[#00f0ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-10 border-b-4 border-[#ff4d00] pb-6">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider flex items-center">
            <BarChartHorizontalBig className="mr-4 h-10 w-10 text-[#00f0ff]" /> 
            <span className="text-[#00f0ff]">BATTLE</span> 
            <span className="text-[#ff4d00]">STATS</span>
          </h1>
          <p className="text-gray-400 font-mono mt-2">
            // YOUR QUIZ WARRIOR TRACK RECORD //
          </p>
        </div>

        {quizResults.length === 0 ? (
          <Card className="border-4 border-[#ff4d00] bg-[#0a0a0a]">
            <CardContent className="pt-8 pb-10 text-center">
              <AlertTriangle className="h-16 w-16 text-[#ff4d00] mx-auto mb-6" />
              <p className="text-2xl font-black uppercase tracking-wider text-[#00f0ff]">NO COMBAT DATA FOUND</p>
              <p className="text-gray-400 font-mono mt-4 max-w-md mx-auto">
                YOU HAVEN'T ENGAGED IN ANY QUIZ BATTLES YET. RETURN TO THE FRONTLINES!
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <Card className="border-4 border-[#00f0ff] bg-[#0a0a0a] hover:border-[#ff4d00] transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-sm font-black uppercase tracking-wider text-[#00f0ff]">
                    MISSIONS COMPLETED
                  </CardTitle>
                  <ListChecks className="h-6 w-6 text-[#ff4d00]" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-[#ff4d00]">{stats.totalQuizzesTaken}</div>
                </CardContent>
              </Card>
              <Card className="border-4 border-[#ff4d00] bg-[#0a0a0a] hover:border-[#00f0ff] transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-sm font-black uppercase tracking-wider text-[#ff4d00]">
                    AVERAGE SCORE
                  </CardTitle>
                  <Percent className="h-6 w-6 text-[#00f0ff]" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-[#00f0ff]">{stats.averageScore}%</div>
                </CardContent>
              </Card>
              <Card className="border-4 border-[#00f0ff] bg-[#0a0a0a] hover:border-[#ff4d00] transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-sm font-black uppercase tracking-wider text-[#00f0ff]">
                    DIRECT HITS
                  </CardTitle>
                  <CheckCircle className="h-6 w-6 text-[#ff4d00]" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-[#ff4d00]">{stats.totalCorrectAnswers}</div>
                </CardContent>
              </Card>
              <Card className="border-4 border-[#ff4d00] bg-[#0a0a0a] hover:border-[#00f0ff] transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-sm font-black uppercase tracking-wider text-[#ff4d00]">
                    ACCURACY RATING
                  </CardTitle>
                  <XCircle className="h-6 w-6 text-[#00f0ff]" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-[#00f0ff]">{stats.overallAccuracy}%</div>
                  <p className="text-xs text-gray-400 font-mono mt-2">
                    BASED ON {stats.totalQuestionsAnswered} SHOTS FIRED
                  </p>
                </CardContent>
              </Card>
            </div>

            {chartData.length > 0 && (
              <Card className="mb-10 border-4 border-[#00f0ff] bg-[#0a0a0a]">
                <CardHeader className="border-b-4 border-[#00f0ff]">
                  <CardTitle className="text-2xl font-black uppercase tracking-wider text-[#ff4d00]">
                    RECENT ENGAGEMENTS
                  </CardTitle>
                  <CardDescription className="text-gray-400 font-mono">
                    PERFORMANCE IN LAST {chartData.length} BATTLES
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#00f0ff" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 8)}...` : value}
                      />
                      <YAxis 
                        stroke="#ff4d00" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => `${value}%`} 
                        domain={[0, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0a0a0a",
                          borderColor: "#00f0ff",
                          borderRadius: 0,
                          color: "#ff4d00"
                        }}
                        itemStyle={{ color: "#00f0ff" }}
                        labelStyle={{ color: "#ff4d00", fontWeight: "bold" }}
                        cursor={{ fill: "#ff4d00", fillOpacity: 0.1 }}
                      />
                      <Bar 
                        dataKey="score" 
                        fill="#ff4d00"
                        radius={[0, 0, 0, 0]} 
                        barSize={40}
                        animationDuration={1000}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <Card className="border-4 border-[#ff4d00] bg-[#0a0a0a]">
              <CardHeader className="border-b-4 border-[#ff4d00]">
                <CardTitle className="text-2xl font-black uppercase tracking-wider text-[#00f0ff]">
                  COMBAT LOG
                </CardTitle>
                <CardDescription className="text-gray-400 font-mono">
                  FULL MISSION DEBRIEFING
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-4 border-[#00f0ff]">
                        <th className="p-4 text-left font-black uppercase tracking-wider text-[#ff4d00]">MISSION</th>
                        <th className="p-4 text-left font-black uppercase tracking-wider text-[#ff4d00]">DATE</th>
                        <th className="p-4 text-right font-black uppercase tracking-wider text-[#ff4d00]">SCORE</th>
                        <th className="p-4 text-right font-black uppercase tracking-wider text-[#ff4d00]">HITS/SHOTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizResults.map((result) => (
                        <tr 
                          key={result.id} 
                          className="border-b border-[#333] hover:bg-[#1a0a0a] transition-all"
                        >
                          <td className="p-4 font-mono">{result.quizTitle || "UNKNOWN MISSION"}</td>
                          <td className="p-4 text-gray-400 font-mono">{formatDate(result.submittedAt)}</td>
                          <td className="p-4 text-right font-bold text-[#00f0ff]">{result.score}%</td>
                          <td className="p-4 text-right text-gray-400 font-mono">{result.correct}/{result.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}