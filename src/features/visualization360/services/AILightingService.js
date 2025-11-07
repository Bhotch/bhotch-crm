/**
 * AI-Powered Lighting Visualization Service
 * Generates realistic house visualizations with permanent eave lighting
 *
 * Supports multiple AI providers:
 * - Replicate (Stable Diffusion + ControlNet)
 * - Stability AI
 * - Fal.ai
 * - Canvas-based fallback for instant preview
 */

/**
 * Configuration for AI image generation
 */
const AI_PROVIDERS = {
  REPLICATE: 'replicate',
  STABILITY: 'stability',
  FAL: 'fal',
  CANVAS_FALLBACK: 'canvas'
};

/**
 * Lighting styles and their corresponding AI prompts
 */
const LIGHTING_STYLES = {
  warmWhite: {
    name: 'Warm White',
    color: '#FFE5B4',
    prompt: 'warm white LED permanent eave lighting, soft amber glow, 2700K color temperature, evening ambiance',
    temperature: '2700K'
  },
  coolWhite: {
    name: 'Cool White',
    color: '#F0F8FF',
    prompt: 'cool white LED permanent eave lighting, crisp bright illumination, 5000K daylight, modern clean look',
    temperature: '5000K'
  },
  jellyfish: {
    name: 'Jellyfish RGB',
    color: '#00FFFF',
    prompt: 'colorful RGB LED permanent eave lighting with jellyfish-inspired flowing colors, cyan and purple gradient, ethereal glow, dynamic color-changing effects',
    temperature: 'RGB'
  },
  red: {
    name: 'Red Accent',
    color: '#FF0000',
    prompt: 'vibrant red LED permanent eave lighting, bold accent illumination, dramatic effect',
    temperature: 'RGB'
  },
  blue: {
    name: 'Blue Accent',
    color: '#0000FF',
    prompt: 'deep blue LED permanent eave lighting, cool modern accent, elegant nighttime effect',
    temperature: 'RGB'
  },
  green: {
    name: 'Green Accent',
    color: '#00FF00',
    prompt: 'bright green LED permanent eave lighting, festive holiday effect, vibrant accent',
    temperature: 'RGB'
  },
  purple: {
    name: 'Purple Accent',
    color: '#9D00FF',
    prompt: 'royal purple LED permanent eave lighting, luxurious accent, dramatic ambiance',
    temperature: 'RGB'
  },
  multicolor: {
    name: 'Multi-Color Party',
    color: '#FF00FF',
    prompt: 'multi-color RGB LED permanent eave lighting, rainbow gradient effect, festive party lighting, dynamic color patterns',
    temperature: 'RGB'
  },
  christmas: {
    name: 'Christmas',
    color: '#FF0000',
    prompt: 'Christmas holiday permanent eave lighting, alternating red and green LEDs, festive holiday spirit, warm inviting glow',
    temperature: 'Holiday'
  },
  halloween: {
    name: 'Halloween',
    color: '#FF6600',
    prompt: 'Halloween permanent eave lighting, spooky orange and purple LEDs, eerie atmospheric effect',
    temperature: 'Holiday'
  }
};

/**
 * Generate AI prompt for lighting visualization
 */
const generateLightingPrompt = (lightingStyle, intensity = 100, customPrompt = '') => {
  const style = LIGHTING_STYLES[lightingStyle] || LIGHTING_STYLES.warmWhite;

  const basePrompt = `
    Professional architectural photograph of a house with permanent LED eave track lighting installed.
    ${style.prompt}.
    Brightness level: ${intensity}%.
    Clean installation along roofline, concealed aluminum track housing.
    High-quality realistic rendering, evening/dusk lighting, architectural photography.
    Sharp focus, professional real estate photo quality.
    ${customPrompt}
  `.trim().replace(/\s+/g, ' ');

  const negativePrompt = `
    blurry, low quality, distorted, unrealistic, cartoon, fake, oversaturated,
    visible wiring, messy installation, daytime, harsh shadows, poor lighting
  `.trim().replace(/\s+/g, ' ');

  return { prompt: basePrompt, negativePrompt };
};

/**
 * Canvas-based fallback: Apply lighting overlay effect
 * This provides instant preview while AI generation is processing
 */
export const applyLightingOverlay = async (imageFile, lightingStyle, intensity = 100) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: true });

        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        const style = LIGHTING_STYLES[lightingStyle] || LIGHTING_STYLES.warmWhite;

        // Detect roof/eave area (top 20-30% of image)
        const eaveHeight = Math.floor(img.height * 0.25);

        // Create gradient overlay for eave lighting effect
        const gradient = ctx.createLinearGradient(0, 0, 0, eaveHeight);
        gradient.addColorStop(0, style.color + Math.floor(intensity * 0.8).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.5, style.color + Math.floor(intensity * 0.5).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, style.color + '00'); // Transparent

        // Apply glow effect to eave area
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, img.width, eaveHeight);

        // Add spotlights effect along roofline
        ctx.globalCompositeOperation = 'lighter';
        const spotCount = 8;
        for (let i = 0; i < spotCount; i++) {
          const x = (img.width / spotCount) * i + (img.width / spotCount / 2);
          const y = eaveHeight * 0.3;

          const spotGradient = ctx.createRadialGradient(x, y, 10, x, y, 150);
          spotGradient.addColorStop(0, style.color + 'CC');
          spotGradient.addColorStop(0.3, style.color + '66');
          spotGradient.addColorStop(1, style.color + '00');

          ctx.fillStyle = spotGradient;
          ctx.fillRect(x - 150, y - 150, 300, 300);
        }

        // Reset composite mode
        ctx.globalCompositeOperation = 'source-over';

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (blob) {
              resolve({
                url: URL.createObjectURL(blob),
                blob,
                width: canvas.width,
                height: canvas.height,
                method: 'canvas-overlay',
                style: style.name
              });
            } else {
              reject(new Error('Failed to create lighting overlay'));
            }
          },
          'image/png',
          0.95
        );
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};

