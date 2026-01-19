/**
 * Avatar Generation Service
 * Uses fal.ai to generate Final Fantasy pixel art avatars for parts
 */

// fal.ai API endpoint for image generation
const FAL_API_URL = 'https://fal.run/fal-ai/flux/schnell';

/**
 * Avatar generation result
 */
export interface AvatarResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Build the prompt for avatar generation
 *
 * @param partName - The name of the part
 * @param customPrompt - Optional custom prompt additions
 * @returns The full prompt for image generation
 */
function buildAvatarPrompt(partName: string, customPrompt?: string): string {
  const basePrompt = `Final Fantasy pixel art character portrait, chibi style, ${partName}, RPG character, vibrant colors`;

  if (customPrompt) {
    return `${basePrompt}, ${customPrompt}`;
  }

  return basePrompt;
}

/**
 * Get the fal.ai API key from environment
 *
 * @returns The API key or null if not configured
 */
function getFalApiKey(): string | null {
  // Check Vite environment variable
  const key = import.meta.env.VITE_FAL_API_KEY;

  if (!key || key === 'undefined' || key === '') {
    return null;
  }

  return key;
}

/**
 * Generate a pixel art avatar for a part using fal.ai
 *
 * @param partName - The name of the part to generate an avatar for
 * @param customPrompt - Optional custom additions to the generation prompt
 * @returns The generation result with URL or error
 */
export async function generateAvatar(
  partName: string,
  customPrompt?: string
): Promise<AvatarResult> {
  const apiKey = getFalApiKey();

  if (!apiKey) {
    console.error('[Avatar] fal.ai API key not configured');
    return {
      success: false,
      error: 'fal.ai API key not configured. Add VITE_FAL_API_KEY to your .env file.',
    };
  }

  const prompt = buildAvatarPrompt(partName, customPrompt);

  console.log(`[Avatar] Generating avatar for "${partName}" with prompt: ${prompt}`);

  try {
    const response = await fetch(FAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: 'square', // 1:1 aspect ratio for avatars
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Avatar] API error: ${response.status} - ${errorText}`);
      return {
        success: false,
        error: `API error: ${response.status} - ${response.statusText}`,
      };
    }

    const data = await response.json();

    // fal.ai returns images in an array
    if (data.images && data.images.length > 0) {
      const imageUrl = data.images[0].url;
      console.log(`[Avatar] Generated successfully: ${imageUrl}`);
      return {
        success: true,
        url: imageUrl,
      };
    }

    console.error('[Avatar] No images in response:', data);
    return {
      success: false,
      error: 'No images returned from API',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Avatar] Generation failed: ${errorMessage}`);
    return {
      success: false,
      error: `Generation failed: ${errorMessage}`,
    };
  }
}

/**
 * Check if avatar generation is available (API key configured)
 *
 * @returns True if the fal.ai API key is configured
 */
export function isAvatarGenerationAvailable(): boolean {
  return getFalApiKey() !== null;
}

/**
 * Get the default avatar prompt template
 *
 * @returns The base prompt template used for generation
 */
export function getDefaultPromptTemplate(): string {
  return 'Final Fantasy pixel art character portrait, chibi style, [name], RPG character, vibrant colors';
}

/**
 * Validate a custom prompt for safety
 *
 * @param prompt - The custom prompt to validate
 * @returns True if the prompt is safe to use
 */
export function validateCustomPrompt(prompt: string): boolean {
  // Basic validation - reject empty or excessively long prompts
  if (!prompt || prompt.trim().length === 0) {
    return true; // Empty is fine, we'll use default
  }

  if (prompt.length > 500) {
    return false;
  }

  // Could add more validation here for inappropriate content
  return true;
}

/**
 * Generate a placeholder avatar URL for parts without generated avatars
 * Uses DiceBear for deterministic avatars based on part name
 *
 * @param partName - The name of the part
 * @returns A URL to a placeholder avatar
 */
export function getPlaceholderAvatarUrl(partName: string): string {
  // Use DiceBear's pixel art style as fallback
  const encodedName = encodeURIComponent(partName);
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodedName}`;
}
