'use server';

/**
 * @fileOverview AI-powered tool that suggests optimal resizing and compression settings for an image.
 *
 * - suggestOptimalSettings - A function that suggests optimal image settings.
 * - OptimalSettingsInput - The input type for the suggestOptimalSettings function.
 * - OptimalSettingsOutput - The return type for the suggestOptimalSettings function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimalSettingsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to be resized and compressed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  desiredFileSizeKb: z
    .number()
    .optional()
    .describe('The desired file size of the image in kilobytes.'),
  desiredQuality: z
    .number()
    .optional()
    .describe('The desired quality of the image, on a scale of 0 to 100.'),
});
export type OptimalSettingsInput = z.infer<typeof OptimalSettingsInputSchema>;

const OptimalSettingsOutputSchema = z.object({
  width: z.number().describe('The suggested width of the resized image.'),
  height: z.number().describe('The suggested height of the resized image.'),
  quality: z
    .number()
    .describe('The suggested quality (compression) setting for the image, on a scale of 0 to 100.'),
  format: z
    .string()
    .describe('The suggested file format for the image (e.g., JPEG, PNG, WebP).'),
});
export type OptimalSettingsOutput = z.infer<typeof OptimalSettingsOutputSchema>;

export async function suggestOptimalSettings(
  input: OptimalSettingsInput
): Promise<OptimalSettingsOutput> {
  return suggestOptimalSettingsFlow(input);
}

const suggestOptimalSettingsPrompt = ai.definePrompt({
  name: 'suggestOptimalSettingsPrompt',
  input: {schema: OptimalSettingsInputSchema},
  output: {schema: OptimalSettingsOutputSchema},
  prompt: `You are an AI assistant that suggests optimal image resizing and compression settings.

  Based on the provided image and the user's desired output file size or quality,
  you will suggest the best settings to balance image quality and file size.

  Consider the image content when suggesting settings.

  Image: {{media url=photoDataUri}}
  Desired File Size (KB): {{desiredFileSizeKb}}
  Desired Quality (0-100): {{desiredQuality}}

  Suggest:
  - width
  - height
  - quality (0-100)
  - format (JPEG, PNG, WebP)
  `,
});

const suggestOptimalSettingsFlow = ai.defineFlow(
  {
    name: 'suggestOptimalSettingsFlow',
    inputSchema: OptimalSettingsInputSchema,
    outputSchema: OptimalSettingsOutputSchema,
  },
  async input => {
    const {output} = await suggestOptimalSettingsPrompt(input);
    return output!;
  }
);
