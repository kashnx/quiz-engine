'use server';

import { adminDb, verifyIdToken, adminAppInstance } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore'; // For Admin SDK server timestamp
import type { QuizData, QuizQuestion } from '@/types/quiz'; // Using plain TS types
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

export async function cloneQuizAction(
  originalQuizId: string,
  idToken: string
): Promise<{ newQuizId?: string; error?: string; message?: string }> {
  console.log(`[SERVER ACTION cloneQuizAction] Request to clone quizId: '${originalQuizId}'`);

  if (!idToken || typeof idToken !== 'string' || idToken.trim() === '') {
    console.error("[SERVER ACTION cloneQuizAction] Error: Firebase ID Token is missing or empty.");
    return { error: "Authentication token is required and cannot be empty." };
  }
  if (!originalQuizId) {
    console.error("[SERVER ACTION cloneQuizAction] Error: Original Quiz ID is missing.");
    return { error: "Original Quiz ID is required." };
  }

  if (!adminAppInstance) {
    console.error("[SERVER ACTION cloneQuizAction] Firebase Admin App SDK (adminAppInstance) is not initialized. Cannot verify token. Check server startup logs for 'firebase-admin.ts'.");
    return { error: "Server authentication service is not configured. Please contact support." };
  }
  if (!adminDb) {
    console.error("[SERVER ACTION cloneQuizAction] Firebase Admin Firestore SDK (adminDb) is not initialized. Cannot access or save quiz data. Check server startup logs for 'firebase-admin.ts'.");
    return { error: "Server database service is not configured. Please contact support." };
  }

  console.log(`[SERVER ACTION cloneQuizAction] ID Token received. Length: ${idToken.length}. Preview (first 10, last 10): ${idToken.substring(0, 10)}...${idToken.substring(idToken.length - 10)}`);

  const decodedToken = await verifyIdToken(idToken);
  if (!decodedToken || !decodedToken.uid) {
    const verificationFailureReason = decodedToken === null ? 'null (verification failed)' : 'a token without a uid';
    console.error(`[SERVER ACTION cloneQuizAction] Error: Invalid or unverifiable ID Token. verifyIdToken returned: ${verificationFailureReason}.`);
    console.error("[SERVER ACTION cloneQuizAction] IMPORTANT: Check server logs for a more detailed error message from '[Firebase Admin Verify Token]' inside 'verifyIdToken' function (in firebase-admin.ts) - this will contain the root cause from the Firebase Admin SDK.");
    return { error: "Invalid authentication token. Server could not verify your user identity. Please try signing out and in again, and check server logs for specific token verification errors." };
  }
  const newUserId = decodedToken.uid;
  console.log(`[SERVER ACTION cloneQuizAction] ID Token verified. New owner UID: '${newUserId}'`);

  try {
    const originalQuizDocRefAdmin = adminDb.doc(`quizzes/${originalQuizId}`);
    const originalQuizSnapAdmin = await originalQuizDocRefAdmin.get();

    if (!originalQuizSnapAdmin.exists) {
      console.warn(`[SERVER ACTION cloneQuizAction] Original quiz document quizzes/${originalQuizId} not found (Admin SDK).`);
      return { error: "Original quiz not found." };
    }

    const originalQuizData = originalQuizSnapAdmin.data() as QuizData;

    if (originalQuizData.userId === newUserId) {
        console.log(`[SERVER ACTION cloneQuizAction] User '${newUserId}' already owns quiz '${originalQuizId}'. No cloning needed.`);
        return { newQuizId: originalQuizId, message: "You already own this quiz." };
    }

    const newQuizId = uuidv4();
    const newQuestions: QuizQuestion[] = originalQuizData.questions.map(q => ({
      ...q,
      id: uuidv4(),
    }));

    const clonedQuizDataForAdminFirestore: Partial<QuizData> & { id: string; userId: string; createdAt: FirebaseFirestore.FieldValue; title: string; questionCount: number; questions: QuizQuestion[]; isPublic: boolean; } = {
      id: newQuizId,
      title: originalQuizData.title,
      description: originalQuizData.description || `Cloned from "${originalQuizData.title}"`,
      questionCount: originalQuizData.questionCount,
      questions: newQuestions,
      userId: newUserId,
      isPublic: originalQuizData.isPublic !== undefined ? originalQuizData.isPublic : true,
      createdAt: FieldValue.serverTimestamp(),
    };

    // Conditionally add pdfStorageUrl only if it exists in the original data
    if (originalQuizData.pdfStorageUrl) {
      clonedQuizDataForAdminFirestore.pdfStorageUrl = originalQuizData.pdfStorageUrl;
    }

    const newQuizDocRefAdmin = adminDb.doc(`quizzes/${newQuizId}`);
    await newQuizDocRefAdmin.set(clonedQuizDataForAdminFirestore);

    console.log(`[SERVER ACTION cloneQuizAction] Quiz '${originalQuizId}' successfully cloned as '${newQuizId}' for user '${newUserId}' using Admin SDK.`);

    revalidatePath('/my-quizzes');
    revalidatePath(`/quiz/${newQuizId}`);

    return { newQuizId, message: "Quiz added to your collection and ready to start!" };

  } catch (error: unknown) {
    console.error(`[SERVER ACTION cloneQuizAction] Error during cloning for originalQuizId '${originalQuizId}':`, error);
    const err = error instanceof Error ? error : new Error(String(error));
    return { error: `Failed to add quiz to your collection: ${err.message}` };
  }
}
