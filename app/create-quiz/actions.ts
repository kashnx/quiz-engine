
'use server';

import { z } from 'genkit';
import { createQuiz, type CreateQuizInput, type QuizData } from '@/ai/flows/create-quiz-flow';
import { uploadPdf } from '@/lib/firebase';
import { upload_limit, questions_range } from "@/config/upload";


// Helper function to convert File to Data URI
async function fileToDataUri(file: File): Promise<string> {
  console.log(`fileToDataUri: Starting conversion for file ${file.name}, size ${file.size}, type ${file.type}`);
  try {
    // Check if file is corrupted or empty
    if (file.size === 0) {
      throw new Error('File appears to be empty or corrupted');
    }

    // Read file in chunks to avoid memory issues
    const chunkSize = 1024 * 1024; // 1MB chunks
    const chunks: Uint8Array[] = [];
    let offset = 0;

    while (offset < file.size) {
      const chunk = file.slice(offset, offset + chunkSize);
      const arrayBuffer = await chunk.arrayBuffer();
      chunks.push(new Uint8Array(arrayBuffer));
      offset += chunkSize;
    }

    // Combine chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combinedBuffer = new Uint8Array(totalLength);
    let position = 0;
    
    for (const chunk of chunks) {
      combinedBuffer.set(chunk, position);
      position += chunk.length;
    }

    const base64String = Buffer.from(combinedBuffer).toString('base64');
    const dataUri = `data:${file.type};base64,${base64String}`;
    
    // Validate the data URI
    if (!dataUri.startsWith('data:application/pdf;base64,')) {
      throw new Error('Invalid PDF data generated');
    }

    console.log(`fileToDataUri: Data URI created, length ${dataUri.length}. Preview (first 100 chars): ${dataUri.substring(0,100)}`);
    return dataUri;
  } catch (conversionError: unknown) {
    console.error("fileToDataUri: CRITICAL ERROR during file to Data URI conversion:", conversionError);
    const error = conversionError instanceof Error ? conversionError : new Error(String(conversionError));
    console.error("Conversion Error Name:", error.name);
    console.error("Conversion Error Message:", error.message);
    console.error("Conversion Error Stack:", error.stack);
    throw new Error(`Failed to process PDF: ${error.message || 'Unknown conversion error.'} Please ensure your PDF is not corrupted and try again.`);
  }
}

