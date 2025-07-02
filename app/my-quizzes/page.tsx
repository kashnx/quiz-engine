"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { QuizifyButton } from "@/components/custom/Quizify-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Play, FileText, Calendar, Loader2, BookOpenCheck, MoreHorizontal, Share2, Trash2, Edit3, Pin, PinOff } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { QuizData } from "@/types/quiz"
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore"
import { deleteQuizAction, renameQuizAction, togglePinQuizAction } from "./actions";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const formatDate = (dateInput: unknown) => {
  if (!dateInput) return "N/A";
  try {
    if (dateInput instanceof Timestamp) {
      return dateInput.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    const date = new Date(dateInput as string | number | Date);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
};

const QuizCardSkeleton = () => (
  <Card className="flex flex-col bg-[#0a0a0a] border-4 border-[#333]">
    <CardHeader>
      <Skeleton className="h-6 w-3/4 mb-2 bg-[#333]" />
      <Skeleton className="h-4 w-full mb-1 bg-[#333]" />
      <Skeleton className="h-4 w-5/6 bg-[#333]" />
    </CardHeader>
    <CardContent className="flex-grow space-y-3">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-5 w-5 rounded-full bg-[#333]" />
        <Skeleton className="h-4 w-24 bg-[#333]" />
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-5 w-5 rounded-full bg-[#333]" />
        <Skeleton className="h-4 w-20 bg-[#333]" />
      </div>
    </CardContent>
    <div className="p-6 pt-0 mt-auto">
      <div className="flex space-x-2">
        <Skeleton className="h-10 flex-1 rounded-none bg-[#333]" />
        <Skeleton className="h-10 w-10 rounded-none bg-[#333]" />
      </div>
    </div>
  </Card>
);

export default function MyQuizzesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [quizzes, setQuizzes] = useState<QuizData[]>([])
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<string | null>(null);

  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isTogglingPin, setIsTogglingPin] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && !authLoading) {
      setIsLoadingQuizzes(true);
      const fetchQuizzes = async () => {
        try {
          const q = query(
            collection(db, "quizzes"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc") 
          );
          const querySnapshot = await getDocs(q);
          const userQuizzes = querySnapshot.docs.map(doc => ({
            id: doc.id,
            isPinned: false,
            ...doc.data()
          } as QuizData));
          setQuizzes(userQuizzes);
        } catch (error) {
          console.error("DATA RETRIEVAL FAILURE:", error);
          toast.error("COULD NOT LOAD QUIZZES. SYSTEM ERROR.");
        } finally {
            setIsLoadingQuizzes(false);
        }
      };
      fetchQuizzes();
    } else if (!authLoading && !user) {
      setQuizzes([]);
      setIsLoadingQuizzes(false);
    }
  }, [user, authLoading])

  useEffect(() => {
    if (editingQuizId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingQuizId]);

  const pinnedQuizzes = useMemo(() => quizzes.filter(q => q.isPinned), [quizzes]);
  const unpinnedQuizzes = useMemo(() => quizzes.filter(q => !q.isPinned), [quizzes]);

  const handleShareQuiz = async (quizId: string, quizTitle: string) => {
    const shareUrl = `${window.location.origin}/quiz/${quizId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `QUIZ: ${quizTitle}`,
          text: `ENGAGE WITH THIS QUIZ: "${quizTitle}". TEST YOUR METTLE!`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("LINK COPIED TO CLIPBOARD!");
      }
    } catch (error) {
      console.error("SHARING FAILURE:", error);
      toast.error("SHARING UNAVAILABLE. MANUAL COPY REQUIRED.");
    }
  };

  const handleDeleteQuiz = async (quizIdToDelete: string) => {
    if (!user) {
      toast.error("ACCESS DENIED: LOGIN REQUIRED");
      return;
    }
    if (isConfirmingDelete === quizIdToDelete || isDeleting === quizIdToDelete) return;
    setIsConfirmingDelete(quizIdToDelete);
    setIsDeleting(quizIdToDelete);
    const toastId = `delete-${quizIdToDelete}`;
    toast.loading("TERMINATING QUIZ...", { id: toastId });
    try {
      const idToken = await user.getIdToken(true);
      const result = await deleteQuizAction(quizIdToDelete, idToken);
      if (result.success) {
        toast.dismiss(toastId);
        toast.success("QUIZ ELIMINATED!");
        setQuizzes(prevQuizzes => prevQuizzes.filter(q => q.id !== quizIdToDelete));
      } else {
        toast.dismiss(toastId);
        toast.error(result.error || "TERMINATION FAILED");
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("SYSTEM ERROR: TERMINATION ABORTED");
    } finally {
      setIsDeleting(null); setIsConfirmingDelete(null);
    }
  };

  const handleStartEdit = (quiz: QuizData) => {
    setEditingQuizId(quiz.id);
    setEditingTitle(quiz.title);
  };

  const handleSaveTitle = async (quizId: string) => {
    if (!user) {
      toast.error("ACCESS DENIED: LOGIN REQUIRED");
      setEditingQuizId(null);
      return;
    }
    const originalQuiz = quizzes.find(q => q.id === quizId);
    if (!originalQuiz || editingTitle.trim() === "" || editingTitle.trim() === originalQuiz.title) {
      setEditingQuizId(null); 
      return;
    }

    setIsRenaming(quizId);
    const toastId = `rename-${quizId}`;
    toast.loading("RECODING IDENTIFIER...", { id: toastId });

    try {
      const idToken = await user.getIdToken(true);
      const result = await renameQuizAction(quizId, editingTitle.trim(), idToken);

      if (result.success) {
        toast.dismiss(toastId);
        toast.success("IDENTIFIER UPDATED!");
        setQuizzes(prevQuizzes =>
          prevQuizzes.map(q =>
            q.id === quizId ? { ...q, title: editingTitle.trim() } : q
          )
        );
      } else {
        toast.dismiss(toastId);
        toast.error(result.error || "RECODING FAILED");
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("SYSTEM ERROR: RECODING ABORTED");
    } finally {
      setIsRenaming(null);
      setEditingQuizId(null);
    }
  };
  
  const handleTogglePin = async (quizId: string, newPinState: boolean) => {
    if (!user) {
      toast.error("ACCESS DENIED: LOGIN REQUIRED");
      return;
    }
    setIsTogglingPin(quizId);
    const toastId = `pin-${quizId}`;
    toast.loading(newPinState ? "SECURING QUIZ..." : "RELEASING QUIZ...", { id: toastId });

    try {
      const idToken = await user.getIdToken(true);
      const result = await togglePinQuizAction(quizId, newPinState, idToken);

      if (result.success) {
        toast.dismiss(toastId);
        toast.success(`QUIZ ${newPinState ? 'SECURED' : 'RELEASED'}!`);
        setQuizzes(prevQuizzes =>
          prevQuizzes.map(q =>
            q.id === quizId ? { ...q, isPinned: newPinState } : q
          )
        );
      } else {
        toast.dismiss(toastId);
        toast.error(result.error || "SECURITY PROTOCOL FAILED");
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("SYSTEM ERROR: SECURITY UPDATE FAILED");
    } finally {
      setIsTogglingPin(null);
    }
  };

  const handleTitleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingTitle(e.target.value);
  };

  const handleTitleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, quizId: string) => {
    if (e.key === 'Enter') handleSaveTitle(quizId);
    else if (e.key === 'Escape') setEditingQuizId(null);
  };

  if (authLoading || (!authLoading && !user)) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#00f0ff]" />
      </div>
    )
  }

  const renderQuizCard = (quiz: QuizData, isPinnedSectionCard: boolean) => (
    <Card key={quiz.id} className={cn(
      "border-4 hover:border-[#ff4d00] transition-all flex flex-col",
      quiz.isPinned ? "border-[#00f0ff]" : "border-[#333]",
      "bg-[#0a0a0a]"
    )}>
      <CardHeader className="border-b-4 border-[#333]">
        <div className="flex justify-between items-start">
          {editingQuizId === quiz.id ? (
            <Input
              ref={inputRef}
              type="text"
              value={editingTitle}
              onChange={handleTitleInputChange}
              onKeyDown={(e) => handleTitleInputKeyDown(e, quiz.id)}
              onBlur={() => handleSaveTitle(quiz.id)}
              className={cn(
                "text-xl font-black uppercase tracking-wider flex-grow mr-2",
                "bg-black border-4 border-[#00f0ff] text-white",
                "focus:border-[#ff4d00] focus:ring-0"
              )}
              disabled={isRenaming === quiz.id}
            />
          ) : (
            <CardTitle
              className={cn(
                "text-xl font-black uppercase tracking-wider mb-1",
                "text-white hover:text-[#00f0ff] transition-colors cursor-pointer"
              )}
              onDoubleClick={() => (isRenaming !== quiz.id && isTogglingPin !== quiz.id) && handleStartEdit(quiz)}
            >
              {quiz.title}
            </CardTitle>
          )}
          {isRenaming === quiz.id && <Loader2 className="h-5 w-5 animate-spin text-[#00f0ff] ml-2" />}
        </div>
        <CardDescription className="text-gray-400 font-mono h-10 overflow-hidden text-ellipsis">
          {quiz.description || `${quiz.questionCount} CHALLENGES AWAIT.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center space-x-1 text-sm text-gray-400 font-mono">
              <FileText className="h-4 w-4 text-[#00f0ff]" />
              <span>{quiz.questionCount} QUESTIONS</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-400 font-mono">
              <Calendar className="h-4 w-4 text-[#00f0ff]" />
              <span>{formatDate(quiz.createdAt)}</span>
            </div>
          </div>
          {quiz.isPinned && !isPinnedSectionCard && <Pin className="h-5 w-5 text-[#ff4d00]" />}
        </div>
      </CardContent>
      <div className="p-6 pt-0 mt-auto">
        <div className="flex space-x-2">
          <Link href={`/quiz/${quiz.id}`} className="flex-1">
            <QuizifyButton 
              className={cn(
                "w-full border-4 font-black uppercase tracking-wider",
                "border-[#00f0ff] bg-[#00f0ff] text-black",
                "hover:bg-black hover:text-[#00f0ff] transition-all"
              )}
              disabled={editingQuizId === quiz.id || isRenaming === quiz.id || isTogglingPin === quiz.id}
            >
              <Play className="mr-2 h-4 w-4" />
              ENGAGE
            </QuizifyButton>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <QuizifyButton 
                className={cn(
                  "border-4 font-black uppercase tracking-wider",
                  "border-[#ff4d00] bg-[#ff4d00] text-black",
                  "hover:bg-black hover:text-[#ff4d00] transition-all"
                )}
                disabled={isDeleting === quiz.id || isConfirmingDelete === quiz.id || editingQuizId === quiz.id || isRenaming === quiz.id || isTogglingPin === quiz.id}
              >
                {(isDeleting === quiz.id || isConfirmingDelete === quiz.id || isTogglingPin === quiz.id) ? 
                  <Loader2 className="h-4 w-4 animate-spin" /> : 
                  <MoreHorizontal className="h-4 w-4" />
                }
              </QuizifyButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0a0a0a] border-4 border-[#00f0ff]">
              <DropdownMenuItem 
                className="font-mono focus:bg-[#1a1a1a] focus:text-[#00f0ff]"
                onClick={() => handleTogglePin(quiz.id, !quiz.isPinned)} 
                disabled={isTogglingPin === quiz.id}
              >
                {isTogglingPin === quiz.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : quiz.isPinned ? (
                  <PinOff className="mr-2 h-4 w-4 text-[#ff4d00]" />
                ) : (
                  <Pin className="mr-2 h-4 w-4 text-[#00f0ff]" />
                )}
                <span>{quiz.isPinned ? "UNPIN" : "PIN"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="font-mono focus:bg-[#1a1a1a] focus:text-[#00f0ff]"
                onClick={() => handleStartEdit(quiz)} 
                disabled={isRenaming === quiz.id || isTogglingPin === quiz.id}
              >
                <Edit3 className="mr-2 h-4 w-4 text-[#00f0ff]" />
                <span>RECODE</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="font-mono focus:bg-[#1a1a1a] focus:text-[#00f0ff]"
                onClick={() => handleShareQuiz(quiz.id, quiz.title)} 
                disabled={isTogglingPin === quiz.id}
              >
                <Share2 className="mr-2 h-4 w-4 text-[#00f0ff]" />
                <span>TRANSMIT</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="font-mono text-[#ff4d00] focus:bg-[#1a0a0a] focus:text-[#ff4d00]"
                onClick={() => handleDeleteQuiz(quiz.id)}
                disabled={isDeleting === quiz.id || isConfirmingDelete === quiz.id || isTogglingPin === quiz.id}
              >
                {(isDeleting === quiz.id || isConfirmingDelete === quiz.id) ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                <span>TERMINATE</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-10 border-b-4 border-[#ff4d00] pb-6">
          <h1 className="text-4xl font-black uppercase tracking-wider text-[#00f0ff] mb-2">
            QUIZ ARMORY
          </h1>
          <p className="text-gray-400 font-mono">
            // YOUR WEAPONS OF KNOWLEDGE DESTRUCTION //
          </p>
        </div>

        {isLoadingQuizzes ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <QuizCardSkeleton key={`skeleton-${i}`} />)}
          </div>
        ) : (
          <>
            {pinnedQuizzes.length > 0 && (
              <div className="mb-10"> 
                <h2 className="text-2xl font-black uppercase tracking-wider text-[#00f0ff] mb-4 border-b-4 border-[#00f0ff] pb-2">
                  PRIORITY WEAPONS
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pinnedQuizzes.map(quiz => renderQuizCard(quiz, true))}
                </div>
              </div>
            )}

            {pinnedQuizzes.length > 0 && unpinnedQuizzes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-black uppercase tracking-wider text-[#00f0ff] mb-4 border-b-4 border-[#00f0ff] pb-2">
                  STANDARD ISSUE
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {unpinnedQuizzes.map(quiz => renderQuizCard(quiz, false))}
                </div>
              </div>
            )}
            
            {pinnedQuizzes.length === 0 && unpinnedQuizzes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unpinnedQuizzes.map(quiz => renderQuizCard(quiz, false))}
              </div>
            )}

            {pinnedQuizzes.length > 0 && unpinnedQuizzes.length === 0 && quizzes.length > 0 && (
              <p className="text-gray-400 font-mono text-center py-6">NO STANDARD WEAPONS DETECTED.</p>
            )}
            
            {quizzes.length === 0 && !isLoadingQuizzes && (
              <div className="text-center py-12 flex flex-col items-center justify-center min-h-[calc(100vh-20rem)]">
                <BookOpenCheck className="h-20 w-20 text-[#00f0ff] mb-6" />
                <h2 className="text-2xl font-black uppercase tracking-wider text-[#ff4d00] mb-3">
                  ARMORY EMPTY!
                </h2>
                <p className="text-gray-400 font-mono mb-6 max-w-md mx-auto">
                  NO WEAPONS DETECTED. FORGE YOUR FIRST QUIZ TO COMMENCE BATTLE.
                </p>
                <Link href="/create-quiz">
                  <QuizifyButton 
                    className="border-4 border-[#ff4d00] bg-[#ff4d00] text-black hover:bg-black hover:text-[#ff4d00] font-black uppercase tracking-wider"
                    size="lg"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    FORGE QUIZ
                  </QuizifyButton>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}