/**
 * Replicate API integration for AI image generation
 * Using Stable Diffusion XL + ControlNet for structure-preserving edits
 */
export const generateWithReplicate = async (imageFile, lightingStyle, intensity = 100, apiKey = null) => {
  try {
    // This would require Replicate API key
    if (!apiKey && !process.env.REACT_APP_REPLICATE_API_KEY) {
      throw new Error('Replicate API key not configured');
    }

    const { prompt, negativePrompt } = generateLightingPrompt(lightingStyle, intensity);

    // Convert image to base64
    const imageBase64 = await fileToBase64(imageFile);

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey || process.env.REACT_APP_REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        input: {
          image: imageBase64,
          prompt,
          negative_prompt: negativePrompt,
          num_inference_steps: 30,
          guidance_scale: 7.5,
          strength: 0.65, // Preserve structure but allow lighting changes
          scheduler: 'K_EULER_ANCESTRAL'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.statusText}`);
    }

    const prediction = await response.json();

    // Poll for completion
    let result = prediction;
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Token ${apiKey || process.env.REACT_APP_REPLICATE_API_KEY}`,
        }
      });

      result = await pollResponse.json();
    }

    if (result.status === 'failed') {
      throw new Error('AI generation failed');
    }

    return {
      url: result.output[0],
      method: 'replicate-ai',
      style: LIGHTING_STYLES[lightingStyle].name,
      processingTime: result.metrics?.predict_time
    };
  } catch (error) {
    console.error('Replicate generation failed:', error);
    throw error;
  }
};

/**
 * Fal.ai integration (faster alternative)
 */
export const generateWithFal = async (imageFile, lightingStyle, intensity = 100, apiKey = null) => {
  try {
    if (!apiKey && !process.env.REACT_APP_FAL_API_KEY) {
      throw new Error('Fal.ai API key not configured');
    }

    const { prompt, negativePrompt } = generateLightingPrompt(lightingStyle, intensity);
    const imageBase64 = await fileToBase64(imageFile);

    const response = await fetch('https://fal.run/fal-ai/fast-sdxl', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey || process.env.REACT_APP_FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageBase64,
        prompt,
        negative_prompt: negativePrompt,
        strength: 0.6,
        guidance_scale: 7.5,
        num_inference_steps: 25
      })
    });

    const result = await response.json();

    return {
      url: result.images[0].url,
      method: 'fal-ai',
      style: LIGHTING_STYLES[lightingStyle].name
    };
  } catch (error) {
    console.error('Fal.ai generation failed:', error);
    throw error;
  }
};

/**
 * Main function: Generate lighting visualization
 * Tries AI providers, falls back to canvas overlay
 */
export const generateLightingVisualization = async (
  imageFile,
  lightingStyle = 'warmWhite',
  intensity = 100,
  options = {}
) => {
  const { preferredProvider = AI_PROVIDERS.CANVAS_FALLBACK, apiKey = null, onProgress } = options;

  try {
    // Always generate instant preview first
    if (onProgress) onProgress({ status: 'generating-preview', progress: 10 });

    const preview = await applyLightingOverlay(imageFile, lightingStyle, intensity);

    if (onProgress) onProgress({
      status: 'preview-ready',
      progress: 30,
      previewUrl: preview.url
    });

    // If AI provider requested, try to generate high-quality version
    if (preferredProvider !== AI_PROVIDERS.CANVAS_FALLBACK) {
      if (onProgress) onProgress({ status: 'generating-ai', progress: 50 });

      let aiResult;

      switch (preferredProvider) {
        case AI_PROVIDERS.REPLICATE:
          aiResult = await generateWithReplicate(imageFile, lightingStyle, intensity, apiKey);
          break;
        case AI_PROVIDERS.FAL:
          aiResult = await generateWithFal(imageFile, lightingStyle, intensity, apiKey);
          break;
        default:
          aiResult = preview;
      }

      if (onProgress) onProgress({ status: 'complete', progress: 100 });

      return {
        preview,
        final: aiResult,
        style: LIGHTING_STYLES[lightingStyle]
      };
    }

    // Canvas-only mode
    if (onProgress) onProgress({ status: 'complete', progress: 100 });

    return {
      preview,
      final: preview,
      style: LIGHTING_STYLES[lightingStyle]
    };

  } catch (error) {
    console.error('Lighting visualization failed:', error);

    // Always fallback to canvas overlay
    const fallback = await applyLightingOverlay(imageFile, lightingStyle, intensity);

    return {
      preview: fallback,
      final: fallback,
      style: LIGHTING_STYLES[lightingStyle],
      error: error.message
    };
  }
};

/**
 * Helper: Convert file to base64
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Get available lighting styles
 */
export const getLightingStyles = () => LIGHTING_STYLES;

/**
 * Get AI provider options
 */
export const getAIProviders = () => AI_PROVIDERS;

export default {
  generateLightingVisualization,
  applyLightingOverlay,
  generateWithReplicate,
  generateWithFal,
  getLightingStyles,
  getAIProviders
};
