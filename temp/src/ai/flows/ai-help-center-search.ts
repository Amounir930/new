'use server';
/**
 * @fileOverview An AI assistant for the help center that answers user questions based on a knowledge base.
 *
 * - aiHelpCenterSearch - A function that handles the AI help center search process.
 * - AiHelpCenterSearchInput - The input type for the aiHelpCenterSearch function.
 * - AiHelpCenterSearchOutput - The return type for the aiHelpCenterSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiHelpCenterSearchInputSchema = z.object({
  query: z
    .string()
    .describe('The natural language question asked by the customer.'),
});
export type AiHelpCenterSearchInput = z.infer<typeof AiHelpCenterSearchInputSchema>;

const AiHelpCenterSearchOutputSchema = z.object({
  answer: z
    .string()
    .describe('A concise and accurate answer to the customer\'s question.'),
});
export type AiHelpCenterSearchOutput = z.infer<typeof AiHelpCenterSearchOutputSchema>;

export async function aiHelpCenterSearch(
  input: AiHelpCenterSearchInput
): Promise<AiHelpCenterSearchOutput> {
  return aiHelpCenterSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiHelpCenterSearchPrompt',
  input: {schema: AiHelpCenterSearchInputSchema},
  output: {schema: AiHelpCenterSearchOutputSchema},
  prompt: `You are a helpful AI assistant for an e-commerce help center.
Your task is to provide accurate, concise, and helpful answers to customer questions based on the provided query.
Assume you have access to a comprehensive knowledge base.

Customer Question: {{{query}}}

Provide the answer in a clear and easy-to-understand manner. Focus on resolving the customer's issue quickly without needing further support interaction.`,
});

const aiHelpCenterSearchFlow = ai.defineFlow(
  {
    name: 'aiHelpCenterSearchFlow',
    inputSchema: AiHelpCenterSearchInputSchema,
    outputSchema: AiHelpCenterSearchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
