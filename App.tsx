
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useCallback, useEffect, useState, useRef} from 'react';
import {GeneratedContent} from './components/GeneratedContent';
import {Icon} from './components/Icon';
import {ParametersPanel} from './components/ParametersPanel';
import {Window} from './components/Window';
import {APP_DEFINITIONS_CONFIG, INITIAL_MAX_HISTORY_LENGTH, WALLPAPERS} from './constants';
import {streamAppContent} from './services/geminiService';
import {AppDefinition, InteractionData, WorkspaceState, FileSystemItem} from './types';
import {MeriAssistant} from './components/MeriAssistant';
import {LandingPage} from './components/LandingPage';

// --- Constants ---
const SYSTEM_APPS = ['my_computer', 'settings_app', 'app_store', 'file_manager', 'trash_bin'];
const HIDDEN_BY_DEFAULT = ['snake_game', 'plumber_game', 'cyber_race'];
const DEFAULT_INSTALLED_APPS = APP_DEFINITIONS_CONFIG
  .filter(app => !HIDDEN_BY_DEFAULT.includes(app.id))
  .map(app => app.id);

// --- Sound Utility ---
const playSystemSound = (type: 'click' | 'open' | 'notification' | 'startup' | 'hover' | 'error' | 'unlock') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'open') {
       osc.type = 'triangle';
       osc.frequency.setValueAtTime(300, now);
       osc.frequency.linearRampToValueAtTime(500, now + 0.1);
       gain.gain.setValueAtTime(0.03, now);
       gain.gain.linearRampToValueAtTime(0, now + 0.1);
       osc.start(now);
       osc.stop(now + 0.1);
    } else if (type === 'notification') {
       osc.type = 'sine';
       osc.frequency.setValueAtTime(900, now);
       gain.gain.setValueAtTime(0.05, now);
       gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
       osc.start(now);
       osc.stop(now + 0.4);
    } else if (type === 'startup') {
       [220, 329.63, 440, 554.37].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = freq;
          o.connect(g);
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(0.02, now + 0.5 + (i * 0.2));
          g.gain.linearRampToValueAtTime(0, now + 3);
          o.start(now);
          o.stop(now + 4);
       });
       return;
    } else if (type === 'unlock') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    }
  } catch (e) {
    // Ignore audio errors
  }
};

// --- Live Wallpaper Component ---
const LiveWallpaper: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        // Interactive Orbs
        const orbs = Array.from({ length: 12 }).map(() => ({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 200 + 100,
            baseX: Math.random() * width,
            baseY: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            color: [Math.random() * 60 + 180, Math.random() * 50 + 50, Math.random() * 100 + 150] // Richer Blue/Purple/Pink
        }));

        let animationId: number;

        const animate = () => {
            ctx.fillStyle = '#050510'; // Deeper, darker background
            ctx.fillRect(0, 0, width, height);

            orbs.forEach(orb => {
                // Mouse interaction - repel
                const dx = mouseRef.current.x - orb.x;
                const dy = mouseRef.current.y - orb.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDist = 400;
                
                if (distance < maxDist) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (maxDist - distance) / maxDist;
                    const directionX = forceDirectionX * force * 2;
                    const directionY = forceDirectionY * force * 2;
                    orb.x -= directionX;
                    orb.y -= directionY;
                }

                // Drift back to base or move naturally
                orb.x += orb.vx;
                orb.y += orb.vy;

                // Bounce off edges with soft turn
                if (orb.x < -orb.radius) orb.x = width + orb.radius;
                if (orb.x > width + orb.radius) orb.x = -orb.radius;
                if (orb.y < -orb.radius) orb.y = height + orb.radius;
                if (orb.y > height + orb.radius) orb.y = -orb.radius;

                const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
                gradient.addColorStop(0, `rgba(${orb.color[0]}, ${orb.color[1]}, ${orb.color[2]}, 0.3)`);
                gradient.addColorStop(1, `rgba(${orb.color[0]}, ${orb.color[1]}, ${orb.color[2]}, 0)`);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Noise texture
            ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
            for (let i = 0; i < 150; i++) {
                ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
            }

            animationId = requestAnimationFrame(animate);
        };

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        const handleMouseMove = (e: MouseEvent) => {
             mouseRef.current.x = e.clientX;
             mouseRef.current.y = e.clientY;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};

// --- Lock Screen Component ---
const LockScreen: React.FC<{ onUnlock: (appId?: string) => void; wallpaper: string; wallpaperIndex: number }> = ({ onUnlock, wallpaper, wallpaperIndex }) => {
  const [date, setDate] = useState(new Date());
  const [isSliding, setIsSliding] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUnlock = (appId?: string) => {
    setIsSliding(true);
    playSystemSound('unlock');
    setTimeout(() => onUnlock(appId), 400); // Wait for animation
  };

  return (
    <div 
      className={`fixed inset-0 z-[9000] bg-cover bg-center flex flex-col items-center justify-between py-12 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isSliding ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
      style={{ backgroundImage: wallpaperIndex !== 0 ? `url(${wallpaper})` : undefined }}
      onClick={(e) => {
          // Only unlock if clicking background or swipe hint, not buttons
          if(e.target === e.currentTarget || (e.target as HTMLElement).closest('.unlock-target')) {
              handleUnlock();
          }
      }}
    >
      {wallpaperIndex === 0 && <LiveWallpaper />}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-none"></div>
      
      {/* Top Section: Clock & Widgets */}
      <div className="relative z-10 flex flex-col items-center text-white mt-16 w-full max-w-2xl animate-in zoom-in-95 duration-700">
         <div className="flex flex-col items-center drop-shadow-lg mb-8">
            <h1 className="text-9xl font-thin tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
                {date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: false})}
            </h1>
            <h2 className="text-2xl font-medium tracking-wide opacity-90">
                {date.toLocaleDateString([], {weekday: 'long', month: 'long', day: 'numeric'})}
            </h2>
         </div>

         {/* Widgets Grid */}
         <div className="grid grid-cols-2 gap-4 w-full px-8">
            {/* Weather Widget */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 border border-white/10 hover:bg-black/30 transition-colors cursor-default">
               <span className="material-symbols-rounded text-4xl text-yellow-400">partly_cloudy_day</span>
               <div>
                  <div className="text-2xl font-bold">72°</div>
                  <div className="text-sm opacity-80">Sunny • H:75 L:68</div>
               </div>
            </div>

            {/* Calendar Widget */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 border border-white/10 hover:bg-black/30 transition-colors cursor-default">
               <div className="w-1 bg-blue-500 h-full rounded-full"></div>
               <div>
                  <div className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-1">Up Next</div>
                  <div className="text-lg font-semibold leading-tight">Project Review</div>
                  <div className="text-sm opacity-80">10:00 AM - 11:00 AM</div>
               </div>
            </div>
         </div>
      </div>

      {/* Bottom Section: Shortcuts & Handle */}
      <div className="relative z-10 w-full px-12 pb-8 flex items-end justify-between">
         {/* Flashlight Shortcut */}
         <button 
            className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all active:scale-90 ${flashlightOn ? 'bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.6)]' : 'bg-black/40 text-white hover:bg-black/50'}`}
            onClick={(e) => { e.stopPropagation(); setFlashlightOn(!flashlightOn); playSystemSound('click'); }}
         >
            <span className="material-symbols-rounded text-2xl fill-current">{flashlightOn ? 'flashlight_on' : 'flashlight_off'}</span>
         </button>

         {/* Unlock Hint */}
         <div className="flex flex-col items-center gap-2 animate-pulse unlock-target cursor-pointer" onClick={() => handleUnlock()}>
             <span className="material-symbols-rounded text-4xl text-white/80">keyboard_arrow_up</span>
             <span className="text-white/80 font-medium tracking-widest text-xs uppercase">Swipe to Open</span>
         </div>

         {/* Camera Shortcut */}
         <button 
            className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/50 transition-all active:scale-90"
            onClick={(e) => { e.stopPropagation(); handleUnlock('camera'); }}
         >
            <span className="material-symbols-rounded text-2xl">photo_camera</span>
         </button>
      </div>
    </div>
  );
};

// --- Toast Notification Component ---
interface Toast {
  id: number;
  title: string;
  message: string;
  icon?: string;
}
const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: number) => void }> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className="pointer-events-auto w-80 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 dark:border-gray-600 shadow-2xl rounded-2xl p-4 flex gap-4 animate-slide-up-fade"
          onClick={() => onRemove(toast.id)}
        >
           <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-blue-500">
              <span className="material-symbols-rounded">{toast.icon || 'notifications'}</span>
           </div>
           <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{toast.title}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-tight">{toast.message}</p>
           </div>
        </div>
      ))}
    </div>
  );
};

