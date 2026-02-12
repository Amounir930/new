'use server';
/**
 * @fileOverview An AI agent that provides size recommendations for apparel based on user measurements and preferred fit.
 *
 * - aiSizeGuideRecommendation - A function that handles the AI-powered size recommendation process.
 * - AiSizeGuideRecommendationInput - The input type for the aiSizeGuideRecommendation function.
 * - AiSizeGuideRecommendationOutput - The return type for the aiSizeGuideRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiSizeGuideRecommendationInputSchema = z.object({
  productCategory: z
    .string()
    .describe('The category of the apparel item (e.g., "T-shirt", "Jeans", "Dress").'),
  chestMeasurementCm: z
    .number()
    .describe('The user\'s chest measurement in centimeters.'),
  waistMeasurementCm: z
    .number()
    .describe('The user\'s waist measurement in centimeters.'),
  hipMeasurementCm: z
    .number()
    .describe('The user\'s hip measurement in centimeters.'),
  inseamMeasurementCm: z
    .number()
    .optional()
    .describe('The user\'s inseam measurement in centimeters (optional, for bottoms).'),
  preferredFit: z
    .enum(['loose', 'regular', 'tight'])
    .describe('The user\'s preferred fit for the apparel (loose, regular, or tight).'),
  sizeChart: z
    .string()
    .describe(
      'A JSON string representing the product\'s size chart, mapping sizes to body measurements. Example: [{\"size\":\"S\",\"chest_min\":88,\"chest_max\":92,\"waist_min\":72,\"waist_max\":76,\"hip_min\":90,\"hip_max\":94}, ...]' +
        'This should be a stringified JSON array of objects, where each object has a "size" field and fields for measurement ranges (e.g., "chest_min", "chest_max").'
    ),
});

export type AiSizeGuideRecommendationInput = z.infer<
  typeof AiSizeGuideRecommendationInputSchema
>;

const AiSizeGuideRecommendationOutputSchema = z.object({
  recommendedSize: z
    .string()
    .describe('The recommended apparel size (e.g., "S", "M", "L", "XL").'),
  recommendationReasoning: z
    .string()
    .describe('The reasoning behind the size recommendation, explaining how it fits the measurements and preferred fit.'),
});

export type AiSizeGuideRecommendationOutput = z.infer<
  typeof AiSizeGuideRecommendationOutputSchema
>;

export async function aiSizeGuideRecommendation(
  input: AiSizeGuideRecommendationInput
): Promise<AiSizeGuideRecommendationOutput> {
  return aiSizeGuideRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiSizeGuideRecommendationPrompt',
  input: {schema: AiSizeGuideRecommendationInputSchema},
  output: {schema: AiSizeGuideRecommendationOutputSchema},
  prompt: `You are an expert apparel size recommender. Your task is to recommend the best size for a customer based on their body measurements, preferred fit, and the provided size chart for a specific product category.

Here is the customer's information:
- Product Category: {{{productCategory}}}
- Chest Measurement: {{{chestMeasurementCm}}} cm
- Waist Measurement: {{{waistMeasurementCm}}} cm
- Hip Measurement: {{{hipMeasurementCm}}} cm
{{#if inseamMeasurementCm}}
- Inseam Measurement: {{{inseamMeasurementCm}}} cm
{{/if}}
- Preferred Fit: {{{preferredFit}}}

Here is the product's size chart in JSON format:
{{{sizeChart}}}

Analyze the measurements against the size chart and the preferred fit. For a 'tight' fit, prioritize the lower end of the measurement range. For a 'loose' fit, prioritize the higher end or even size up if appropriate. For a 'regular' fit, aim for the middle of the range.

Provide the recommended size and a clear explanation of your reasoning.`,
});

const aiSizeGuideRecommendationFlow = ai.defineFlow(
  {
    name: 'aiSizeGuideRecommendationFlow',
    inputSchema: AiSizeGuideRecommendationInputSchema,
    outputSchema: AiSizeGuideRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
