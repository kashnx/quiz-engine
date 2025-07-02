'use server';

import { adminDb, verifyIdToken } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function deleteQuizAction(
  quizId: string,
  idToken: string
): Promise<{ success?: boolean; error?: string; message?: string }> {
  console.log(`[SERVER ACTION deleteQuizAction] Received request to delete quizId: '${quizId}'`);

  if (!idToken) {
    console.error("[SERVER ACTION deleteQuizAction] Error: Firebase ID Token is missing.");
    return { error: "Authentication token is required." };
  }
  if (!quizId) {
    console.error("[SERVER ACTION deleteQuizAction] Error: Quiz ID is missing.");
    return { error: "Quiz ID is required." };
  }
  if (!adminDb || !verifyIdToken) {
    console.error("[SERVER ACTION deleteQuizAction] Firebase Admin SDK is not initialized.");
    return { error: "Server error: Admin SDK not initialized." };
  }

  const decodedToken = await verifyIdToken(idToken);
  if (!decodedToken || !decodedToken.uid) {
    console.error("[SERVER ACTION deleteQuizAction] Error: Invalid or unverifiable ID Token.");
    return { error: "Invalid authentication token." };
  }
  const currentUserId = decodedToken.uid;
  console.log(`[SERVER ACTION deleteQuizAction] ID Token verified. User UID: '${currentUserId}'`);

  const quizDocRefAdmin = adminDb.doc(`quizzes/${quizId}`);
  try {
    const quizDocSnapAdmin = await quizDocRefAdmin.get();
    if (!quizDocSnapAdmin.exists) {
      console.warn(`[SERVER ACTION deleteQuizAction] Quiz document quizzes/${quizId} not found.`);
      return { error: "Quiz not found or already deleted." };
    }
    const quizData = quizDocSnapAdmin.data();
    if (!quizData || quizData.userId !== currentUserId) {
      console.error(`[SERVER ACTION deleteQuizAction] Permission denied. User '${currentUserId}' does not own quiz '${quizId}'.`);
      return { error: "You do not have permission to delete this quiz." };
    }

    const batch = adminDb.batch();
    batch.delete(quizDocRefAdmin);

    const resultsQueryAdmin = adminDb.collection("quizResults")
      .where("quizId", "==", quizId)
      .where("userId", "==", currentUserId);
    const resultsSnapshotAdmin = await resultsQueryAdmin.get();
    if (!resultsSnapshotAdmin.empty) {
      resultsSnapshotAdmin.docs.forEach((resultDoc) => {
        batch.delete(resultDoc.ref);
      });
    }

    await batch.commit();
    revalidatePath("/my-quizzes");
    return { success: true, message: "Quiz and associated results deleted successfully." };
  } catch (error: unknown) {
    console.error(`[SERVER ACTION deleteQuizAction] Error during operation for quiz '${quizId}':`, error);
    const err = error instanceof Error ? error : new Error(String(error));
    return { error: `Failed to delete quiz: ${err.message}` };
  }
}