// --- Loading Screen Component ---
const LoadingScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing Kernel...");
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const totalDuration = 3500; // ms
    const intervalTime = 50;
    const steps = totalDuration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min((currentStep / steps) * 100, 100);
      setProgress(newProgress);

      if (newProgress > 15 && newProgress < 30) setStatusText("Loading System Drivers...");
      else if (newProgress > 30 && newProgress < 50) setStatusText("Mounting File Systems...");
      else if (newProgress > 50 && newProgress < 70) setStatusText("Starting User Interface...");
      else if (newProgress > 70 && newProgress < 90) setStatusText("Restoring Workspace...");
      else if (newProgress > 90) setStatusText("Welcome");

      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(() => {
           setOpacity(0);
           playSystemSound('startup');
           setTimeout(onComplete, 800);
        }, 200);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center font-sans text-white transition-opacity duration-1000 ease-out pointer-events-none"
      style={{ opacity }}
    >
      <div className="relative flex flex-col items-center gap-8">
        <div className="relative">
           <div className="absolute inset-0 bg-blue-500 blur-[80px] opacity-20 rounded-full animate-pulse"></div>
           <div className="flex items-center gap-4 relative z-10">
              <span className="material-symbols-rounded text-6xl text-transparent bg-clip-text bg-gradient-to-tr from-blue-400 to-purple-500 animate-in zoom-in-95 duration-1000">
                grid_view
              </span>
              <h1 className="text-5xl font-extralight tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">
                Real<span className="font-bold ml-2">OS</span>
              </h1>
           </div>
        </div>
        <div className="w-64 flex flex-col gap-3">
           <div className="w-full h-[2px] bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 transition-all duration-75 ease-linear rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
           </div>
           <div className="flex justify-between items-center text-xs text-gray-500 font-mono h-4">
              <span>{statusText}</span>
              <span>{Math.round(progress)}%</span>
           </div>
        </div>
      </div>
      <div className="absolute bottom-8 text-[10px] text-gray-600 tracking-widest uppercase">
         Powered by Google GenAI
      </div>
    </div>
  );
};

// --- Desktop Widget ---
const DesktopWidget = () => {
  const [date, setDate] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-0 animate-slide-up-fade pointer-events-none select-none w-full" style={{ animationDelay: '0.2s' }}>
       <div className="group relative flex flex-col items-center justify-center p-20 rounded-[5rem] transition-all duration-700 hover:scale-105 pointer-events-auto">
          <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-1000"></div>
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[50px] rounded-[5rem] border border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] group-hover:bg-white/10 transition-colors duration-500"></div>
          <div className="relative z-10 flex flex-col items-center">
            <h1 className="text-[13rem] leading-none font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 drop-shadow-2xl filter font-sans">
              {date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: false})}
            </h1>
            <div className="mt-8 flex items-center gap-6 bg-white/10 backdrop-blur-xl px-12 py-3 rounded-full border border-white/20 shadow-lg">
               <span className="text-3xl font-bold tracking-[0.1em] text-white/90 uppercase drop-shadow-lg font-sans">
                 {date.toLocaleDateString([], {weekday: 'long'})}
               </span>
               <div className="w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_10px_#60a5fa]"></div>
               <span className="text-3xl font-light tracking-[0.05em] text-white/80 drop-shadow-lg font-sans">
                 {date.toLocaleDateString([], {month: 'long', day: 'numeric'})}
               </span>
            </div>
          </div>
       </div>
    </div>
  );
};

