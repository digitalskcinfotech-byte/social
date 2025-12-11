import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none fixed"></div>
      
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <span className="font-bold text-white text-lg">S</span>
            </div>
            <h1 className="font-bold text-xl tracking-tight">SocialGen <span className="text-brand-500">AI</span></h1>
          </div>
          <div className="text-xs font-mono text-slate-500 border border-slate-800 rounded px-2 py-1">
            v1.0.0 • Gemini Powered
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        {children}
      </main>
    </div>
  );
};
