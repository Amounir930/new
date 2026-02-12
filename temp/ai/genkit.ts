// import {genkit} from 'genkit';
// import {googleAI} from '@genkit-ai/google-genai';

// This is the original configuration.
// To re-enable AI features, uncomment this section, remove the temporary mock below,
// and ensure your GEMINI_API_KEY is set in your .env file.
/*
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
*/

// Temporary mock to disable actual API calls during development.
// This prevents costs and allows the app to run without a configured API key.
export const ai = {
  defineFlow: (options: any, fn: any) => {
    return async (...args: any[]) => {
      console.log(
        `AI flow '${options.name}' was called, but AI is temporarily disabled.`
      );
      throw new Error(
        'AI features are temporarily disabled. Configure Genkit to re-enable them.'
      );
    };
  },
  definePrompt: (options: any) => {
    return async (input: any) => {
      throw new Error('AI features are temporarily disabled.');
    };
  },
} as any;