export async function renameQuizAction(
  quizId: string,
  newTitle: string,
  idToken: string
): Promise<{ success?: boolean; error?: string; message?: string }> {
  console.log(`[SERVER ACTION renameQuizAction] Request to rename quizId: '${quizId}' to new title: '${newTitle}'`);

  if (!idToken) {
    console.error("[SERVER ACTION renameQuizAction] Error: Firebase ID Token is missing.");
    return { error: "Authentication token is required." };
  }
  if (!quizId) {
    console.error("[SERVER ACTION renameQuizAction] Error: Quiz ID is missing.");
    return { error: "Quiz ID is required." };
  }
  if (!newTitle || newTitle.trim() === "") {
    console.error("[SERVER ACTION renameQuizAction] Error: New title is missing or empty.");
    return { error: "New title cannot be empty." };
  }
  if (newTitle.length > 150) { 
    console.error("[SERVER ACTION renameQuizAction] Error: New title is too long.");
    return { error: "New title is too long (max 150 characters)." };
  }
  if (!adminDb || !verifyIdToken) {
    console.error("[SERVER ACTION renameQuizAction] Firebase Admin SDK is not initialized.");
    return { error: "Server error: Admin SDK not initialized." };
  }

  const decodedToken = await verifyIdToken(idToken);
  if (!decodedToken || !decodedToken.uid) {
    console.error("[SERVER ACTION renameQuizAction] Error: Invalid or unverifiable ID Token.");
    return { error: "Invalid authentication token." };
  }
  const currentUserId = decodedToken.uid;
  console.log(`[SERVER ACTION renameQuizAction] ID Token verified. User UID: '${currentUserId}'`);

  const quizDocRefAdmin = adminDb.doc(`quizzes/${quizId}`);
  try {
    const quizDocSnapAdmin = await quizDocRefAdmin.get();
    if (!quizDocSnapAdmin.exists) {
      console.warn(`[SERVER ACTION renameQuizAction] Quiz document quizzes/${quizId} not found.`);
      return { error: "Quiz not found." };
    }
    const quizData = quizDocSnapAdmin.data();
    if (!quizData || quizData.userId !== currentUserId) {
      console.error(`[SERVER ACTION renameQuizAction] Permission denied. User '${currentUserId}' does not own quiz '${quizId}'.`);
      return { error: "You do not have permission to rename this quiz." };
    }

    await quizDocRefAdmin.update({ title: newTitle.trim() });
    console.log(`[SERVER ACTION renameQuizAction] Quiz '${quizId}' title updated to '${newTitle.trim()}' successfully.`);

    revalidatePath("/my-quizzes");
    return { success: true, message: "Quiz title updated successfully." };

  } catch (error: unknown) {
    console.error(`[SERVER ACTION renameQuizAction] Error during operation for quiz '${quizId}':`, error);
    const err = error instanceof Error ? error : new Error(String(error));
    return { error: `Failed to rename quiz: ${err.message}` };
  }
}

export async function togglePinQuizAction(
  quizId: string,
  isPinned: boolean,
  idToken: string
): Promise<{ success?: boolean; error?: string; message?: string }> {
  console.log(`[SERVER ACTION togglePinQuizAction] Request to set quizId: '${quizId}' pinned status to: ${isPinned}`);

  if (!idToken) {
    console.error("[SERVER ACTION togglePinQuizAction] Error: Firebase ID Token is missing.");
    return { error: "Authentication token is required." };
  }
  if (!quizId) {
    console.error("[SERVER ACTION togglePinQuizAction] Error: Quiz ID is missing.");
    return { error: "Quiz ID is required." };
  }
  if (typeof isPinned !== 'boolean') {
    console.error("[SERVER ACTION togglePinQuizAction] Error: isPinned status is missing or not a boolean.");
    return { error: "Pin status is invalid." };
  }
   if (!adminDb || !verifyIdToken) {
    console.error("[SERVER ACTION togglePinQuizAction] Firebase Admin SDK is not initialized.");
    return { error: "Server error: Admin SDK not initialized." };
  }

  const decodedToken = await verifyIdToken(idToken);
  if (!decodedToken || !decodedToken.uid) {
    console.error("[SERVER ACTION togglePinQuizAction] Error: Invalid or unverifiable ID Token.");
    return { error: "Invalid authentication token." };
  }
  const currentUserId = decodedToken.uid;
  console.log(`[SERVER ACTION togglePinQuizAction] ID Token verified. User UID: '${currentUserId}'`);

  const quizDocRefAdmin = adminDb.doc(`quizzes/${quizId}`);
  try {
    const quizDocSnapAdmin = await quizDocRefAdmin.get();
    if (!quizDocSnapAdmin.exists) {
      console.warn(`[SERVER ACTION togglePinQuizAction] Quiz document quizzes/${quizId} not found.`);
      return { error: "Quiz not found." };
    }
    const quizData = quizDocSnapAdmin.data();
    if (!quizData || quizData.userId !== currentUserId) {
      console.error(`[SERVER ACTION togglePinQuizAction] Permission denied. User '${currentUserId}' does not own quiz '${quizId}'.`);
      return { error: "You do not have permission to modify this quiz." };
    }

    await quizDocRefAdmin.update({ isPinned: isPinned });
    console.log(`[SERVER ACTION togglePinQuizAction] Quiz '${quizId}' pinned status updated to '${isPinned}' successfully.`);

    revalidatePath("/my-quizzes");
    return { success: true, message: `Quiz ${isPinned ? 'pinned' : 'unpinned'} successfully.` };

  } catch (error: unknown) {
    console.error(`[SERVER ACTION togglePinQuizAction] Error during operation for quiz '${quizId}':`, error);
    const err = error instanceof Error ? error : new Error(String(error));
    return { error: `Failed to update pin status: ${err.message}` };
  }
}