export async function createQuizAction(
  prevState: unknown,
  formData: FormData,
): Promise<{ quiz?: QuizData; pdfStorageUrl?: string; error?: string; message?: string }> {
  console.log("createQuizAction: Server action started.");
  const file = formData.get('pdfFile') as File | null;
  const questionCountStr = formData.get('questionCount') as string | null;
  const userId = formData.get('userId') as string | null;

  try {
    console.log("createQuizAction: Initial checks...");
    if (!userId) {
      console.error("createQuizAction: Error - User not authenticated for action.");
      return { error: 'User not authenticated for action.' };
    }
    if (!file) {
      console.error("createQuizAction: Error - No PDF file uploaded.");
      return { error: 'No PDF file uploaded.' };
    }
    if (file.type !== 'application/pdf') {
      console.error("createQuizAction: Error - Invalid file type. Only PDF is allowed. Type:", file.type);
      return { error: 'Invalid file type. Only PDF is allowed.' };
    }
    if (file.size > upload_limit * 1024 * 1024) { // PDF upload size limit determined by upload_limit constant
      console.error(`createQuizAction: Error - File is too large. Maximum size is ${upload_limit}MB. File size: ${file.size}`);
      return { error: `File is too large. Maximum size is ${upload_limit}MB. Please try with a smaller file or split your PDF.` };
    }
    if (!questionCountStr) {
      console.error("createQuizAction: Error - Number of questions not specified.");
      return { error: 'Number of questions not specified.' };
    }

    const questionCount = parseInt(questionCountStr, 10);
    if (isNaN(questionCount) || questionCount < questions_range[0] || questionCount > questions_range[1]) {
      console.error(`createQuizAction: Error - Invalid number of questions. Must be between ${questions_range[0]} and ${questions_range[1]}. Value:`, questionCountStr);
      return { error: `Invalid number of questions. Must be between ${questions_range[0]} and ${questions_range[1]}.` };
    }
    console.log(`createQuizAction: File details - Name: ${file.name}, Size: ${file.size}, Type: ${file.type}. Question count: ${questionCount}`);
    console.log("createQuizAction: Initial checks passed.");

    let pdfDataUri: string;
    console.log("createQuizAction: Attempting file-to-data-URI conversion...");
    const conversionStartTime = Date.now();
    try {
      pdfDataUri = await fileToDataUri(file); // This can throw, caught by main try-catch
      const conversionDuration = Date.now() - conversionStartTime;
      console.log(`createQuizAction: File successfully converted to data URI in ${conversionDuration}ms. Data URI length: ${pdfDataUri.length}`);
    } catch (conversionErrorCaughtInAction) {
      // This catch is specifically for errors re-thrown by fileToDataUri and caught here.
      // The error is already logged in detail by fileToDataUri.
      console.error("createQuizAction: Caught error from fileToDataUri. Will return error to client.");
      // The re-thrown error from fileToDataUri should be specific enough.
      // This will be caught by the main try-catch and processed.
      throw conversionErrorCaughtInAction; 
    }
    console.log("createQuizAction: File-to-data-URI conversion process completed in action.");


    let pdfStorageUrlFromUpload: string | undefined;
    console.log("createQuizAction: Attempting PDF upload to Firebase Storage...");
    const uploadStartTime = Date.now();
    try {
      pdfStorageUrlFromUpload = await uploadPdf(file);
      const uploadDuration = Date.now() - uploadStartTime;
      console.log(`createQuizAction: PDF uploaded successfully to Firebase Storage in ${uploadDuration}ms. URL:`, pdfStorageUrlFromUpload);
    } catch (uploadError: unknown) {
      const error = uploadError instanceof Error ? uploadError : new Error(String(uploadError));
      console.warn('createQuizAction: PDF upload to Firebase Storage failed (non-fatal for AI). Name:', error.name, 'Message:', error.message, 'Stack:', error.stack?.substring(0, 500));
    }
    console.log("createQuizAction: PDF upload to Firebase Storage process completed.");


    console.log("createQuizAction: Attempting Genkit flow call...");
    const flowInput: CreateQuizInput = {
      pdfDataUri,
      questionCount,
      fileName: file.name,
    };

    console.log("createQuizAction: Calling createQuiz Genkit flow with input (details logged in flow):", { questionCount: flowInput.questionCount, fileName: flowInput.fileName, pdfDataUriLength: flowInput.pdfDataUri.length });
    const genkitStartTime = Date.now();
    const generatedQuizFromAI = await createQuiz(flowInput); // This can throw, caught by main try-catch
    const genkitDuration = Date.now() - genkitStartTime;
    console.log(`createQuizAction: Genkit flow call completed in ${genkitDuration}ms.`);

    if (!generatedQuizFromAI || !generatedQuizFromAI.id || !generatedQuizFromAI.questions || generatedQuizFromAI.questions.length === 0) {
      console.error("createQuizAction: Genkit flow returned invalid/empty quiz data. Raw data:", JSON.stringify(generatedQuizFromAI).substring(0,1000));
      return { error: 'AI failed to generate valid quiz content (incomplete/empty). Check server logs.' };
    }
    console.log("createQuizAction: Genkit flow returned valid quiz data. ID:", generatedQuizFromAI.id, "Questions:", generatedQuizFromAI.questions.length);
    console.log("createQuizAction: Genkit flow call process completed.");
    
    return {
        quiz: generatedQuizFromAI,
        pdfStorageUrl: pdfStorageUrlFromUpload,
        message: 'Quiz content generated. Ready for client-side saving.'
    };

  } catch (error: unknown) {
    console.error('------------------------------------------------------------------');
    console.error('createQuizAction: CRITICAL UNHANDLED ERROR in main try...catch block:');
    console.error('Error Type:', Object.prototype.toString.call(error));

    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error Name:', err.name || 'N/A');
    console.error('Error Message:', err.message || 'No message');
    console.error('Error Stack:', err.stack ? err.stack.substring(0, 1000) : 'No stack'); // Log first 1000 chars of stack

    let clientErrorMessage = `An unexpected server error occurred. Please try again. (Error: ${err.name || 'UnknownError'})`;

    if (error instanceof z.ZodError) {
      clientErrorMessage = `AI response validation error. Please check server logs for details. (ZodError)`;
      console.error('ZodError Details:', JSON.stringify(error.errors, null, 2));
    } else if (err.message?.includes('Failed to process PDF') || err.message?.includes('Invalid PDF data generated') ) {
      clientErrorMessage = err.message; 
    } else if (err.message?.includes('timeout') || err.message?.includes('deadline')) {
      clientErrorMessage = `AI processing timed out, possibly due to a large/complex document. (TimeoutError)`;
    } else if (err.name === 'GenkitError') {
      clientErrorMessage = `AI Generation Error: The AI failed to process your request. Please check the server logs for 'createQuizFlow' error details. (GenkitError: ${err.message || 'Core process failed'})`;
    } else if (err.message?.includes('AIService')) {
      clientErrorMessage = `An error occurred with the AI service. (AIServiceError: ${err.message})`;
    } else if (file && file.size > 20 * 1024 * 1024 && clientErrorMessage.includes('unexpected server error')) { // Heuristic for large files
        clientErrorMessage = `An unexpected server error occurred. This might be due to the large file size (${(file.size / (1024*1024)).toFixed(1)}MB). Please try a smaller file or check server logs. (Error: ${err.name || 'UnknownError'})`;
    }
    
    console.error('Client-facing error message to be returned:', clientErrorMessage);
    console.error('------------------------------------------------------------------');
    return { error: clientErrorMessage };
  }
}