// --- Widgets Panel Component ---
const WidgetsPanel: React.FC<{ isOpen: boolean; onClose: () => void; theme: 'light' | 'dark' }> = ({ isOpen, onClose, theme }) => {
    const [stocks, setStocks] = useState([
        { symbol: 'AAPL', price: 180.50, change: 1.2 },
        { symbol: 'GOOGL', price: 140.20, change: -0.5 },
        { symbol: 'MSFT', price: 410.00, change: 0.8 },
        { symbol: 'TSLA', price: 175.30, change: -2.1 },
    ]);

    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(() => {
            setStocks(prev => prev.map(s => ({
                ...s,
                price: s.price + (Math.random() - 0.5) * 2,
                change: s.change + (Math.random() - 0.5) * 0.1
            })));
        }, 2000);
        return () => clearInterval(interval);
    }, [isOpen]);

    if (!isOpen) return null;

    const bgClass = theme === 'dark' ? 'bg-black/60 text-white' : 'bg-white/60 text-gray-900';
    const cardBg = theme === 'dark' ? 'bg-[#1c1c1c]/80 border-white/10' : 'bg-white/60 border-white/40';

    return (
        <div 
            className={`absolute top-0 left-0 h-full w-[500px] backdrop-blur-[50px] shadow-2xl animate-in slide-in-from-bottom-8 origin-left z-[85] p-8 overflow-y-auto custom-scrollbar ${bgClass}`}
            style={{ animationName: 'slideInFromLeft' }}
            onClick={(e) => e.stopPropagation()}
        >
             <style>{`
                @keyframes slideInFromLeft {
                    from { opacity: 0; transform: translateX(-50px); }
                    to { opacity: 1; transform: translateX(0); }
                }
             `}</style>
             
             <div className="flex items-center justify-between mb-8">
                 <h2 className="text-3xl font-bold tracking-tight">Widgets</h2>
                 <div className="text-sm font-medium opacity-60">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 {/* Weather Widget (Large) */}
                 <div className={`col-span-2 p-6 rounded-3xl border shadow-lg ${cardBg} hover:scale-[1.02] transition-transform duration-300`}>
                     <div className="flex justify-between items-start">
                         <div>
                             <div className="text-sm font-semibold opacity-70 uppercase tracking-wider mb-1">San Francisco</div>
                             <div className="text-5xl font-light">72°</div>
                             <div className="text-sm font-medium mt-1">Mostly Sunny</div>
                         </div>
                         <span className="material-symbols-rounded text-6xl text-yellow-500 drop-shadow-lg">sunny</span>
                     </div>
                     <div className="mt-6 flex justify-between text-center">
                         {[1,2,3,4,5].map(i => (
                             <div key={i} className="flex flex-col gap-1">
                                 <span className="text-xs opacity-60">{(new Date().getHours() + i) % 24}:00</span>
                                 <span className="material-symbols-rounded text-xl opacity-80">cloud</span>
                                 <span className="text-xs font-bold">7{i}°</span>
                             </div>
                         ))}
                     </div>
                 </div>

                 {/* Stocks Widget */}
                 <div className={`col-span-2 p-6 rounded-3xl border shadow-lg ${cardBg} hover:scale-[1.02] transition-transform duration-300`}>
                     <div className="flex items-center justify-between mb-4">
                         <h3 className="font-bold text-sm opacity-70 uppercase tracking-wider">Market</h3>
                         <span className="material-symbols-rounded text-gray-400">show_chart</span>
                     </div>
                     <div className="space-y-3">
                         {stocks.map(stock => (
                             <div key={stock.symbol} className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                     <div className={`w-2 h-8 rounded-full ${stock.change >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                     <div>
                                         <div className="font-bold text-sm">{stock.symbol}</div>
                                         <div className="text-xs opacity-60">Eq</div>
                                     </div>
                                 </div>
                                 <div className="text-right">
                                     <div className="font-mono font-medium">{stock.price.toFixed(2)}</div>
                                     <div className={`text-xs ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                         {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}%
                                     </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>

                 {/* Photos Widget */}
                 <div className={`col-span-1 p-0 rounded-3xl border shadow-lg overflow-hidden relative group aspect-square ${cardBg}`}>
                     <img src="https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=500" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                         <span className="text-white text-xs font-bold uppercase tracking-wider mb-1">On this day</span>
                         <span className="text-white font-medium text-sm">Alpine Trip 2023</span>
                     </div>
                 </div>

                 {/* News Widget */}
                 <div className={`col-span-1 p-5 rounded-3xl border shadow-lg flex flex-col justify-between ${cardBg}`}>
                      <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
                          <span className="material-symbols-rounded">newspaper</span>
                      </div>
                      <div>
                          <span className="text-xs font-bold opacity-60 uppercase mb-1 block">Top Story</span>
                          <p className="text-sm font-semibold leading-tight line-clamp-3">
                              Gemini 2.5 Revolutionizes AI Operating Systems with Real-time Native Integration.
                          </p>
                      </div>
                 </div>
             </div>
        </div>
    );
};

// --- Quick Settings Panel ---
const QuickSettingsPanel: React.FC<{ isOpen: boolean; onClose: () => void; theme: 'light' | 'dark' }> = ({ isOpen, onClose, theme }) => {
  if (!isOpen) return null;

  const bgClass = theme === 'dark' ? 'bg-[#1c1c1c]/90 text-white border-gray-700' : 'bg-white/90 text-gray-900 border-white/40';
  const toggleClass = (active: boolean) => 
    `w-full h-24 rounded-xl flex flex-col items-start justify-between p-4 transition-all duration-200 cursor-pointer border ${active 
      ? 'bg-blue-600 text-white border-transparent shadow-lg shadow-blue-500/30' 
      : (theme === 'dark' ? 'bg-[#2d2d2d] hover:bg-[#3d3d3d] border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-200')}`;

  const sliderClass = "w-full h-1 bg-gray-400/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-600";

  return (
    <div 
      className={`absolute bottom-20 right-4 w-96 p-6 rounded-3xl shadow-2xl backdrop-blur-3xl border animate-in slide-in-from-bottom-8 z-[95] ${bgClass}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={toggleClass(true)} onClick={() => playSystemSound('click')}>
          <span className="material-symbols-rounded text-2xl">wifi</span>
          <span className="font-semibold text-sm">Wi-Fi</span>
        </div>
        <div className={toggleClass(true)} onClick={() => playSystemSound('click')}>
          <span className="material-symbols-rounded text-2xl">bluetooth</span>
          <span className="font-semibold text-sm">Bluetooth</span>
        </div>
        <div className={toggleClass(false)} onClick={() => playSystemSound('click')}>
           <span className="material-symbols-rounded text-2xl">airplane_mode_inactive</span>
           <span className="font-semibold text-sm">Airplane Mode</span>
        </div>
        <div className={toggleClass(false)} onClick={() => playSystemSound('click')}>
           <span className="material-symbols-rounded text-2xl">dark_mode</span>
           <span className="font-semibold text-sm">Battery Saver</span>
        </div>
      </div>

      <div className="space-y-6">
         <div className="flex items-center gap-4">
            <span className="material-symbols-rounded text-gray-500">brightness_5</span>
            <input type="range" className={sliderClass} defaultValue={80} onChange={() => playSystemSound('click')} />
         </div>
         <div className="flex items-center gap-4">
            <span className="material-symbols-rounded text-gray-500">volume_up</span>
            <input type="range" className={sliderClass} defaultValue={60} onChange={() => playSystemSound('click')} />
         </div>
      </div>
    </div>
  );
};

// --- Notification Center ---
const NotificationCenter: React.FC<{ isOpen: boolean; onClose: () => void; theme: 'light' | 'dark' }> = ({ isOpen, onClose, theme }) => {
  if (!isOpen) return null;
  const bgClass = theme === 'dark' ? 'bg-[#1c1c1c]/95 text-white border-l border-gray-700' : 'bg-white/95 text-gray-900 border-l border-white/40';

  return (
    <div 
      className={`absolute top-0 right-0 h-full w-96 backdrop-blur-3xl shadow-2xl animate-in z-[95] flex flex-col p-6 transition-transform duration-300 ${bgClass}`}
      onClick={(e) => e.stopPropagation()}
    >
       <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">{new Date().toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'})}</h2>
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
             {['S','M','T','W','T','F','S'].map(d => <span key={d} className="opacity-50 font-bold text-xs">{d}</span>)}
             {Array.from({length: 30}).map((_, i) => (
               <div key={i} className={`w-8 h-8 flex items-center justify-center rounded-full ${i === 27 ? 'bg-blue-600 text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}>
                 {i + 1}
               </div>
             ))}
          </div>
       </div>

       <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-sm">Notifications</span>
          <button className="text-xs text-blue-500 font-medium hover:underline" onClick={() => playSystemSound('click')}>Clear all</button>
       </div>

       <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar">
          {[1,2,3].map(i => (
            <div key={i} className={`p-4 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-[#2d2d2d] border-gray-700' : 'bg-white border-gray-100'}`}>
               <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i === 1 ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                     <span className="material-symbols-rounded text-sm">{i === 1 ? 'mail' : 'chat'}</span>
                  </div>
                  <div>
                     <h3 className="text-sm font-bold">New Message</h3>
                     <p className="text-xs opacity-70 mt-1">Hey, are we still on for the meeting tomorrow?</p>
                  </div>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
};

// --- Context Menu ---
interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onChangeWallpaper: () => void;
  onNewFolder: () => void;
  targetId?: string;
  item?: FileSystemItem;
  onOpen?: (item: FileSystemItem) => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string) => void;
  onUninstall?: (id: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, onChangeWallpaper, onNewFolder, targetId, item, onOpen, onDelete, onRename, onUninstall, theme, onToggleTheme }) => {
  const isApp = targetId && APP_DEFINITIONS_CONFIG.some(app => app.id === targetId);
  const isSystemApp = isApp && targetId && SYSTEM_APPS.includes(targetId);

  const bgClass = theme === 'dark' ? 'bg-gray-800/90 border-gray-600 text-gray-200' : 'bg-white/80 border-white/40 text-gray-800';
  const hoverClass = theme === 'dark' ? 'hover:bg-blue-600 hover:text-white' : 'hover:bg-blue-600 hover:text-white';
  const dividerClass = theme === 'dark' ? 'bg-gray-600/50' : 'bg-gray-400/20';
  
  const handleClick = (action: () => void) => {
      playSystemSound('click');
      action();
      onClose();
  };

  return (
  <div 
    className={`absolute z-[100] w-64 backdrop-blur-xl border rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] py-1.5 animate-pop origin-top-left ${bgClass}`}
    style={{ top: y, left: x }}
  >
    <div className="px-1 space-y-0.5">
      {targetId ? (
         <>
          {item && (
             <>
               <button onClick={() => handleClick(() => { if(onOpen) onOpen(item); })} className={`w-full text-left px-3 py-2 text-[13px] font-bold rounded-md transition-colors flex items-center gap-3 ${hoverClass}`}>
                  <span className="material-symbols-rounded text-[18px]">open_in_new</span>
                  Open
               </button>
               {item.type === 'file' && (item.mimeType?.startsWith('text/') || item.name.endsWith('.txt') || item.name.endsWith('.md')) && (
                     <button onClick={() => handleClick(() => { if(onOpen) onOpen(item); })} className={`w-full text-left px-3 py-2 text-[13px] font-medium rounded-md transition-colors flex items-center gap-3 ${hoverClass}`}>
                     <span className="material-symbols-rounded text-[18px]">edit_note</span>
                     Open with Notepad
                   </button>
                )}
                 {item.type === 'file' && (item.mimeType?.startsWith('audio/') || item.mimeType?.startsWith('video/') || item.name.endsWith('.mp3') || item.name.endsWith('.mp4')) && (
                     <button onClick={() => handleClick(() => { if(onOpen) onOpen(item); })} className={`w-full text-left px-3 py-2 text-[13px] font-medium rounded-md transition-colors flex items-center gap-3 ${hoverClass}`}>
                     <span className="material-symbols-rounded text-[18px]">play_circle</span>
                     Open with Media Player
                   </button>
                )}
                {/* Spacebar Quick Look hint */}
                <div className="px-3 py-1 text-[10px] opacity-50 text-right">Press Space to Preview</div>
               <div className={`h-[1px] my-1 mx-2 ${dividerClass}`}></div>
             </>
          )}

          <button onClick={() => handleClick(() => onRename?.(targetId))} className={`w-full text-left px-3 py-2 text-[13px] font-medium rounded-md transition-colors flex items-center gap-3 ${hoverClass}`}>
            <span className="material-symbols-rounded text-[18px]">edit</span>
            Rename
          </button>
          
          {item && (
               <button onClick={() => handleClick(() => { alert(`Properties:\nName: ${item.name}\nType: ${item.type}\nID: ${item.id}`); })} className={`w-full text-left px-3 py-2 text-[13px] font-medium rounded-md transition-colors flex items-center gap-3 ${hoverClass}`}>
                  <span className="material-symbols-rounded text-[18px]">info</span>
                  Properties
               </button>
          )}

          {isApp && !isSystemApp && (
            <button onClick={() => handleClick(() => onUninstall?.(targetId))} className="w-full text-left px-3 py-2 text-[13px] font-medium text-red-500 hover:bg-red-600 hover:text-white rounded-md transition-colors flex items-center gap-3">
              <span className="material-symbols-rounded text-[18px]">remove_circle</span>
              Uninstall
            </button>
          )}

          {!isApp && (
             <button onClick={() => handleClick(() => onDelete?.(targetId))} className="w-full text-left px-3 py-2 text-[13px] font-medium text-red-500 hover:bg-red-600 hover:text-white rounded-md transition-colors flex items-center gap-3">
               <span className="material-symbols-rounded text-[18px]">delete</span>
               Delete
             </button>
          )}
          <div className={`h-[1px] my-1 mx-2 ${dividerClass}`}></div>
         </>
      ) : (
        <>
          <button onClick={() => handleClick(onNewFolder)} className={`w-full text-left px-3 py-2 text-[13px] font-medium rounded-md transition-colors flex items-center gap-3 ${hoverClass}`}>
            <span className="material-symbols-rounded text-[18px]">create_new_folder</span>
            New Folder
          </button>
          <div className={`h-[1px] my-1 mx-2 ${dividerClass}`}></div>
          <button onClick={() => handleClick(onChangeWallpaper)} className={`w-full text-left px-3 py-2 text-[13px] font-medium rounded-md transition-colors flex items-center gap-3 ${hoverClass}`}>
            <span className="material-symbols-rounded text-[18px]">wallpaper</span>
            Next Background
          </button>
          <button onClick={() => handleClick(onToggleTheme)} className={`w-full text-left px-3 py-2 text-[13px] font-medium rounded-md transition-colors flex items-center gap-3 ${hoverClass}`}>
             <span className="material-symbols-rounded text-[18px]">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
             Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
          <button onClick={() => handleClick(() => {})} className={`w-full text-left px-3 py-2 text-[13px] font-medium rounded-md transition-colors flex items-center gap-3 ${hoverClass}`}>
            <span className="material-symbols-rounded text-[18px]">refresh</span>
            Refresh
          </button>
           <div className={`h-[1px] my-1 mx-2 ${dividerClass}`}></div>
        </>
      )}
     
      <button onClick={() => handleClick(() => {})} className={`w-full text-left px-3 py-2 text-[13px] font-medium rounded-md transition-colors flex items-center gap-3 ${hoverClass}`}>
        <span className="material-symbols-rounded text-[18px]">display_settings</span>
        Display Settings
      </button>
    </div>
  </div>
  );
};

// --- Start Menu Component (App Drawer) ---
const StartMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAppOpen: (app: AppDefinition) => void;
  onFileOpen: (item: FileSystemItem) => void;
  theme: 'light' | 'dark';
  installedApps: string[];
  fileSystem: FileSystemItem[];
}> = ({ isOpen, onClose, onAppOpen, onFileOpen, theme, installedApps, fileSystem }) => {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  if (!isOpen) return null;

  const bgClass = theme === 'dark' ? 'bg-black/60 text-white' : 'bg-white/60 text-gray-900';
  const searchBg = theme === 'dark' ? 'bg-[#2d2d2d] text-white placeholder-gray-400 border-gray-600' : 'bg-white/80 text-gray-800 placeholder-gray-500 border-white/50 shadow-sm';
  const hoverClass = theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5';

  const sortedApps = APP_DEFINITIONS_CONFIG
    .filter(app => installedApps.includes(app.id))
    .sort((a, b) => a.name.localeCompare(b.name));
    
  const isSearching = searchQuery.trim().length > 0;
  const normalizedQuery = searchQuery.toLowerCase();

  const searchApps = isSearching 
      ? sortedApps.filter(app => app.name.toLowerCase().includes(normalizedQuery))
      : sortedApps;
  
  const searchFiles = isSearching
      ? fileSystem.filter(file => file.name.toLowerCase().includes(normalizedQuery) && file.id !== 'recycle_bin')
      : [];

  const handleAppClick = (app: AppDefinition) => {
      playSystemSound('open');
      onAppOpen(app);
      onClose();
  };

  return (
    <div 
      className={`fixed inset-0 z-[80] flex flex-col pt-16 px-6 sm:px-12 pb-20 backdrop-blur-[50px] animate-in slide-in-from-bottom-8 duration-300 origin-bottom select-none ${bgClass}`}
      onClick={(e) => {
         if (e.target === e.currentTarget) {
             playSystemSound('click');
             onClose();
         }
      }}
    >
       <div className="w-full max-w-3xl mx-auto mb-10 relative z-50">
          <div className="relative group transform transition-transform focus-within:scale-105">
              <span className="material-symbols-rounded absolute left-4 top-3.5 text-gray-500 text-[24px]">search</span>
              <input 
                type="text" 
                placeholder="Search apps, files, and web..." 
                className={`w-full py-3.5 pl-14 pr-4 rounded-2xl border outline-none transition-all shadow-xl ${searchBg} text-lg font-medium`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery ? (
                  <span 
                    className="material-symbols-rounded absolute right-4 top-3.5 text-gray-500 text-[24px] cursor-pointer hover:text-gray-700"
                    onClick={() => setSearchQuery('')}
                  >
                    close
                  </span>
              ) : (
                 <span className="material-symbols-rounded absolute right-4 top-3.5 text-gray-500 text-[24px] cursor-pointer hover:text-gray-700">mic</span>
              )}
           </div>
       </div>

       <div className="flex-1 overflow-y-auto custom-scrollbar w-full max-w-7xl mx-auto">
          {isSearching && searchFiles.length > 0 && (
              <div className="mb-8 animate-slide-up-fade">
                  <h3 className="text-sm font-bold opacity-60 mb-4 uppercase tracking-widest px-2">Files</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {searchFiles.map(file => (
                           <div key={file.id} 
                              className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all ${hoverClass} bg-white/5 border border-white/10`}
                              onClick={() => { playSystemSound('open'); onFileOpen(file); onClose(); }}
                          >
                              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-500/20 text-blue-500">
                                 <span className="material-symbols-rounded text-3xl">
                                     {file.type === 'folder' ? 'folder' : 'description'}
                                 </span>
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                  <span className="text-base font-medium truncate">{file.name}</span>
                                  <span className="text-xs opacity-50">File System</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          <div className="animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
              {isSearching && <h3 className="text-sm font-bold opacity-60 mb-4 uppercase tracking-widest px-2">Apps</h3>}
              
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-y-12 gap-x-6 pb-20 justify-items-center">
                  {searchApps.map((app, index) => (
                    <div 
                      key={app.id} 
                      className="flex flex-col items-center gap-3 cursor-pointer group"
                      onClick={() => handleAppClick(app)}
                    >
                        <div className="transform transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                          <Icon app={app} onInteract={() => {}} variant="desktop" /> 
                        </div>
                    </div>
                  ))}
                  {searchApps.length === 0 && (
                      <div className="col-span-full text-center opacity-50 py-20 text-xl">
                          No apps found.
                      </div>
                  )}
              </div>
          </div>
       </div>
    </div>
  );
};


// --- Taskbar Component ---
const Taskbar: React.FC<{
  onAppOpen: (app: AppDefinition) => void;
  onToggleStart: () => void;
  activeAppId: string | null;
  installedApps: string[];
  onContextMenu: (e: React.MouseEvent, appId: string) => void;
  isStartOpen: boolean;
  theme: 'light' | 'dark';
  onToggleNotifications: () => void;
  onToggleQuickSettings: () => void;
  onToggleMeri: () => void;
  isMeriActive: boolean;
  batteryLevel: number;
  onToggleWidgets: () => void;
  isWidgetsOpen: boolean;
  onShowDesktop: () => void;
}> = ({onAppOpen, onToggleStart, activeAppId, installedApps, onContextMenu, isStartOpen, theme, onToggleNotifications, onToggleQuickSettings, onToggleMeri, isMeriActive, batteryLevel, onToggleWidgets, isWidgetsOpen, onShowDesktop}) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pinnedIds = [
    'web_browser_app', 
    'file_manager', 
    'mail', 
    'messages', 
    'app_store', 
    'shopping_app', 
    'gaming_app', 
    'terminal'
  ];
  
  let displayedApps = APP_DEFINITIONS_CONFIG.filter((app) => pinnedIds.includes(app.id) && installedApps.includes(app.id));
  
  if (activeAppId && !pinnedIds.includes(activeAppId)) {
      const activeAppDef = APP_DEFINITIONS_CONFIG.find(app => app.id === activeAppId);
      if (activeAppDef) {
          displayedApps = [...displayedApps, activeAppDef];
      }
  }

  const barBg = theme === 'dark' ? 'bg-[#1c1c1c]/70 border-white/10 shadow-black/50' : 'bg-white/60 border-white/40 shadow-[0_10px_30px_rgba(0,0,0,0.1)]';
  const itemHover = theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-white/50';
  const textColor = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
  const subTextColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

  const handleAppClick = (app: AppDefinition) => {
      if (activeAppId !== app.id) playSystemSound('open');
      onAppOpen(app);
  };
  
  const handleToggle = (action: () => void) => {
      playSystemSound('click');
      action();
  };

  const getBatteryIcon = (level: number) => {
      if (level > 90) return 'battery_full';
      if (level > 60) return 'battery_5_bar';
      if (level > 40) return 'battery_3_bar';
      if (level > 10) return 'battery_1_bar';
      return 'battery_alert';
  };

  return (
    <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[96%] h-16 z-[90] backdrop-blur-[40px] border rounded-2xl flex items-center justify-between px-3 transition-colors duration-300 ${barBg}`}>
      <div className={`flex items-center gap-3 ${itemHover} px-3 py-1.5 rounded-xl transition-colors cursor-pointer w-40 hidden sm:flex`}>
         <div className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100/20 shadow-sm">
            <span className="material-symbols-rounded text-yellow-500 text-2xl">partly_cloudy_day</span>
         </div>
         <div className="flex flex-col leading-tight">
           <span className={`text-sm font-bold ${textColor}`}>72°F</span>
           <span className={`text-xs ${subTextColor} font-medium`}>Sunny</span>
         </div>
      </div>
      
      <div className="flex items-center gap-2 h-full">
        {/* Widgets Toggle */}
        <div 
          onClick={(e) => { e.stopPropagation(); handleToggle(onToggleWidgets); }}
          className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors cursor-pointer group active:scale-95 duration-150 ${isWidgetsOpen ? (theme === 'dark' ? 'bg-white/10' : 'bg-white/60') : itemHover}`}
          title="Widgets"
        >
           <span className={`material-symbols-rounded text-[28px] transition-colors ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>view_kanban</span>
        </div>

        <div 
          onClick={(e) => { e.stopPropagation(); handleToggle(onToggleStart); }}
          className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors cursor-pointer group active:scale-95 duration-150 ${isStartOpen ? (theme === 'dark' ? 'bg-white/10' : 'bg-white/60') : itemHover}`}
          title="Start"
        >
           <span className={`material-symbols-rounded text-[32px] transition-colors ${theme === 'dark' ? 'text-blue-400' : 'text-[#0078D4]'}`}>grid_view</span>
        </div>
        
        <div 
          onClick={(e) => { e.stopPropagation(); handleToggle(onToggleMeri); }}
          className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors cursor-pointer group active:scale-95 duration-150 relative ${isMeriActive ? 'bg-blue-500/20' : itemHover}`}
          title="Talk to Meri"
        >
           <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-pulse"></div>
        </div>

        <div className={`w-[1px] h-8 mx-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-400/30'}`}></div>
        
        {displayedApps.map((app) => (
          <div 
            key={app.id} 
            className={`w-12 h-12 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200 relative group ${activeAppId === app.id ? (theme === 'dark' ? 'bg-white/10 shadow-inner' : 'bg-white/50 shadow-sm') : `${itemHover} active:scale-90`}`}
            onClick={() => handleAppClick(app)}
            onContextMenu={(e) => onContextMenu(e, app.id)}
            title={app.name}
          >
            <Icon app={app} onInteract={() => handleAppClick(app)} variant="dock" />
            {activeAppId === app.id && <div className="absolute bottom-1 w-1.5 h-1.5 bg-blue-500 rounded-full transition-all shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>}
            {activeAppId !== app.id && pinnedIds.includes(app.id) && <div className={`absolute bottom-1.5 w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${theme === 'dark' ? 'bg-gray-400' : 'bg-gray-500'}`}></div>}
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-1 w-40 justify-end">
         <div className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors cursor-pointer hidden sm:flex ${itemHover}`}>
            <span className={`material-symbols-rounded text-[22px] ${textColor}`}>expand_less</span>
         </div>
         <div 
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors cursor-pointer ${itemHover}`}
            onClick={(e) => { e.stopPropagation(); handleToggle(onToggleQuickSettings); }}
         >
            <span className={`material-symbols-rounded text-[20px] ${textColor}`}>wifi</span>
            <span className={`material-symbols-rounded text-[20px] ${textColor}`}>volume_up</span>
            <div className="flex items-center gap-1">
               <span className={`material-symbols-rounded text-[20px] ${textColor}`}>{getBatteryIcon(batteryLevel)}</span>
               <span className={`text-[10px] font-bold ${subTextColor}`}>{Math.round(batteryLevel)}%</span>
            </div>
         </div>
         <div 
            className={`flex flex-col items-end px-3 py-1.5 rounded-xl transition-colors cursor-pointer leading-tight ${itemHover}`}
            onClick={(e) => { e.stopPropagation(); handleToggle(onToggleNotifications); }}
         >
            <span className={`text-sm font-bold ${textColor}`}>{time.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
            <span className={`text-xs ${subTextColor} font-medium`}>{time.toLocaleDateString([], {month: 'numeric', day: 'numeric', year: 'numeric'})}</span>
         </div>
         <div 
            className="w-2 h-full ml-2 border-l border-white/20 hover:bg-white/10 cursor-pointer" 
            title="Show Desktop"
            onClick={onShowDesktop}
         ></div>
      </div>
    </div>
  );
};

// --- Desktop Item Component ---
const DesktopItem: React.FC<{
    item: FileSystemItem;
    onInteract: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onDrop: (sourceId: string, targetId: string) => void;
    onRenameSave: (id: string, newName: string) => void;
    index: number;
    isSelected: boolean;
}> = ({ item, onInteract, onContextMenu, onDrop, onRenameSave, index, isSelected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(item.name);
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setIsEditing(false);
            onRenameSave(item.id, editName);
        }
    };
    
    const handleDragStart = (e: React.DragEvent) => {
        const dragData = JSON.stringify({
          id: item.id,
          offsetX: e.nativeEvent.offsetX,
          offsetY: e.nativeEvent.offsetY
        });
        e.dataTransfer.setData('text/plain', dragData);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('opacity-50');
    };

    const handleDragEnd = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('opacity-50');
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (item.type === 'folder') {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
            if (!isDragOver) setIsDragOver(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (item.type === 'folder') {
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            setIsDragOver(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        if (item.type === 'folder') {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            
            try {
              const data = JSON.parse(e.dataTransfer.getData('text/plain'));
              const sourceId = data.id;
              if (sourceId && sourceId !== item.id) {
                  onDrop(sourceId, item.id);
                  playSystemSound('notification');
              }
            } catch (err) {
              console.error("Invalid drag data", err);
            }
        }
    };
    
    const getIconForFile = (mimeType?: string, name?: string) => {
        const ext = name?.split('.').pop()?.toLowerCase();
        
        // Images
        if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico', 'svg', 'tiff'].includes(ext || '')) 
            return { icon: 'image', color: 'text-purple-500' };

        // Videos
        if (mimeType?.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv'].includes(ext || '')) 
            return { icon: 'movie', color: 'text-red-500' };

        // Audio
        if (mimeType?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'].includes(ext || '')) 
            return { icon: 'audio_file', color: 'text-pink-500' };
        
        // Documents
        if (mimeType === 'application/pdf' || ext === 'pdf') 
            return { icon: 'picture_as_pdf', color: 'text-red-600' };
        
        if (['doc', 'docx'].includes(ext || ''))
            return { icon: 'description', color: 'text-blue-600' };
            
        if (['xls', 'xlsx', 'csv'].includes(ext || ''))
            return { icon: 'table_chart', color: 'text-green-600' };
            
        if (['ppt', 'pptx'].includes(ext || ''))
            return { icon: 'slideshow', color: 'text-orange-500' };

        // Archives
        if (mimeType?.includes('zip') || mimeType?.includes('compressed') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) 
            return { icon: 'folder_zip', color: 'text-yellow-500' };
            
        // Code
        if (['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'json', 'py', 'java', 'c', 'cpp', 'php', 'rb', 'go', 'rs'].includes(ext || ''))
             return { icon: 'code', color: 'text-emerald-500' };

        // Text
        if (mimeType?.startsWith('text/') || ext === 'txt' || ext === 'md' || ext === 'rtf' || ext === 'log')
             return { icon: 'article', color: 'text-gray-500' };

        // Executables
        if (ext === 'exe' || ext === 'msi' || ext === 'bat' || ext === 'sh')
             return { icon: 'terminal', color: 'text-slate-700' };

        // Fallback
        return { icon: 'draft', color: 'text-gray-400' };
    };

    const fileIconData = getIconForFile(item.mimeType, item.name);

    return (
        <div
            className={`group flex flex-col items-center cursor-pointer select-none transition-all duration-300 gap-3 w-28 min-h-[7.5rem] p-2 opacity-0 animate-slide-up-fade ${item.position ? 'absolute' : 'relative'} ${isSelected ? 'bg-blue-500/20 backdrop-blur-md rounded-2xl border border-blue-400/30' : 'hover:bg-white/5 hover:backdrop-blur-sm hover:rounded-2xl'}`}
            style={{ 
              left: item.position?.x, 
              top: item.position?.y,
              zIndex: isDragOver ? 20 : 1,
              animationDelay: `${index * 50}ms`
            }}
            onClick={(e) => { e.stopPropagation(); onInteract(); }}
            onContextMenu={onContextMenu}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div 
                className={`relative flex items-center justify-center shadow-2xl transition-all duration-300 z-10 w-[5rem] h-[5rem] hover:scale-[1.05] active:scale-95 ${
                    isDragOver 
                        ? 'ring-4 ring-blue-400/80 scale-110 shadow-[0_0_25px_rgba(96,165,250,0.6)] bg-blue-50' 
                        : ''
                } ${
                    item.type === 'folder' && !isDragOver 
                        ? 'group-hover:shadow-[0_0_25px_rgba(255,204,0,0.4)]' 
                        : ''
                }`}
                style={{
                    background: item.type === 'folder' ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : '#ffffff',
                    borderRadius: '18px', 
                    boxShadow: isDragOver ? undefined : `0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -2px rgba(0,0,0,0.1)`
                }}
            >
                {item.type === 'file' && item.mimeType?.startsWith('image/') && item.content ? (
                   <img src={item.content} alt={item.name} className="w-full h-full object-cover rounded-[18px]" />
                ) : (
                   <span className={`material-symbols-rounded filter drop-shadow-md text-[3rem] transition-transform ${item.type === 'folder' ? 'text-white' : fileIconData.color}`}>
                      {item.type === 'folder' ? 'folder' : fileIconData.icon}
                   </span>
                )}
            </div>
            
            <div className="flex flex-col items-center opacity-90 group-hover:opacity-100 transition-opacity w-full">
               <span className={`text-[12px] font-medium text-white tracking-wide shadow-sm px-2 py-0.5 rounded-lg text-center line-clamp-2 leading-tight ${isSelected ? 'bg-blue-500' : 'bg-black/40 backdrop-blur-md'}`}>
                  {item.name}
               </span>
            </div>
        </div>
    );
};

const MAX_WORKSPACES = 3;

const App: React.FC = () => {
  // --- Workspace State ---
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<number>(0);
  const [workspaces, setWorkspaces] = useState<WorkspaceState[]>(
    Array.from({length: MAX_WORKSPACES}, (_, i) => ({
      id: i,
      activeApp: null,
      llmContent: '',
      interactionHistory: [],
      currentAppPath: [],
      isLoading: false,
      error: null,
    }))
  );

  // --- OS State ---
  const [hasLaunched, setHasLaunched] = useState(false); // New state for Landing Page
  const [isLoadingOS, setIsLoadingOS] = useState(true);
  const [isLocked, setIsLocked] = useState(false); // Locked state
  const [isParametersOpen, setIsParametersOpen] = useState<boolean>(false);
  const [currentMaxHistoryLength, setCurrentMaxHistoryLength] = useState<number>(INITIAL_MAX_HISTORY_LENGTH);
  const [isStatefulnessEnabled, setIsStatefulnessEnabled] = useState<boolean>(false);
  const [appContentCache, setAppContentCache] = useState<Record<string, string>>({});
  const [wallpaperIndex, setWallpaperIndex] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; targetId?: string } | null>(null);
  const [installedApps, setInstalledApps] = useState<string[]>(DEFAULT_INSTALLED_APPS);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isWidgetsOpen, setIsWidgetsOpen] = useState(false);
  const [isMeriActive, setIsMeriActive] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // --- File System State ---
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>([
    { id: 'recycle_bin', name: 'Trash', type: 'folder', parentId: null, dateModified: Date.now(), position: {x: 30, y: 30} },
  ]);
  const [mediaFileToPlay, setMediaFileToPlay] = useState<FileSystemItem | null>(null);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.key === 'Meta') { // Windows/Command Key
         e.preventDefault();
         setIsStartMenuOpen(prev => !prev);
         playSystemSound('click');
      }
      
      if (e.code === 'Space' && selectedItemId) {
          e.preventDefault();
          const item = fileSystem.find(i => i.id === selectedItemId);
          if (item && item.type === 'file') {
              handleFileSystemItemClick(item); // Preview
          }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, fileSystem]);

  // --- Battery Simulation ---
  useEffect(() => {
    const timer = setInterval(() => {
      setBatteryLevel(prev => {
         const next = prev - 0.1; // Drain slowly
         if (next < 20 && Math.floor(next) === 19) {
            addToast("Battery Low", "Connect your charger.", "battery_alert");
         }
         return next > 0 ? next : 0;
      });
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, []);

  // Helper to add toast
  const addToast = (title: string, message: string, icon?: string) => {
     const id = Date.now();
     setToasts(prev => [...prev, { id, title, message, icon }]);
     playSystemSound('notification');
     setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: number) => {
     setToasts(prev => prev.filter(t => t.id !== id));
  };

  const updateWorkspace = useCallback((id: number, updates: Partial<WorkspaceState>) => {
    setWorkspaces((prev) => 
      prev.map((ws) => (ws.id === id ? {...ws, ...updates} : ws))
    );
  }, []);

  const currentWorkspace = workspaces[currentWorkspaceId];

  // --- Actions ---
  const createNewFolder = () => {
    const newFolder: FileSystemItem = {
      id: `folder_${Date.now()}`,
      name: 'New Folder',
      type: 'folder',
      parentId: null,
      dateModified: Date.now(),
      position: { x: 150 + (fileSystem.length * 20) % 300, y: 100 + (fileSystem.length * 20) % 300 } 
    };
    setFileSystem(prev => [...prev, newFolder]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File, index) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          // Auto-detect MIME type fallback
          let mimeType = file.type;
          const ext = file.name.split('.').pop()?.toLowerCase();
          
          if (!mimeType) {
             if (ext === 'mp3') mimeType = 'audio/mpeg';
             else if (ext === 'mp4') mimeType = 'video/mp4';
             else if (ext === 'txt') mimeType = 'text/plain';
             else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
             else if (ext === 'png') mimeType = 'image/png';
             else if (ext === 'pdf') mimeType = 'application/pdf';
          }

          const newFile: FileSystemItem = {
            id: `file_${Date.now()}_${index}`,
            name: file.name,
            type: 'file',
            content: base64,
            mimeType: mimeType,
            parentId: null,
            dateModified: Date.now(),
            position: { x: 250 + (index * 30), y: 150 + (index * 30) } // Staggered position
          };
          setFileSystem(prev => [...prev, newFile]);
          
          if (index === files.length - 1) {
              addToast("Upload Complete", `${files.length > 1 ? `${files.length} files` : file.name} added to Desktop.`, "cloud_upload");
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRenameSave = (id: string, newName: string) => {
     setFileSystem(prev => prev.map(item => item.id === id ? { ...item, name: newName } : item));
  };

  const handleDelete = (id: string) => {
      if (id === 'recycle_bin') return;
      setFileSystem(prev => prev.map(item => item.id === id ? { ...item, parentId: 'recycle_bin' } : item));
      playSystemSound('notification');
  };

  const handleUninstall = (id: string) => {
      if (SYSTEM_APPS.includes(id)) {
          alert('This system application cannot be uninstalled.');
          return;
      }
      setInstalledApps(prev => prev.filter(appId => appId !== id));
      workspaces.forEach(ws => {
          if (ws.activeApp?.id === id) {
              updateWorkspace(ws.id, { activeApp: null, llmContent: '', interactionHistory: [], currentAppPath: [] });
          }
      });
      addToast("App Uninstalled", "Application removed successfully.", "delete");
  };

  const handleDropItem = (sourceId: string, targetId: string) => {
      setFileSystem(prev => prev.map(item => item.id === sourceId ? { ...item, parentId: targetId } : item));
      playSystemSound('click');
  };
  
  const handleDesktopDrop = (e: React.DragEvent) => {
      e.preventDefault();
      try {
        const dragDataRaw = e.dataTransfer.getData('text/plain');
        if (!dragDataRaw) return;
        const dragData = JSON.parse(dragDataRaw);
        const { id, offsetX, offsetY } = dragData;
        if (!id) return;
        const desktopRect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - desktopRect.left - offsetX;
        const y = e.clientY - desktopRect.top - offsetY;
        setFileSystem(prev => prev.map(item => 
            item.id === id ? { ...item, parentId: null, position: { x, y } } : item
        ));
      } catch (err) {
        console.warn("Desktop drop parse failed", err);
      }
  };

  const handleContextMenu = (e: React.MouseEvent, targetId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    playSystemSound('click');
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetId });
  };

  // --- LLM Logic Integration ---
  const internalHandleLlmRequest = useCallback(
    async (targetWorkspaceId: number, historyForLlm: InteractionData[], maxHistoryLength: number) => {
      if (historyForLlm.length === 0) return;
      updateWorkspace(targetWorkspaceId, { isLoading: true, error: null });
      
      let accumulatedContent = '';
      try {
        const stream = streamAppContent(historyForLlm, maxHistoryLength);
        for await (const chunk of stream) {
          accumulatedContent += chunk;
          setWorkspaces((prev) => 
            prev.map((ws) => ws.id === targetWorkspaceId ? {...ws, llmContent: ws.llmContent + chunk} : ws)
          );
        }
      } catch (e: any) {
        console.error(e);
        updateWorkspace(targetWorkspaceId, { isLoading: false, error: 'Failed to stream content.' });
      } finally {
        updateWorkspace(targetWorkspaceId, { isLoading: false });
      }
    },
    [updateWorkspace],
  );

  const handleInteraction = useCallback(
    async (interactionData: InteractionData) => {
      playSystemSound('click');
      const ws = workspaces[currentWorkspaceId];
      
      if (interactionData.id === 'app_close_button') {
        handleCloseAppView();
        return;
      }
      
      if (interactionData.id === 'upload_file_btn') {
         document.getElementById('hidden-file-input')?.click();
         return; 
      }

      if (ws.activeApp?.id === 'themes_store' && interactionData.id.startsWith('set_wallpaper_')) {
          const indexStr = interactionData.id.split('_')[2];
          const index = parseInt(indexStr, 10);
          if (!isNaN(index) && index >= 0 && index < WALLPAPERS.length) {
              setWallpaperIndex(index);
              addToast("Theme Applied", "Wallpaper updated successfully.", "wallpaper");
          }
      }

      if (interactionData.id.startsWith('install_')) {
         const appId = interactionData.id.replace('install_', '');
         if (!installedApps.includes(appId)) {
             setInstalledApps(prev => [...prev, appId]);
             addToast("Installation Complete", `${appId.replace('_', ' ').toUpperCase()} is now ready.`, "download_done");
         }
      }

       if (interactionData.id.startsWith('uninstall_')) {
          const appId = interactionData.id.replace('uninstall_', '');
          if (installedApps.includes(appId)) {
              handleUninstall(appId);
          }
       }
      
      const newHistory = [interactionData, ...ws.interactionHistory.slice(0, currentMaxHistoryLength - 1)];
      const newPath = ws.activeApp ? [...ws.currentAppPath, interactionData.id] : [interactionData.id];
      const cacheKey = newPath.join('__');

      updateWorkspace(currentWorkspaceId, { interactionHistory: newHistory, currentAppPath: newPath, llmContent: '', error: null });

      if (isStatefulnessEnabled && appContentCache[cacheKey]) {
        updateWorkspace(currentWorkspaceId, { llmContent: appContentCache[cacheKey], isLoading: false });
      } else {
        internalHandleLlmRequest(currentWorkspaceId, newHistory, currentMaxHistoryLength);
      }
    },
    [currentWorkspaceId, workspaces, currentMaxHistoryLength, isStatefulnessEnabled, appContentCache, updateWorkspace, internalHandleLlmRequest, installedApps],
  );

  const handleAppOpen = (app: AppDefinition) => {
    playSystemSound('open');

    if (app.id === 'media_player' && mediaFileToPlay) {
       // Handled below via timeout injection
    }
    
    if (app.id === 'shopping_app') {
        const ws = workspaces[currentWorkspaceId];
        if (ws.activeApp?.id === app.id && !isParametersOpen) return;

        updateWorkspace(currentWorkspaceId, {
          activeApp: app,
          interactionHistory: [],
          currentAppPath: [app.id],
          llmContent: `<div style="width:100%; height:100%; display:flex; flex-direction:column;">
            <div style="background:#f0f0f0; padding:8px; display:flex; gap:8px; border-bottom:1px solid #ccc; align-items:center;">
                <span class="material-symbols-rounded" style="font-size:16px; color:#666;">lock</span>
                <span style="font-size:12px; color:#333; font-family:sans-serif;">https://www.daraz.pk/</span>
            </div>
            <iframe src="https://www.daraz.pk/" style="flex:1; width:100%; border:none;" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
          </div>`,
          error: null,
          isLoading: false
        });
        return;
    }

    const ws = workspaces[currentWorkspaceId];
    if (ws.activeApp?.id === app.id && !isParametersOpen) return;

    const initialInteraction: InteractionData = {
      id: app.id,
      type: 'app_open',
      elementText: app.name,
      elementType: 'icon',
      appContext: app.id,
    };

    updateWorkspace(currentWorkspaceId, {
      activeApp: app,
      interactionHistory: [initialInteraction],
      currentAppPath: [app.id],
      llmContent: '',
      error: null
    });
    
    internalHandleLlmRequest(currentWorkspaceId, [initialInteraction], currentMaxHistoryLength);
  };
  
  const handleFileSystemItemClick = (item: FileSystemItem) => {
     playSystemSound('click');
     if (item.type === 'folder') {
         if (item.id === 'recycle_bin') {
             const app = APP_DEFINITIONS_CONFIG.find(a => a.id === 'trash_bin') || APP_DEFINITIONS_CONFIG.find(a => a.id === 'file_manager');
             if (app) handleAppOpen(app);
         } else {
             const app = APP_DEFINITIONS_CONFIG.find(a => a.id === 'file_manager');
             if (app) handleAppOpen(app);
         }
     } else {
         if (item.mimeType?.startsWith('audio/') || item.mimeType?.startsWith('video/') || item.name.endsWith('.mp3') || item.name.endsWith('.mp4')) {
             setMediaFileToPlay(item);
             const playerApp = APP_DEFINITIONS_CONFIG.find(a => a.id === 'media_player');
             if (playerApp) {
                 handleAppOpen(playerApp);
                 setTimeout(() => {
                    const mediaType = item.mimeType?.startsWith('video/') || item.name.endsWith('.mp4') ? 'video' : 'audio';
                    const src = item.content;
                    const name = item.name;

                    const html = `
                    <div class="flex flex-col h-full bg-black text-white overflow-hidden relative group select-none">
                      <div class="flex-grow flex items-center justify-center relative">
                         ${mediaType === 'video' 
                           ? `<video id="media_el" src="${src}" class="max-w-full max-h-full"></video>`
                           : `<div class="flex flex-col items-center gap-4 animate-pulse">
                                <div class="w-48 h-48 bg-gradient-to-tr from-gray-800 to-gray-700 rounded-2xl shadow-2xl flex items-center justify-center border border-white/10">
                                   <span class="material-symbols-rounded text-6xl text-gray-500">music_note</span>
                                </div>
                                <h2 class="text-xl font-medium tracking-wide">${name}</h2>
                                <audio id="media_el" src="${src}"></audio>
                              </div>`
                         }
                      </div>
                      <div class="h-24 bg-white/10 backdrop-blur-xl border-t border-white/10 flex flex-col justify-center px-8 gap-3 absolute bottom-0 w-full transition-transform duration-300 translate-y-0 group-hover:translate-y-0">
                         <div class="w-full flex items-center gap-4">
                            <span id="curr_time" class="text-xs font-mono opacity-70 w-10 text-right">0:00</span>
                            <input type="range" id="seek_bar" value="0" max="100" class="flex-grow h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-110 transition-all">
                            <span id="dur_time" class="text-xs font-mono opacity-70 w-10">0:00</span>
                         </div>
                         <div class="flex items-center justify-center gap-8">
                            <button class="text-white/50 hover:text-white transition-colors" data-interaction-id="prev"><span class="material-symbols-rounded text-3xl">skip_previous</span></button>
                            <button id="play_btn" class="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-white/10" data-interaction-id="play_pause">
                               <span class="material-symbols-rounded text-3xl">play_arrow</span>
                            </button>
                            <button class="text-white/50 hover:text-white transition-colors" data-interaction-id="next"><span class="material-symbols-rounded text-3xl">skip_next</span></button>
                         </div>
                      </div>
                      <script>
                        (function() {
                           const media = document.getElementById('media_el');
                           const playBtn = document.getElementById('play_btn');
                           const seekBar = document.getElementById('seek_bar');
                           const currTime = document.getElementById('curr_time');
                           const durTime = document.getElementById('dur_time');
                           const icon = playBtn.querySelector('span');
                           function fmt(s) {
                              const m = Math.floor(s / 60);
                              const sc = Math.floor(s % 60);
                              return m + ':' + (sc < 10 ? '0' : '') + sc;
                           }
                           playBtn.onclick = () => {
                              if (media.paused) { media.play(); icon.innerText = 'pause'; }
                              else { media.pause(); icon.innerText = 'play_arrow'; }
                           };
                           media.ontimeupdate = () => {
                              if (!media.duration) return;
                              seekBar.value = (media.currentTime / media.duration) * 100;
                              currTime.innerText = fmt(media.currentTime);
                              durTime.innerText = fmt(media.duration);
                           };
                           seekBar.oninput = (e) => {
                              const v = e.target.value;
                              if(media.duration) {
                                  media.currentTime = (v / 100) * media.duration;
                              }
                           };
                           media.onloadedmetadata = () => {
                              durTime.innerText = fmt(media.duration);
                              media.play().catch(() => {});
                              icon.innerText = 'pause';
                           };
                           media.onended = () => {
                               icon.innerText = 'play_arrow';
                           }
                        })();
                      </script>
                    </div>`;
                    updateWorkspace(currentWorkspaceId, {
                        llmContent: html,
                        isLoading: false
                    });
                 }, 500);
             }
         } else {
             const notepad = APP_DEFINITIONS_CONFIG.find(a => a.id === 'notepad_app');
             if (notepad) {
                 handleAppOpen(notepad);
                 setTimeout(() => {
                    const text = atob(item.content?.split(',')[1] || '');
                     updateWorkspace(currentWorkspaceId, {
                        llmContent: `<div class="h-full flex flex-col bg-white"><textarea class="w-full h-full p-4 font-mono text-sm resize-none outline-none">${text}</textarea></div>`,
                        isLoading: false
                    });
                 }, 500);
             }
         }
     }
  };

  const handleCloseAppView = () => {
    updateWorkspace(currentWorkspaceId, { activeApp: null, llmContent: '', error: null, interactionHistory: [], currentAppPath: [] });
    setMediaFileToPlay(null);
  };
  
  const handleGlobalClick = (e: React.MouseEvent) => {
      if (contextMenu) setContextMenu(null);
      if (isStartMenuOpen) setIsStartMenuOpen(false);
      if (isQuickSettingsOpen) setIsQuickSettingsOpen(false);
      if (isNotificationCenterOpen) setIsNotificationCenterOpen(false);
      if (isWidgetsOpen) setIsWidgetsOpen(false);
      setSelectedItemId(null);
  };
  
  const handleItemSelect = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setSelectedItemId(id);
  };

  const activeApp = currentWorkspace.activeApp;
  const desktopItems = fileSystem.filter(item => item.parentId === null);
  const visibleApps: AppDefinition[] = [];

  // --- Render Logic ---
  if (!hasLaunched) {
    return <LandingPage onLaunch={() => {
       playSystemSound('startup');
       setHasLaunched(true);
    }} />;
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-black font-sans selection:bg-[#007AFF] selection:text-white" onClick={handleGlobalClick}>
      
      {isLoadingOS && <LoadingScreen onComplete={() => { setIsLoadingOS(false); setIsLocked(true); }} />}
      
      {isLocked && !isLoadingOS && (
        <LockScreen 
          onUnlock={(appId) => {
            setIsLocked(false);
            if (appId) {
               const app = APP_DEFINITIONS_CONFIG.find(a => a.id === appId);
               if (app) handleAppOpen(app);
            }
          }} 
          wallpaper={WALLPAPERS[wallpaperIndex]}
          wallpaperIndex={wallpaperIndex}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <MeriAssistant 
        isOpen={isMeriActive} 
        onClose={() => setIsMeriActive(false)} 
        onAppOpen={handleAppOpen}
        onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        onChangeWallpaper={() => setWallpaperIndex((prev) => (prev + 1) % WALLPAPERS.length)}
      />

      {!isLocked && !isLoadingOS && (
      <Window
        title={activeApp ? activeApp.name : ''}
        onClose={() => isParametersOpen ? setIsParametersOpen(false) : handleCloseAppView()}
        isAppOpen={!!activeApp && !isParametersOpen}
        appId={activeApp?.id}
        onToggleParameters={() => setIsParametersOpen(!isParametersOpen)}
        onExitToDesktop={handleCloseAppView}
        isParametersPanelOpen={isParametersOpen}
        currentWorkspace={currentWorkspaceId}
        totalWorkspaces={MAX_WORKSPACES}
        onSwitchWorkspace={setCurrentWorkspaceId}
        theme={theme}
      >
        <div className={`w-full h-full relative flex flex-col ${theme === 'dark' ? 'bg-[#101010]' : 'bg-[#f0f4f9]'}`}>
          
          {wallpaperIndex === 0 ? <LiveWallpaper /> : (
            <div 
              className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out"
              style={{ 
                backgroundImage: `url(${WALLPAPERS[wallpaperIndex]})`,
                transform: `scale(${activeApp ? 1.02 : 1})`,
                filter: activeApp ? 'blur(0px) brightness(0.9)' : 'blur(0px) brightness(0.95)'
              }}
            ></div>
          )}

          {!activeApp && !isParametersOpen && (
            <div 
                className="absolute inset-0 z-10 p-4" 
                onContextMenu={(e) => handleContextMenu(e)}
            >
              <DesktopWidget />
              
              <div 
                 className="absolute inset-0 z-20 top-[60px]" 
                 onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                 onDrop={handleDesktopDrop}
              >
                  {desktopItems.map((item, index) => (
                      <DesktopItem 
                          key={item.id} 
                          item={item} 
                          index={visibleApps.length + index}
                          onInteract={() => { handleFileSystemItemClick(item); setSelectedItemId(item.id); }}
                          onContextMenu={(e) => { handleContextMenu(e, item.id); setSelectedItemId(item.id); }}
                          onDrop={handleDropItem}
                          onRenameSave={handleRenameSave}
                          isSelected={selectedItemId === item.id}
                      />
                  ))}
              </div>
            </div>
          )}

          {(activeApp || isParametersOpen) && (
             <div className={`relative z-20 w-full h-full backdrop-blur-2xl transition-all duration-500 animate-in zoom-in-95 fade-in flex flex-col ${theme === 'dark' ? 'bg-[#1e1e1e]/80' : 'bg-white/60'}`}>
                {isParametersOpen ? (
                  <ParametersPanel
                    currentLength={currentMaxHistoryLength}
                    onUpdateHistoryLength={setCurrentMaxHistoryLength}
                    onClosePanel={() => setIsParametersOpen(false)}
                    isStatefulnessEnabled={isStatefulnessEnabled}
                    onSetStatefulness={setIsStatefulnessEnabled}
                  />
                ) : (
                  <div className="flex-grow flex flex-col h-full overflow-hidden relative">
                    {currentWorkspace.isLoading && !currentWorkspace.llmContent && (
                      <div className="absolute inset-0 flex flex-col justify-center items-center z-50">
                        <div className="w-10 h-10 border-4 border-blue-500/30 rounded-full animate-spin border-t-blue-600 shadow-lg"></div>
                      </div>
                    )}
                    {currentWorkspace.error && (
                      <div className="absolute inset-0 flex items-center justify-center z-50 p-8">
                         <div className="text-red-800 bg-white/90 backdrop-blur-xl p-6 rounded-lg border border-red-200 shadow-2xl">
                          <div className="font-semibold">{currentWorkspace.error}</div>
                         </div>
                      </div>
                    )}
                    {(!currentWorkspace.isLoading || currentWorkspace.llmContent) && (
                      <div className="flex-grow overflow-hidden pb-0 bg-transparent">
                          <GeneratedContent
                            htmlContent={currentWorkspace.llmContent}
                            onInteract={handleInteraction}
                            appContext={activeApp?.id || null}
                            isLoading={currentWorkspace.isLoading}
                          />
                      </div>
                    )}
                  </div>
                )}
             </div>
          )}
          
          <StartMenu 
            isOpen={isStartMenuOpen}
            onClose={() => setIsStartMenuOpen(false)}
            onAppOpen={handleAppOpen}
            onFileOpen={handleFileSystemItemClick}
            theme={theme}
            installedApps={installedApps}
            fileSystem={fileSystem}
          />
          
          <WidgetsPanel 
             isOpen={isWidgetsOpen}
             onClose={() => setIsWidgetsOpen(false)}
             theme={theme}
          />

          <QuickSettingsPanel 
            isOpen={isQuickSettingsOpen}
            onClose={() => setIsQuickSettingsOpen(false)}
            theme={theme}
          />
          
          <NotificationCenter 
            isOpen={isNotificationCenterOpen}
            onClose={() => setIsNotificationCenterOpen(false)}
            theme={theme}
          />

          {contextMenu && (
             <div className="absolute inset-0 z-[60] pointer-events-none">
               <div className="pointer-events-auto">
                 <ContextMenu 
                   x={contextMenu.x} 
                   y={contextMenu.y} 
                   onClose={() => setContextMenu(null)}
                   onChangeWallpaper={() => setWallpaperIndex((prev) => (prev + 1) % WALLPAPERS.length)}
                   onNewFolder={createNewFolder}
                   targetId={contextMenu.targetId}
                   item={fileSystem.find(i => i.id === contextMenu.targetId)}
                   onOpen={handleFileSystemItemClick}
                   onDelete={handleDelete}
                   onRename={() => {
                        const newName = prompt("Rename to:", "New Name");
                        if (newName && contextMenu.targetId) handleRenameSave(contextMenu.targetId, newName);
                   }}
                   onUninstall={handleUninstall}
                   theme={theme}
                   onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
                 />
               </div>
             </div>
          )}

          <Taskbar 
            onAppOpen={handleAppOpen} 
            onToggleStart={() => setIsStartMenuOpen(!isStartMenuOpen)} 
            activeAppId={activeApp?.id} 
            installedApps={installedApps}
            onContextMenu={handleContextMenu}
            isStartOpen={isStartMenuOpen}
            theme={theme}
            onToggleNotifications={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
            onToggleQuickSettings={() => setIsQuickSettingsOpen(!isQuickSettingsOpen)}
            onToggleMeri={() => setIsMeriActive(!isMeriActive)}
            isMeriActive={isMeriActive}
            batteryLevel={batteryLevel}
            onToggleWidgets={() => setIsWidgetsOpen(!isWidgetsOpen)}
            isWidgetsOpen={isWidgetsOpen}
            onShowDesktop={() => { handleCloseAppView(); handleGlobalClick({} as any); }}
          />

          {/* Hidden File Input for Uploads */}
          <input
             type="file"
             id="hidden-file-input"
             className="hidden"
             multiple
             onChange={handleFileUpload}
          />
        </div>
      </Window>
      )}
    </div>
  );
};

export default App;
