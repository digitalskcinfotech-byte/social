import { GoogleGenAI, Type } from "@google/genai";
import { Platform, Tone, TextGenerationResult, ImageGenerationResult, VideoGenerationResult } from "../types";

// Helper to get client with correct key strategy
const getClient = () => {
  // Check if a user-selected key is available in the window object (for Veo/High-end models)
  // We use the environment key as default.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- Text Generation ---
export const generateSocialText = async (
  topic: string,
  platform: Platform,
  tone: Tone
): Promise<TextGenerationResult> => {
  const ai = getClient();
  
  const prompt = `Create a social media post for ${platform} about: "${topic}". 
  The tone should be ${tone}.
  Provide a catchy hook, a main caption body with emojis, and a list of relevant hashtags.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hook: { type: Type.STRING, description: "A catchy opening line" },
          caption: { type: Type.STRING, description: "The main content of the post including emojis" },
          hashtags: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of relevant hashtags including the #" 
          }
        },
        required: ["caption", "hashtags"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No content generated");
  
  return JSON.parse(text) as TextGenerationResult;
};

// --- Image Generation ---
export const generateSocialImage = async (
  prompt: string,
  aspectRatio: "1:1" | "3:4" | "16:9" = "1:1"
): Promise<ImageGenerationResult> => {
  const ai = getClient();
  
  // Using gemini-2.5-flash-image (Nano Banana) for fast, standard generation
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        // responseMimeType is not supported for this model, handled by finding inlineData
      }
    }
  });

  // Extract image
  let imageUrl = "";
  let mimeType = "image/png";

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      mimeType = part.inlineData.mimeType || "image/png";
      imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
      break;
    }
  }

  if (!imageUrl) {
    throw new Error("No image generated.");
  }

  return { url: imageUrl, mimeType };
};

// --- Video Generation (Veo) ---
export const generateSocialVideo = async (
  prompt: string,
  platform: Platform
): Promise<VideoGenerationResult> => {
  
  // Veo requires a selected paid API key.
  // We re-instantiate the client inside the function to ensure we pick up the latest key context if specific key selection happened.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const aspectRatio = platform === Platform.INSTAGRAM ? '9:16' : '16:9'; // Reels vs standard
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio
    }
  });

  // Polling loop
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;

  if (!videoUri) {
    throw new Error("Video generation failed or no URI returned.");
  }

  // Fetch the actual binary to allow display/download, appending the API key
  const fetchResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
  if (!fetchResponse.ok) {
    throw new Error("Failed to download generated video.");
  }

  const blob = await fetchResponse.blob();
  const objectUrl = URL.createObjectURL(blob);

  return { url: objectUrl };
};

// --- Check for API Key (Helper for UI) ---
export const hasSelectedApiKey = async (): Promise<boolean> => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    return await window.aistudio.hasSelectedApiKey();
  }
  return false;
};

export const openSelectKey = async (): Promise<void> => {
  if (window.aistudio && window.aistudio.openSelectKey) {
    await window.aistudio.openSelectKey();
  } else {
    alert("API Key selection feature is not available in this environment.");
  }
};
