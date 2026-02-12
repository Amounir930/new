'use server';
/**
 * @fileOverview A Genkit flow for personalized product recommendations.
 *
 * - personalizedProductRecommendations - A function that generates personalized product recommendations.
 * - PersonalizedProductRecommendationsInput - The input type for the personalizedProductRecommendations function.
 * - PersonalizedProductRecommendationsOutput - The return type for the personalizedProductRecommendations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema
const PersonalizedProductRecommendationsInputSchema = z.object({
  userId: z.string().optional().describe('Optional user ID for context.'),
  browsingHistory: z
    .array(z.string())
    .describe(
      'A list of products or categories the user has recently browsed.'
    ),
  purchaseHistory: z
    .array(z.string())
    .describe(
      'A list of products or categories the user has previously purchased.'
    ),
  productCatalog: z
    .array(z.string())
    .describe(
      'A list of available product names or descriptions from which to recommend.'
    ),
});
export type PersonalizedProductRecommendationsInput = z.infer<
  typeof PersonalizedProductRecommendationsInputSchema
>;

// Output Schema
const PersonalizedProductRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe('A list of recommended product names from the product catalog.'),
  reasoning: z
    .string()
    .describe('A brief explanation of why these recommendations were made.'),
});
export type PersonalizedProductRecommendationsOutput = z.infer<
  typeof PersonalizedProductRecommendationsOutputSchema
>;

// Wrapper function
export async function personalizedProductRecommendations(
  input: PersonalizedProductRecommendationsInput
): Promise<PersonalizedProductRecommendationsOutput> {
  return personalizedProductRecommendationsFlow(input);
}

// Define the prompt
const recommendPrompt = ai.definePrompt({
  name: 'personalizedProductRecommendationPrompt',
  input: { schema: PersonalizedProductRecommendationsInputSchema },
  output: { schema: PersonalizedProductRecommendationsOutputSchema },
  prompt: `You are an expert personalized shopping assistant. Your goal is to provide product recommendations tailored to a user's interests, based on their browsing and purchase history.

Here is the user's browsing history:
{{#if browsingHistory}}
{{#each browsingHistory}}- {{{this}}}
{{/each}}
{{else}}No browsing history provided.{{/if}}

Here is the user's purchase history:
{{#if purchaseHistory}}
{{#each purchaseHistory}}- {{{this}}}
{{/each}}
{{else}}No purchase history provided.{{/if}}

Here is a list of available products in the catalog. You MUST ONLY recommend products from this list:
{{#each productCatalog}}- {{{this}}}
{{/each}}

Based on the provided information, recommend 3-5 products from the 'productCatalog' that the user might be interested in. For each recommendation, provide the product name exactly as it appears in the catalog. Also, provide a brief reasoning for your recommendations.

Ensure your output strictly adheres to the JSON schema provided.`,
});

// Define the flow
const personalizedProductRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedProductRecommendationsFlow',
    inputSchema: PersonalizedProductRecommendationsInputSchema,
    outputSchema: PersonalizedProductRecommendationsOutputSchema,
  },
  async (input) => {
    const { output } = await recommendPrompt(input);
    if (!output) {
      throw new Error('Failed to get recommendations from the prompt.');
    }
    return output;
  }
);
