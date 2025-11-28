
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React from 'react';
import {AppDefinition} from '../types';

interface IconProps {
  app: AppDefinition;
  onInteract: () => void;
  variant?: 'desktop' | 'dock';
}

export const Icon: React.FC<IconProps> = ({app, onInteract, variant = 'desktop'}) => {
  const isDock = variant === 'dock';

  // Dynamic classes based on variant
  const containerSize = isDock ? 'w-12 h-12' : 'w-[5.5rem] h-[5.5rem]';
  const iconSize = isDock ? 'text-[1.8rem]' : 'text-[3.5rem]';
  const borderRadius = isDock ? '14px' : '22px';
  const hoverEffect = isDock ? 'hover:-translate-y-3' : 'hover:scale-[1.02] active:scale-95';
  // Desktop icons need fixed width/height for grid alignment
  const wrapperClasses = isDock 
    ? 'w-auto h-auto gap-0 p-1' 
    : 'w-28 min-h-[7.5rem] gap-3 p-2';

  return (
    <div
      className={`group flex flex-col items-center cursor-pointer select-none transition-all duration-300 relative ${wrapperClasses}`}
      onClick={onInteract}
      onKeyDown={(e) => e.key === 'Enter' && onInteract()}
      tabIndex={0}
      role="button"
      aria-label={`Open ${app.name}`}>
      
      {/* Icon Squircle */}
      <div 
        className={`relative flex items-center justify-center shadow-xl transition-all duration-500 z-10 ${containerSize} ${hoverEffect}`}
        style={{
          background: `linear-gradient(135deg, ${app.color} 0%, ${app.color} 50%, rgba(255,255,255,0.2) 100%)`, 
          borderRadius: borderRadius, 
          boxShadow: isDock 
             ? `inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 12px -2px ${app.color}60`
             : `inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 25px -5px ${app.color}70`
        }}
      >
        {/* Gloss shine */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-[inherit] pointer-events-none"></div>

        {/* Material Symbol Icon */}
        <span 
          className={`material-symbols-rounded text-white filter drop-shadow-md transform transition-transform duration-500 ${iconSize} ${isDock ? '' : 'group-hover:scale-110 group-hover:rotate-0'} z-10`}
        >
          {app.icon}
        </span>
      </div>

      {/* Label (Desktop Only) */}
      {!isDock && (
        <div className="flex flex-col items-center opacity-90 group-hover:opacity-100 transition-opacity w-full">
          <span className="text-[12px] font-medium text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] px-2 py-0.5 rounded text-center line-clamp-2 leading-tight">
            {app.name}
          </span>
        </div>
      )}

      {/* Tooltip (Dock Only) */}
      {isDock && (
        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
          <span className="text-xs font-medium text-gray-800 bg-white/90 backdrop-blur-xl px-3 py-1.5 rounded-lg shadow-lg border border-white/40 whitespace-nowrap">
            {app.name}
          </span>
        </div>
      )}
    </div>
  );
};
