import React from 'react';

export const Logo = ({ className = "w-10 h-10" }: { className?: string }) => {
  return (
    <div className={`${className} shrink-0 overflow-hidden relative group transition-all duration-500 rounded-xl shadow-2xl`}>
      {/* Futuristic Minimalist Document Icon */}
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full transition-all duration-500 group-hover:scale-105"
      >
        <defs>
          {/* Background Gradient: Deep Blue to Almost Black */}
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          
          {/* Icon Gradient: Teal (#2DD4BF) to Blue (#3B82F6) */}
          <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>

          {/* Subtle Glow Filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Rect */}
        <rect width="24" height="24" rx="7" fill="url(#bgGradient)" />
        
        {/* Document Outline with Folded Corner */}
        <path 
          d="M7 4H14.5L18 7.5V19C18 20.1046 17.1046 21 16 21H8C6.89543 21 6 20.1046 6 19V5C6 4.44772 6.44772 4 7 4Z" 
          stroke="url(#iconGradient)" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          filter="url(#glow)"
        />
        
        {/* Folded Corner Line */}
        <path 
          d="M14.5 4V7.5H18" 
          stroke="url(#iconGradient)" 
          strokeWidth="1.2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="opacity-80"
        />
        
        {/* Text Lines */}
        <line x1="9" y1="10" x2="15" y2="10" stroke="url(#iconGradient)" strokeWidth="1.2" strokeLinecap="round" className="opacity-60" />
        <line x1="9" y1="13" x2="13" y2="13" stroke="url(#iconGradient)" strokeWidth="1.2" strokeLinecap="round" className="opacity-60" />
        
        {/* Integrated Checkmark (Bottom Right) */}
        <path 
          d="M15 17L17 19L21 15" 
          stroke="url(#iconGradient)" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          filter="url(#glow)"
        />
      </svg>
      
      {/* Subtle futuristic scanline or overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none opacity-50" />
    </div>
  );
};
