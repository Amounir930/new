'use server';
/**
 * @fileOverview An AI-powered visual search agent for finding similar products from an image.
 *
 * - visualSearch - A function that handles the visual search process.
 * - VisualSearchInput - The input type for the visualSearch function.
 * - VisualSearchOutput - The return type for the visualSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VisualSearchInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image of a clothing item provided by the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  productCatalog: z
    .array(z.string())
    .describe('A list of available product names from which to recommend.'),
});
export type VisualSearchInput = z.infer<typeof VisualSearchInputSchema>;

const VisualSearchOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe('A list of recommended product names from the product catalog that are visually similar to the item in the image.'),
  reasoning: z
    .string()
    .describe('A brief explanation of why these recommendations were made based on the visual features of the image.'),
});
export type VisualSearchOutput = z.infer<typeof VisualSearchOutputSchema>;

export async function visualSearch(
  input: VisualSearchInput
): Promise<VisualSearchOutput> {
  return visualSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'visualSearchPrompt',
  input: {schema: VisualSearchInputSchema},
  output: {schema: VisualSearchOutputSchema},
  prompt: `You are an expert fashion visual search assistant for an e-commerce store. Your goal is to find products from the catalog that are visually similar to the item in the user's uploaded image.

You will analyze the provided image and identify the main clothing item's key characteristics (e.g., category like 'denim jacket', 'sundress'; color; pattern; style).

Based on these visual features, find 3-5 of the most similar products from the provided 'productCatalog'. You MUST ONLY recommend products from this list.

Provide the product names exactly as they appear in the catalog. Also, provide a brief reasoning for your recommendations based on the visual analysis.

User's Image: {{media url=imageDataUri}}

Available Product Catalog:
{{#each productCatalog}}- {{{this}}}
{{/each}}

Ensure your output strictly adheres to the JSON schema provided.`,
});

const visualSearchFlow = ai.defineFlow(
  {
    name: 'visualSearchFlow',
    inputSchema: VisualSearchInputSchema,
    outputSchema: VisualSearchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to get visual search results from the prompt.');
    }
    return output;
  }
);
