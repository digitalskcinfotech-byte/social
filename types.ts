export enum ContentType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

export enum Platform {
  INSTAGRAM = 'Instagram',
  WHATSAPP = 'WhatsApp'
}

export enum Tone {
  PROFESSIONAL = 'Professional',
  CASUAL = 'Casual',
  WITTY = 'Witty',
  INSPIRATIONAL = 'Inspirational',
  URGENT = 'Urgent/Sales'
}

export interface TextGenerationResult {
  caption: string;
  hashtags: string[];
  hook?: string;
}

export interface ImageGenerationResult {
  url: string;
  mimeType: string;
}

export interface VideoGenerationResult {
  url: string;
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
  result: TextGenerationResult | ImageGenerationResult | VideoGenerationResult | null;
}
