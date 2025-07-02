'use server';
/**
 * @fileOverview A Genkit flow for creating quizzes from PDF documents.
 *
 * - createQuiz - A function that generates a quiz based on PDF content.
 * - CreateQuizInput - The input type for the createQuizFlow.
 * - QuizData - The return type (quiz structure) for the createQuizFlow.
 * - QuizQuestion - The type for individual quiz questions.
 */

import { ai } from '../genkit';
import { z } from 'genkit';
import { v4 as uuidv4 } from 'uuid';

const CreateQuizInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "The PDF document content as a data URI. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
  questionCount: z.number().min(1).max(50).describe('The desired number of questions for the quiz.'),
  fileName: z.string().optional().describe('The original file name of the PDF, to help derive a title.'),
});
export type CreateQuizInput = z.infer<typeof CreateQuizInputSchema>;

// Internal Zod schema for a single question, including the ID (used for the final flow output)
const QuizQuestionSchemaInternal = z.object({
  id: z.string().uuid().describe('Unique ID for the question.'),
  questionText: z.string().describe('The text of the quiz question.'),
  options: z.array(z.string()).length(4).describe('An array of 4 answer options.'),
  correctAnswerIndex: z.number().min(0).max(3).describe('The 0-based index of the correct answer in the options array.'),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchemaInternal>;


const QuizDataSchema = z.object({
  id: z.string().uuid().describe('Unique ID for the quiz.'),
  title: z.string().describe('The title of the quiz, derived from the document content or file name.'),
  description: z.string().optional().describe('A brief description of the quiz content.'),
  questionCount: z.number().describe('The total number of questions in the quiz.'),
  questions: z.array(QuizQuestionSchemaInternal).describe('An array of quiz questions.'),
  createdAt: z.string().datetime().describe('Timestamp of when the quiz was created.'),
  userId: z.string().describe('The ID of the user who created the quiz.').optional(),
  pdfStorageUrl: z.string().url().optional().describe('URL where the original PDF is stored, if applicable.'),
});
export type QuizData = z.infer<typeof QuizDataSchema>;

// Schema for what the AI is expected to output for each question (NO ID here)
const AIQuestionOutputInternalSchema = z.object({
  questionText: z.string().describe('The text of the quiz question.'),
  options: z.array(z.string()).length(4).describe('An array of 4 answer options.'),
  correctAnswerIndex: z.number().min(0).max(3).describe('The 0-based index of the correct answer in the options array.'),
});

// Schema for the overall AI output for the prompt (NO quiz ID, createdAt, etc. here)
const AIPromptOutputSchemaInternal = z.object({
  title: z.string().describe('The title of the quiz, derived from the document content or file name.'),
  questions: z.array(AIQuestionOutputInternalSchema).describe('An array of quiz questions.'),
});


const quizGenerationPrompt = ai.definePrompt({
  name: 'quizGenerationPrompt',
  model: 'googleai/gemini-2.5-flash-preview-05-20', 
  input: { schema: CreateQuizInputSchema },
  output: { schema: AIPromptOutputSchemaInternal },
  prompt: `You are an expert quiz creator specializing in generating high-quality educational quizzes from PDF documents. Your task is to create a quiz based SOLELY on the content of the provided PDF document: {{media url=pdfDataUri}}.

Key Instructions:
1. **Content Focus & Quality:**
   - Focus on the main themes, key events, and important concepts from the document
   - Prioritize questions about significant plot points, character development, and major themes
   - Avoid questions about trivial details like specific dates or minor characters unless they are crucial to the story
   - For long documents (100+ pages), focus on the most important and memorable content

2. **Document Adherence & Originality:**
   - All questions MUST be derived directly from the information present in the PDF
   - Do NOT introduce any external knowledge or information not in the document
   - Ensure questions test understanding of the material, not just memorization
   - For long documents, create questions that span different sections to test overall comprehension

3. **Language Consistency:**
   - Generate the quiz title, all questions, and all answer options in the primary language used within the PDF
   - Maintain consistent terminology and naming conventions from the document

4. **Question Count & Distribution:**
   - Generate exactly {{{questionCount}}} multiple-choice questions
   - For long documents, distribute questions across different sections/chapters
   - If the document is too short to generate this many quality questions, generate as many as possible while maintaining quality

5. **Question Quality:**
   - Each question must be unique and meaningful
   - Avoid questions about:
     * Release dates or publication details unless central to the story
     * Minor characters or events unless they are crucial to the plot
     * Trivial details that don't contribute to understanding the main content
   - Focus on questions that test comprehension of:
     * Main plot points and story arcs
     * Character development and relationships
     * Key themes and messages
     * Important decisions and their consequences

6. **Answer Options:**
   - Provide 4 distinct answer options for each question
   - Ensure only one option is correct based on the PDF
   - Make incorrect options plausible but clearly wrong according to the document
   - Avoid obviously wrong or unrelated options

7. **Quiz Title:**
   - Generate a concise and relevant title that reflects the main theme or content
   - If a file name is provided ({{{fileName}}}), use it as a hint but prioritize content-based titles

8. **Output Format:**
Return your response STRICTLY as a JSON object matching the following structure. Do NOT include 'id' fields for the questions; these will be added programmatically later. Do not include any explanations, apologies, or text outside of this JSON object.

JSON Structure:
{
  "title": "Quiz Title Reflecting Main Theme",
  "questions": [
    {
      "questionText": "Text of the question in the document's language...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0
    }
    // ... more unique, high-quality questions
  ]
}
`,
});

const flow = ai.defineFlow(
  {
    name: 'createQuizFlow',
    inputSchema: CreateQuizInputSchema,
    outputSchema: QuizDataSchema, // This is the final output schema, including Quiz IDs etc.
  },
  async (input) => {
    console.log("createQuizFlow: Started with input:", { questionCount: input.questionCount, fileName: input.fileName, pdfDataUriLength: input.pdfDataUri.length });
    let outputFromAI;
    try {
      console.log("createQuizFlow: Calling quizGenerationPrompt model 'googleai/gemini-2.5-flash-preview-05-20'...");
      const startTime = Date.now();
      const { output, usage } = await quizGenerationPrompt(input); // Destructure usage if available
      const duration = Date.now() - startTime;
      console.log(`createQuizFlow: quizGenerationPrompt call completed in ${duration}ms.`);
      if (usage) {
        console.log("createQuizFlow: AI Usage data:", JSON.stringify(usage, null, 2));
      }
      
      // Log the raw output from AI for debugging, especially for large files
      // Be cautious with logging very large outputs in production
      let rawOutputString = "[Could not serialize AI output for logging]";
      try {
        rawOutputString = JSON.stringify(output, null, 2);
      } catch {
        console.warn("createQuizFlow: Failed to serialize AI output for detailed logging. Output might be too large or circular.");
      }
      console.log("createQuizFlow: Raw output received from AI (first 1000 chars):", rawOutputString.substring(0, 1000));
      if (rawOutputString.length > 1000) {
        console.log("createQuizFlow: (AI output was truncated in the log above)");
      }


      if (!output) {
        console.error("createQuizFlow: Error - AI prompt returned undefined/null output.");
        throw new Error('AI failed to generate quiz content (no output received).');
      }
      
      // Validate the structure of the AI's output before further processing
      // This uses the AIPromptOutputSchemaInternal, which is what the AI is *supposed* to return
      const validatedAIOutput = AIPromptOutputSchemaInternal.safeParse(output);
      if (!validatedAIOutput.success) {
        console.error("createQuizFlow: Error - AI output failed Zod validation against AIPromptOutputSchemaInternal.");
        console.error("createQuizFlow: Zod validation errors:", JSON.stringify(validatedAIOutput.error.errors, null, 2));
        console.error("createQuizFlow: Full AI output that failed validation (first 1000 chars):", rawOutputString.substring(0,1000));
        throw new z.ZodError(validatedAIOutput.error.errors); // Re-throw ZodError for action to catch
      }
      
      outputFromAI = validatedAIOutput.data; // Use the validated data

      if (!outputFromAI.title || !outputFromAI.questions || !Array.isArray(outputFromAI.questions)) {
         console.error("createQuizFlow: Error - Validated AI output is missing title or questions, or questions is not an array. This should not happen if Zod validation passed.");
         throw new Error('Validated AI output is malformed (missing title/questions).');
      }
      if (outputFromAI.questions.length === 0 && input.questionCount > 0) {
        console.warn("createQuizFlow: AI returned 0 questions, though questions were requested. Title from AI:", outputFromAI.title);
        // This might be intentional if the AI indicates it couldn't generate questions (e.g., from prompt instruction)
      }


    } catch (error: unknown) {
      console.error('-----------------------------------------------------');
      console.error('createQuizFlow: ERROR during quizGenerationPrompt call or initial processing:');
      console.error('Error Type:', Object.prototype.toString.call(error));
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error Name:', err.name);
      console.error('Error Message:', err.message);
      if (error instanceof z.ZodError) {
        console.error('Error Details (ZodError from rethrow or AIPromptOutputSchemaInternal parse):', JSON.stringify(error.errors, null, 2));
      } else if ((error as { details?: unknown })?.details) {
        console.error('Error Details (from error.details):', JSON.stringify((error as { details: unknown }).details, null, 2));
      }
      if ((error as { cause?: unknown })?.cause) {
        console.error('Error Cause (from error.cause):', JSON.stringify((error as { cause: unknown }).cause, null, 2));
      }
      console.error('Error Stack:', err.stack);
      console.error('-----------------------------------------------------');
      throw error; // Re-throw the error to be caught by the calling action
    }

    const quizId = uuidv4();
    // Ensure questions from AI are correctly mapped to QuizQuestionSchemaInternal (which includes 'id')
    const populatedQuestions: QuizQuestion[] = outputFromAI.questions.map(q => ({
        ...q, // q matches AIQuestionOutputInternalSchema
        id: uuidv4()
    }));
    console.log("createQuizFlow: Questions populated with IDs. Total questions generated by AI:", outputFromAI.questions.length, "Populated questions:", populatedQuestions.length);

    const result: QuizData = {
      title: outputFromAI.title,
      questions: populatedQuestions,
      id: quizId,
      questionCount: populatedQuestions.length, // Actual number of questions generated
      description: `Quiz generated from ${input.fileName || 'uploaded PDF'} using AI. Contains ${populatedQuestions.length} questions.`,
      createdAt: new Date().toISOString(),
      userId: uuidv4(), // Adding userId field
      // pdfStorageUrl is not handled in the flow, it's added by the action if upload is successful
    };
    console.log("createQuizFlow: Successfully constructed QuizData object. Quiz ID:", result.id, "Question count in final object:", result.questionCount);
    return result;
  }
);

export async function createQuiz(input: CreateQuizInput): Promise<QuizData> {
  console.log("createQuiz (exported function): Calling createQuizFlow with input:", { questionCount: input.questionCount, fileName: input.fileName, pdfDataUriLength: input.pdfDataUri.length ? `${input.pdfDataUri.length} chars` : "N/A" });
  return flow(input);
}
