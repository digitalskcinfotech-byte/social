import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ContentType, Platform, Tone, TextGenerationResult, ImageGenerationResult, VideoGenerationResult } from './types';
import { generateSocialText, generateSocialImage, generateSocialVideo, hasSelectedApiKey, openSelectKey } from './services/geminiService';
import { Instagram, Send, ImageIcon, Video, Type, Copy, Download, Loader2, Sparkles, AlertCircle } from './components/Icons';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ContentType>(ContentType.TEXT);
  const [platform, setPlatform] = useState<Platform>(Platform.INSTAGRAM);
  const [tone, setTone] = useState<Tone>(Tone.PROFESSIONAL);
  const [prompt, setPrompt] = useState('');
  
  // State for generated content
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<TextGenerationResult | null>(null);
  const [mediaContent, setMediaContent] = useState<ImageGenerationResult | VideoGenerationResult | null>(null);
  
  // Veo Key check state
  const [hasVeoKey, setHasVeoKey] = useState(false);

  useEffect(() => {
    checkKeyStatus();
  }, []);

  const checkKeyStatus = async () => {
    const status = await hasSelectedApiKey();
    setHasVeoKey(status);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setTextContent(null);
    setMediaContent(null);

    try {
      if (activeTab === ContentType.TEXT) {
        const result = await generateSocialText(prompt, platform, tone);
        setTextContent(result);
      } else if (activeTab === ContentType.IMAGE) {
        const aspectRatio = platform === Platform.INSTAGRAM ? "1:1" : "3:4";
        const result = await generateSocialImage(prompt, aspectRatio);
        setMediaContent(result);
      } else if (activeTab === ContentType.VIDEO) {
        // Double check key before starting call
        if (!hasVeoKey) {
          await openSelectKey();
          const newStatus = await hasSelectedApiKey();
          if (!newStatus) {
            throw new Error("An API Key selection is required for Video generation.");
          }
          setHasVeoKey(true);
        }
        
        const result = await generateSocialVideo(prompt, platform);
        setMediaContent(result);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong during generation.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Panel: Controls */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-500" />
              Create Content
            </h2>

            {/* Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
              {Object.values(ContentType).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    activeTab === type
                      ? 'bg-slate-800 text-white shadow-lg shadow-slate-900/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {type === ContentType.TEXT && <Type className="w-4 h-4" />}
                  {type === ContentType.IMAGE && <ImageIcon className="w-4 h-4" />}
                  {type === ContentType.VIDEO && <Video className="w-4 h-4" />}
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {/* Platform Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Platform</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPlatform(Platform.INSTAGRAM)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                      platform === Platform.INSTAGRAM
                        ? 'border-brand-500/50 bg-brand-500/10 text-brand-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Instagram className="w-5 h-5" />
                    Instagram
                  </button>
                  <button
                    onClick={() => setPlatform(Platform.WHATSAPP)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                      platform === Platform.WHATSAPP
                        ? 'border-green-500/50 bg-green-500/10 text-green-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                    WhatsApp
                  </button>
                </div>
              </div>

              {/* Tone Selector (Text Only) */}
              {activeTab === ContentType.TEXT && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as Tone)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  >
                    {Object.values(Tone).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  {activeTab === ContentType.TEXT ? 'Topic or Key Points' : 'Visual Description'}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    activeTab === ContentType.TEXT 
                      ? "e.g., Summer sale on sneakers, 50% off until Sunday..."
                      : "e.g., A minimalist photo of neon sneakers on wet pavement, cyberpunk style..."
                  }
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
                />
              </div>

              {/* Veo Key Warning */}
              {activeTab === ContentType.VIDEO && !hasVeoKey && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-200">
                    Video generation requires a paid API key. You will be asked to select one from your Google Cloud project.
                    <br />
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-white">Learn more about billing</a>.
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                className={`w-full py-3.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                  isLoading || !prompt.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-brand-600 to-brand-500 hover:to-brand-400 text-white shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 active:scale-[0.98]'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate {activeTab === ContentType.TEXT ? 'Content' : activeTab === ContentType.IMAGE ? 'Image' : 'Video'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div className="md:col-span-7">
          <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col min-h-[500px]">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <span className="w-2 h-8 bg-brand-500 rounded-full"></span>
              Preview
            </h2>

            {error && (
               <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center gap-3">
                 <AlertCircle className="w-5 h-5" />
                 {error}
               </div>
            )}

            {!textContent && !mediaContent && !isLoading && !error && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-4">
                <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 opacity-20" />
                </div>
                <p>Your AI generated content will appear here.</p>
              </div>
            )}

            {isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
                <p className="text-slate-400 animate-pulse">Creating magic...</p>
                {activeTab === ContentType.VIDEO && (
                  <p className="text-xs text-slate-500 max-w-xs text-center">Video generation can take up to a minute. Please wait.</p>
                )}
              </div>
            )}

            {/* TEXT RESULT */}
            {textContent && !isLoading && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {textContent.hook && (
                   <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                     <div className="flex items-center justify-between mb-2">
                       <label className="text-xs font-bold text-brand-500 uppercase tracking-wider">Hook</label>
                       <button onClick={() => copyToClipboard(textContent.hook!)} className="text-slate-500 hover:text-brand-400">
                         <Copy className="w-4 h-4" />
                       </button>
                     </div>
                     <p className="text-lg font-medium text-slate-200">{textContent.hook}</p>
                   </div>
                )}

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Caption</label>
                    <button onClick={() => copyToClipboard(textContent.caption)} className="text-slate-500 hover:text-brand-400">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{textContent.caption}</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hashtags</label>
                    <button onClick={() => copyToClipboard(textContent.hashtags.join(' '))} className="text-slate-500 hover:text-brand-400">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {textContent.hashtags.map((tag, i) => (
                      <span key={i} className="text-brand-400 text-sm bg-brand-500/10 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MEDIA RESULT (Image/Video) */}
            {mediaContent && !isLoading && (
              <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="relative group rounded-xl overflow-hidden border border-slate-700 shadow-2xl max-w-full">
                  {'mimeType' in mediaContent ? (
                    // IMAGE
                    <img src={mediaContent.url} alt="Generated result" className="max-h-[500px] w-auto object-contain bg-black" />
                  ) : (
                    // VIDEO
                    <video controls src={mediaContent.url} className="max-h-[500px] w-auto bg-black" />
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                     <a 
                       href={mediaContent.url} 
                       download={`socialgen-${Date.now()}.${'mimeType' in mediaContent ? 'png' : 'mp4'}`}
                       className="bg-white text-black px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-slate-200 transition-colors"
                     >
                       <Download className="w-4 h-4" />
                       Download
                     </a>
                  </div>
                </div>
                
                <div className="text-center text-sm text-slate-500">
                  Generated with {activeTab === ContentType.IMAGE ? 'Gemini 2.5 Flash Image' : 'Veo'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default App;
