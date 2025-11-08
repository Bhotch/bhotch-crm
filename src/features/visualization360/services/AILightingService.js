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
 * Canvas-based lighting overlay that follows actual roofline
 * This provides instant preview while AI generation is processing
 */
export const applyLightingOverlay = async (imageFile, lightingStyle, intensity = 100, rooflineData = null) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: true });

        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        const style = LIGHTING_STYLES[lightingStyle] || LIGHTING_STYLES.warmWhite;
        const alpha = intensity / 100;

        // If no roofline data provided, detect it now
        let roofline = rooflineData;
        if (!roofline) {
          try {
            roofline = await detectRoofline(imageFile);
          } catch (err) {
            console.warn('Roofline detection failed, using fallback', err);
            // Fallback to top 25% of image
            roofline = {
              rooflineY: Math.floor(img.height * 0.25),
              rooflinePoints: [],
              imageWidth: img.width,
              imageHeight: img.height,
              suggestedFixtureCount: Math.ceil(img.width / 150)
            };
          }
        }

        // Parse hex color to RGB
        const hexToRgb = (hex) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : { r: 255, g: 229, b: 180 };
        };

        const rgb = hexToRgb(style.color);

        // Calculate fixture positions along the roofline
        const fixtureCount = roofline.suggestedFixtureCount || 8;
        const fixtures = [];

        // If we have detected roofline points, use them
        if (roofline.rooflinePoints && roofline.rooflinePoints.length > 0) {
          // Sample points evenly across the roofline
          const step = Math.max(1, Math.floor(roofline.rooflinePoints.length / fixtureCount));
          for (let i = 0; i < roofline.rooflinePoints.length; i += step) {
            if (fixtures.length >= fixtureCount) break;
            fixtures.push(roofline.rooflinePoints[i]);
          }
        } else {
          // Create fixtures evenly across the width at the detected roofline height
          const spacing = img.width / (fixtureCount + 1);
          for (let i = 1; i <= fixtureCount; i++) {
            fixtures.push({
              x: spacing * i,
              y: roofline.rooflineY,
              brightness: 255
            });
          }
        }

        // Draw LED track along roofline (thin line)
        if (fixtures.length > 0) {
          ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.6})`;
          ctx.lineWidth = 3;
          ctx.shadowColor = style.color;
          ctx.shadowBlur = 8;

          // Draw continuous line through fixture points
          ctx.beginPath();
          ctx.moveTo(0, fixtures[0].y);

          fixtures.forEach(fixture => {
            ctx.lineTo(fixture.x, fixture.y);
          });

          ctx.lineTo(img.width, fixtures[fixtures.length - 1].y);
          ctx.stroke();

          // Reset shadow
          ctx.shadowBlur = 0;
        }

        // Draw individual LED fixtures with realistic glow
        fixtures.forEach((fixture) => {
          const x = fixture.x;
          const y = fixture.y;

          // LED fixture body (small dot)
          ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.9})`;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();

          // Bright core
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();

          // Glow effect - multiple layers for realistic spread
          const glowLayers = [
            { radius: 80, alpha: alpha * 0.4 },
            { radius: 120, alpha: alpha * 0.25 },
            { radius: 180, alpha: alpha * 0.15 },
            { radius: 240, alpha: alpha * 0.08 }
          ];

          glowLayers.forEach(layer => {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, layer.radius);
            gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${layer.alpha})`);
            gradient.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${layer.alpha * 0.6})`);
            gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

            ctx.fillStyle = gradient;
            ctx.fillRect(x - layer.radius, y - layer.radius, layer.radius * 2, layer.radius * 2);
          });

          // Downward light beam (simulating wall wash)
          const beamGradient = ctx.createLinearGradient(x, y, x, y + 300);
          beamGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.3})`);
          beamGradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.15})`);
          beamGradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

          ctx.fillStyle = beamGradient;
          ctx.fillRect(x - 40, y, 80, 300);
        });

        // Optional: Add atmospheric glow below roofline
        const atmosphereGradient = ctx.createLinearGradient(0, roofline.rooflineY, 0, roofline.rooflineY + 200);
        atmosphereGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.15})`);
        atmosphereGradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = atmosphereGradient;
        ctx.fillRect(0, roofline.rooflineY, img.width, 200);
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
                style: style.name,
                rooflineData: roofline
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
  const { preferredProvider = AI_PROVIDERS.CANVAS_FALLBACK, apiKey = null, onProgress, rooflineData = null } = options;

  try {
    // Detect roofline if not provided
    let roofline = rooflineData;
    if (!roofline && onProgress) {
      onProgress({ status: 'detecting-roofline', progress: 5 });
    }

    // Always generate instant preview first
    if (onProgress) onProgress({ status: 'generating-preview', progress: 10 });

    const preview = await applyLightingOverlay(imageFile, lightingStyle, intensity, roofline);

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
        style: LIGHTING_STYLES[lightingStyle],
        rooflineData: preview.rooflineData
      };
    }

    // Canvas-only mode
    if (onProgress) onProgress({ status: 'complete', progress: 100 });

    return {
      preview,
      final: preview,
      style: LIGHTING_STYLES[lightingStyle],
      rooflineData: preview.rooflineData
    };

  } catch (error) {
    console.error('Lighting visualization failed:', error);

    // Always fallback to canvas overlay
    const fallback = await applyLightingOverlay(imageFile, lightingStyle, intensity, rooflineData);

    return {
      preview: fallback,
      final: fallback,
      style: LIGHTING_STYLES[lightingStyle],
      rooflineData: fallback.rooflineData,
      error: error.message
    };
  }
};

/**
 * Detect roofline in image using edge detection
 */
export const detectRoofline = async (imageFile) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Simple edge detection for roof area
        const topThird = Math.floor(canvas.height * 0.33);
        let rooflinePoints = [];

        // Scan horizontal lines in top third for significant edges
        for (let y = 0; y < topThird; y += 5) {
          for (let x = 0; x < canvas.width; x += 10) {
            const idx = (y * canvas.width + x) * 4;
            const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

            // Check for edge (significant brightness change)
            if (x > 0) {
              const prevIdx = (y * canvas.width + (x - 10)) * 4;
              const prevBrightness = (data[prevIdx] + data[prevIdx + 1] + data[prevIdx + 2]) / 3;

              if (Math.abs(brightness - prevBrightness) > 30) {
                rooflinePoints.push({ x, y, brightness });
              }
            }
          }
        }

        // Group points by height to find main roofline
        const heightGroups = {};
        rooflinePoints.forEach(point => {
          const bucket = Math.floor(point.y / 20) * 20;
          if (!heightGroups[bucket]) heightGroups[bucket] = [];
          heightGroups[bucket].push(point);
        });

        // Find most prominent roofline (most points)
        let mainRoofline = null;
        let maxPoints = 0;
        Object.entries(heightGroups).forEach(([height, points]) => {
          if (points.length > maxPoints) {
            maxPoints = points.length;
            mainRoofline = parseInt(height);
          }
        });

        URL.revokeObjectURL(url);

        resolve({
          rooflineY: mainRoofline || Math.floor(canvas.height * 0.25),
          rooflinePoints: heightGroups[mainRoofline] || [],
          imageWidth: canvas.width,
          imageHeight: canvas.height,
          suggestedFixtureCount: Math.ceil(canvas.width / 150), // Fixture every ~150px
        });
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for roofline detection'));
    };

    img.src = url;
  });
};

/**
 * Calculate cost estimate based on house dimensions
 */
export const calculateCostEstimate = (imageMetadata, rooflineData) => {
  // Estimate house width in feet (assume typical house photo is 40-60 feet wide)
  const estimatedWidthFeet = 50;
  const pixelsPerFoot = rooflineData.imageWidth / estimatedWidthFeet;

  // Calculate linear feet of eave track needed (perimeter estimate)
  // Typical house: front + 2 sides visible
  const linearFeet = Math.ceil(estimatedWidthFeet * 2.5); // Front + sides

  // Rime Lighting Pricing
  const pricePerFoot = 32; // Track cost per foot
  const fixtureCount = rooflineData.suggestedFixtureCount || Math.ceil(linearFeet / 2);
  const controllerCost = 450; // Smart control module
  const powerSupplyCost = 125; // Power supply
  const installationPerFoot = 15; // Installation labor

  const materialsCost = linearFeet * pricePerFoot;
  const installationCost = linearFeet * installationPerFoot;
  const hardwareCost = controllerCost + powerSupplyCost;

  const subtotal = materialsCost + installationCost + hardwareCost;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  return {
    linearFeet,
    fixtureCount,
    breakdown: {
      materials: materialsCost,
      installation: installationCost,
      controller: controllerCost,
      powerSupply: powerSupplyCost,
      subtotal,
      tax,
      total
    },
    pricePerFoot: total / linearFeet,
    estimatedWidthFeet
  };
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
  detectRoofline,
  calculateCostEstimate,
  getLightingStyles,
  getAIProviders
};
