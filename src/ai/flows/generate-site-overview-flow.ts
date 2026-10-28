
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a professional Site Management Overview.
 *
 * - generateSiteOverview - Synthesizes user intent and geometric data into a professional report paragraph.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSiteOverviewInputSchema = z.object({
  siteName: z.string(),
  totalArea: z.string(),
  efficiency: z.number(),
  currentUsage: z.string().describe('What the user says they are doing with the land currently.'),
  managementIntent: z.string().describe('What the user plans to do with the land in the future.'),
  layerDetails: z.array(z.string()).optional().describe('List of specific field components being audited.'),
});
export type GenerateSiteOverviewInput = z.infer<typeof GenerateSiteOverviewInputSchema>;

const GenerateSiteOverviewOutputSchema = z.object({
  professionalOverview: z.string().describe('A synthesized professional summary for property reports.'),
});
export type GenerateSiteOverviewOutput = z.infer<typeof GenerateSiteOverviewOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateSiteOverviewPrompt',
  input: {schema: GenerateSiteOverviewInputSchema},
  output: {schema: GenerateSiteOverviewOutputSchema},
  prompt: `You are a Professional Estate Consultant and Strategic Land Planner.
Your goal is to synthesize raw technician notes and site metrics into a professional "Site Management Profile" paragraph for a formal audit report.

AUDIT CONTEXT:
- Site Holding: {{siteName}}
- Audited Surface: {{totalArea}}
- Component Efficiency: {{efficiency}}%
{{#if layerDetails}}
- Audited Components: 
{{#each layerDetails}}  * {{this}}
{{/each}}
{{/if}}
- Field Operations: "{{currentUsage}}"
- Strategic Intent: "{{managementIntent}}"

INSTRUCTIONS:
1. Combine the current operations and future intent into a cohesive, professional narrative focused EXCLUSIVELY on the audited components listed.
2. Use industry-standard terminology (e.g., "Operational footprint," "Strategic transition," "Spatial utility optimization," "Long-term land stewardship").
3. Maintain a formal, authoritative, yet visionary tone suitable for stakeholders or financial institutions.
4. Keep the summary to 4-6 sentences.
5. Focus on the relationship between the gross asset perimeter (if selected) and the functional working areas.

Respond with the 'professionalOverview' field populated.`,
});

const generateSiteOverviewFlow = ai.defineFlow(
  {
    name: 'generateSiteOverviewFlow',
    inputSchema: GenerateSiteOverviewInputSchema,
    outputSchema: GenerateSiteOverviewOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function generateSiteOverview(input: GenerateSiteOverviewInput): Promise<GenerateSiteOverviewOutput> {
  return generateSiteOverviewFlow(input);
}
