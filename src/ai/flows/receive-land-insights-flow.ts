'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating professional Technical Site Characterization.
 *
 * - receiveLandInsights - A function that provides AI-generated technical insights based on site geometry and context.
 * - ReceiveLandInsightsInput - The input type for the receiveLandInsights function.
 * - ReceiveLandInsightsOutput - The return type for the receiveLandInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const ReceiveLandInsightsInputSchema = z.object({
  area: z.number().describe('The measured area of the land in square meters.'),
  unit: z.enum(['squareMeters', 'squareFeet', 'acres', 'hectares']).describe('The unit of measurement for the area.'),
  location: z.string().optional().describe('Optional geographical coordinates.'),
  classification: z.string().optional().describe('The surveyor classification (e.g., development, commercial, arable).'),
  userNotes: z.string().optional().describe('Technical notes provided by the field technician.'),
  coords: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
    alt: z.number().optional().nullable()
  })).optional().describe('The geometric vertices of the boundary.'),
});
export type ReceiveLandInsightsInput = z.infer<typeof ReceiveLandInsightsInputSchema>;

// Output Schema
const ReceiveLandInsightsOutputSchema = z.object({
  insights: z.string().describe('Professional technical site characterization and topographic overview.'),
});
export type ReceiveLandInsightsOutput = z.infer<typeof ReceiveLandInsightsOutputSchema>;

// Define the prompt
const receiveLandInsightsPrompt = ai.definePrompt({
  name: 'receiveLandInsightsPrompt',
  input: {schema: ReceiveLandInsightsInputSchema},
  output: {schema: ReceiveLandInsightsOutputSchema},
  prompt: `You are a professional Site Surveyor and Topographic Analyst. 
Your goal is to provide a "Technical Site Characterization" report based on measured geometric data.

SITE DATA:
- Measured Area: {{area}} square meters
{{#if classification}}- Classification: {{classification}}{{/if}}
{{#if userNotes}}- Technician Notes: "{{userNotes}}"{{/if}}
{{#if location}}- Primary Coordinates: {{location}}{{/if}}

INSTRUCTION:
- Analyze the site from a technical and physical perspective.
- Avoid agricultural advice (crops, soil health) unless the classification is strictly 'arable'.
- For Commercial or Development sites, focus on geometric complexity (e.g., "Regular footprint", "Irregular perimeter"), site utility, and potential drainage or surfacing implications.
- Describe the likely topographic profile based on the classification and notes.
- Use professional surveyor terminology (e.g., "Perimeter geometry", "Spatial footprint", "Topographic consistency").
- Keep the response to a concise, professional paragraph (3-5 sentences).
- Do not use filler. Be technical and precise.
`,
});

// Define the flow
const receiveLandInsightsFlow = ai.defineFlow(
  {
    name: 'receiveLandInsightsFlow',
    inputSchema: ReceiveLandInsightsInputSchema,
    outputSchema: ReceiveLandInsightsOutputSchema,
  },
  async (input) => {
    const {output} = await receiveLandInsightsPrompt(input);
    return output!;
  }
);

// Wrapper function
export async function receiveLandInsights(input: ReceiveLandInsightsInput): Promise<ReceiveLandInsightsOutput> {
  return receiveLandInsightsFlow(input);
}
