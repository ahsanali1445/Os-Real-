
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React from 'react';

interface LandingPageProps {
  onLaunch: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  return (
    <div className="fixed inset-0 bg-black text-white overflow-y-auto overflow-x-hidden font-sans selection:bg-blue-500 selection:text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
         <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[60%] h-[40%] bg-cyan-500/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
         <div className="flex items-center gap-2">
            <span className="material-symbols-rounded text-3xl text-blue-500">grid_view</span>
            <span className="text-xl font-bold tracking-tight">Real OS</span>
         </div>
         <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Features</a>
            <a href="#" className="hover:text-white transition-colors">Intelligence</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
         </div>
         <button 
            onClick={onLaunch}
            className="bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md px-5 py-2 rounded-full text-sm font-semibold transition-all active:scale-95"
         >
            Launch Demo
         </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] text-center px-4">
         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-in slide-in-from-bottom-8 fade-in duration-700">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-medium tracking-wide text-gray-300">System Online • v2.0.1</span>
         </div>
         
         <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-6 animate-in zoom-in-95 duration-1000">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-500">
               The Future
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400">
               Is Native.
            </span>
         </h1>

         <p className="max-w-2xl text-lg md:text-xl text-gray-400 mb-12 leading-relaxed animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-200">
            Experience a web-based operating system powered by Gemini 2.5. 
            Real-time AI assistance, fluid glassmorphism UI, and a suite of pro apps right in your browser.
         </p>

         <button 
            onClick={onLaunch}
            className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg tracking-wide transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-95 animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-300"
         >
            <span className="relative z-10 flex items-center gap-2">
               Get Started
               <span className="material-symbols-rounded group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 blur-lg opacity-50 group-hover:opacity-100 transition-opacity"></div>
         </button>
         
         {/* Hero Image / Preview */}
         <div className="mt-20 w-full max-w-5xl aspect-video rounded-t-3xl border border-white/10 bg-gray-900/50 backdrop-blur-xl shadow-2xl overflow-hidden relative animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-500">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black z-20"></div>
            <img 
               src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
               alt="OS Preview" 
               className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute bottom-0 left-0 w-full p-8 z-30 flex items-end justify-between">
                <div className="text-left">
                   <h3 className="text-2xl font-bold mb-2">Infinite Workspace</h3>
                   <p className="text-gray-400 text-sm">Organize your life with virtual desktops and AI tools.</p>
                </div>
                <div className="flex gap-2">
                   <div className="w-3 h-3 rounded-full bg-red-500"></div>
                   <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                   <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
            </div>
         </div>
      </main>

      {/* Features Grid */}
      <section className="relative z-10 py-32 px-4 max-w-7xl mx-auto">
         <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">Intelligence</span>
         </h2>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
               { icon: 'smart_toy', title: 'Gemini Inside', desc: 'Native AI integration for coding, writing, and system control.' },
               { icon: 'speed', title: 'Ultra Fast', desc: 'Built on React 19 with optimized rendering and state management.' },
               { icon: 'lock', title: 'Secure Core', desc: 'Sandboxed environment with simulated file encryption.' },
               { icon: 'palette', title: 'Fluid Design', desc: 'Premium glassmorphism UI that adapts to your workflow.' },
               { icon: 'apps', title: 'Pro Apps', desc: 'Full suite of productivity tools including Stocks, Health, and Dev.' },
               { icon: 'cloud', title: 'Cloud Sync', desc: 'Seamlessly upload files and manage your digital assets.' },
            ].map((feature, i) => (
               <div key={i} className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                     <span className="material-symbols-rounded text-3xl">{feature.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
               </div>
            ))}
         </div>
      </section>
      
      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-white/10 text-center text-gray-500 text-sm">
         <p>© 2025 Real OS Concept. Built with Google GenAI.</p>
      </footer>
    </div>
  );
};
