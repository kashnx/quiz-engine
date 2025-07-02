// src/types/quiz.ts

/**
 * @fileOverview Shared TypeScript interfaces for Quiz data structures.
 * These are plain interfaces, independent of Zod or Genkit,
 * suitable for use in parts of the application that don't directly interact with AI flows
 * but still need to understand the shape of quiz data (e.g., server actions for cloning).
 */

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface QuizData {
  id: string;
  title: string;
  description?: string;
  questionCount: number;
  questions: QuizQuestion[];
  userId: string; // Firestore UID of the quiz owner
  isPublic: boolean;
  isPinned?: boolean; // Added for pinning functionality
  pdfStorageUrl?: string;
  // createdAt is typically a Firestore Timestamp when read from DB,
  // or a serverTimestamp placeholder when writing.
  // For cloning, the action will set a new serverTimestamp.
  createdAt: any;
}
