"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QuizifyButton } from "@/components/custom/Quizify-button"
import { UserCircle, LogOut, Loader2, Sun, Moon, Laptop, Edit, Trophy, BookOpen, Clock } from "lucide-react"
import toast from "react-hot-toast"
import { useState, useEffect } from "react";
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [creationDate, setCreationDate] = useState<string | null>(null);
  const [stats, setStats] = useState({
    quizzesTaken: 12,
    quizzesCreated: 5,
    averageScore: 84
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.metadata?.creationTime) {
      const date = new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      setCreationDate(date);
    }
  }, [user]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleEditProfile = () => {
    toast("Profile editing coming soon!", { icon: "🛠️" });
  };

  if (authLoading || (!authLoading && !user)) {
    return (
      <div className="min-h-screen bg-background py-8 flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-background py-12 flex flex-col items-center"
    >
      <div className="max-w-md w-full px-4 space-y-8">
        <motion.div 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold  mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="w-full shadow-xl border-border/50 hover:shadow-2xl transition-shadow">
            <CardHeader className="items-center text-center p-8 pb-6 relative">
              <button 
                onClick={handleEditProfile}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
                aria-label="Edit profile"
              >
                <Edit className="h-5 w-5 text-muted-foreground" />
              </button>
              
              <Avatar className="h-32 w-32 border-4 border-primary/80 p-1 shadow-lg bg-background mx-auto mb-4 group hover:scale-105 transition-transform">
                {user?.photoURL && (
                    <AvatarImage
                        className="rounded-full"
                        src={user.photoURL}
                        alt={user.displayName || "User"}
                    />
                )}
                <AvatarFallback className="text-5xl font-semibold text-primary bg-muted/30 group-hover:bg-muted/50 transition-colors">
                  {user?.displayName ? (
                    user.displayName.substring(0, 2).toUpperCase()
                  ) : (
                    <UserCircle className="h-20 w-20 text-primary/70" />
                  )}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
                  {user?.displayName || "Quiz Taker"}
                  <Badge variant="outline" className="text-primary border-primary">
                    Pro Member
                  </Badge>
                </CardTitle>
                <CardDescription className="text-md text-muted-foreground mt-1">
                  {user?.email || "Email not available"}
                </CardDescription>
                {creationDate && (
                  <p className="text-xs text-muted-foreground/80 mt-2 flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    Joined on {creationDate}
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-8 pt-2 pb-8 space-y-6">
              {/* Stats Section */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold text-primary">{stats.quizzesTaken}</p>
                  <p className="text-xs text-muted-foreground">Taken</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold text-primary">{stats.quizzesCreated}</p>
                  <p className="text-xs text-muted-foreground">Created</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold text-primary">{stats.averageScore}%</p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
              </div>

              {/* Theme Selector */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Sun className="h-4 w-4" /> Theme Preferences
                </h3>
                <div className="flex space-x-2">
                  <QuizifyButton
                    variant="outlined"
                    size="sm"
                    onClick={() => setTheme("light")}
                    className={cn(
                      "flex-1 transition-all",
                      theme === "light" && "ring-2 ring-primary border-primary bg-primary/10"
                    )}
                  >
                    <Sun className="mr-2 h-4 w-4" /> Light
                  </QuizifyButton>
                  <QuizifyButton
                    variant="outlined"
                    size="sm"
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "flex-1 transition-all",
                      theme === "dark" && "ring-2 ring-primary border-primary bg-primary/10"
                    )}
                  >
                    <Moon className="mr-2 h-4 w-4" /> Dark
                  </QuizifyButton>
                  <QuizifyButton
                    variant="outlined"
                    size="sm"
                    onClick={() => setTheme("system")}
                    className={cn(
                      "flex-1 transition-all",
                      theme === "system" && "ring-2 ring-primary border-primary bg-primary/10"
                    )}
                  >
                    <Laptop className="mr-2 h-4 w-4" /> System
                  </QuizifyButton>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <QuizifyButton
                  variant="outlined"
                  className="w-full"
                  onClick={() => router.push('/quiz/create')}
                >
                  <BookOpen className="mr-2 h-4 w-4" /> Create Quiz
                </QuizifyButton>
                <QuizifyButton
                  variant="outlined"
                  className="w-full"
                  onClick={() => router.push('/leaderboard')}
                >
                  <Trophy className="mr-2 h-4 w-4" /> Leaderboard
                </QuizifyButton>
              </div>

              {/* Logout Button */}
              <QuizifyButton
                variant="threed"
                className="w-full bg-red-600 hover:bg-red-700 border-b-red-800 hover:border-b-red-900 text-white mt-4"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-5 w-5" />
                )}
                {isLoggingOut ? "Logging out..." : "Logout"}
              </QuizifyButton>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}