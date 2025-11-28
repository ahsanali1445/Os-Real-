
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, { useState, useEffect } from 'react';

interface WindowProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  isAppOpen: boolean;
  appId?: string | null;
  onToggleParameters: () => void;
  onExitToDesktop: () => void;
  isParametersPanelOpen?: boolean;
  // Workspace Props
  currentWorkspace: number;
  totalWorkspaces: number;
  onSwitchWorkspace: (index: number) => void;
  theme: 'light' | 'dark';
}

export const Window: React.FC<WindowProps> = ({
  title,
  children,
  onClose,
  isAppOpen,
  onToggleParameters,
  onExitToDesktop,
  isParametersPanelOpen,
  currentWorkspace,
  totalWorkspaces,
  onSwitchWorkspace,
  theme,
}) => {
  const displayTitle = isParametersPanelOpen ? 'Settings' : title;

  // Theme-based Classes
  const frameBg = theme === 'dark' ? 'bg-[#101010]' : 'bg-gray-200';
  const headerBg = theme === 'dark' ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white/80 border-white/5';
  const headerText = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
  const controlHover = theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5';
  const workspaceActive = theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white';
  const workspaceInactive = theme === 'dark' ? 'text-gray-500 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-black/5 hover:text-black';

  return (
    <div className={`relative w-full h-full flex flex-col overflow-hidden font-sans select-none ${frameBg}`}>
      
      {/* Ambient Lighting Glow (Reduced in Dark Mode) */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 blur-[80px] pointer-events-none rounded-full ${theme === 'dark' ? 'bg-blue-900/10' : 'bg-white/50'}`}></div>
      
      {/* Windows 11 Style System Bar (Monitor Header) */}
      <div className={`h-8 flex items-center justify-between pl-4 pr-0 z-30 relative border-b backdrop-blur-md flex-shrink-0 transition-colors duration-300 ${headerBg} ${headerText}`}>
        
        {/* Left: App Icon & Title */}
        <div className="flex items-center gap-3 w-1/3">
           {/* Only show icon and title if there is a title (app open) or Settings open */}
           {displayTitle && (
             <>
               <div className="w-4 h-4 rounded-sm bg-blue-500/20 border border-blue-400/50 flex items-center justify-center">
                 <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
               </div>
               <span className="font-normal text-xs tracking-wide opacity-90 truncate">
                {displayTitle}
              </span>
             </>
           )}
        </div>

        {/* Center: Workspace Switcher (Pill) */}
        <div className="flex items-center justify-center gap-2 w-1/3">
           <div className={`flex rounded-md p-0.5 border shadow-inner ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-gray-200/50 border-white/40'}`}>
             {Array.from({ length: totalWorkspaces }).map((_, idx) => (
               <button
                 key={idx}
                 onClick={() => onSwitchWorkspace(idx)}
                 className={`
                    w-6 h-4 rounded-sm flex items-center justify-center text-[9px] font-bold transition-all duration-200
                    ${currentWorkspace === idx ? `${workspaceActive} shadow-sm` : workspaceInactive}
                 `}
               >
                 {idx + 1}
               </button>
             ))}
           </div>
        </div>

        {/* Right: Windows Controls */}
        <div className="flex items-center justify-end w-1/3 h-full">
           <button 
             onClick={onToggleParameters}
             className={`h-full w-10 flex items-center justify-center transition-colors ${controlHover}`}
             title="Settings"
           >
             <span className="material-symbols-rounded text-[14px]">settings</span>
           </button>

           <button 
              onClick={onExitToDesktop}
              className={`h-full w-10 flex items-center justify-center transition-colors group/btn ${controlHover}`}
              aria-label="Minimize">
               <span className="text-[14px] font-light">─</span>
            </button>
            <button 
              className={`h-full w-10 flex items-center justify-center transition-colors group/btn ${controlHover}`}
              aria-label="Maximize">
               <span className="material-symbols-rounded text-[12px]">check_box_outline_blank</span>
            </button>
            <button 
              onClick={onClose}
              className={`h-full w-10 flex items-center justify-center hover:bg-[#E81123] hover:text-white transition-colors group/btn`}
              aria-label="Close">
               <span className="material-symbols-rounded text-[16px]">close</span>
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className={`flex-grow relative overflow-hidden ${theme === 'dark' ? 'bg-[#121212]' : 'bg-[#f9f9f9]'}`}>
        {children}
      </div>
    </div>
  );
};
