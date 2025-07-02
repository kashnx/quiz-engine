
/**
 * @fileOverview Central Genkit initialization and configuration.
 * This file exports the shared 'ai' object used throughout the application
 * for defining and running Genkit flows, prompts, and tools.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai'; // For Genkit v1.x

// Initialize Genkit with plugins.
// You might configure other options or add more plugins here.
// Ensure you have GOOGLE_API_KEY environment variable set for googleAI()
export const ai = genkit({
  plugins: [
    googleAI(), // Using Google AI (Gemini)
  ],
  // As per v1.x guidance, logLevel is not part of genkit() options.
  // For flow tracing/debugging, configure logging through environment variables
  // or platform-specific configurations if needed.
});

// Example of further configuration if needed (not typically required for basic setup):
// import { configureGenkit } from 'genkit';
// configureGenkit({
//   flowStateStore: 'firebase', // Example: if you set up Firebase flow state store
//   traceStore: 'firebase',     // Example: if you set up Firebase trace store
//   telemetry: {
//     instrumentation: 'google', // Example for Google Cloud operations
//     logger: 'google',          // Example for Google Cloud operations
//   }
// });
