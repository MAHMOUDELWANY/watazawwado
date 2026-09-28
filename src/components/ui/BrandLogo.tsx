import React from 'react';

interface BrandLogoProps {
  variant?: 'compact' | 'standard' | 'large';
  className?: string;
}

export function BrandLogo({ variant = 'standard', className = '' }: BrandLogoProps) {
  // Mobile: outer frame approx 72px (w-18, wait w-16=64, w-20=80). Desktop approx 84-96px (w-24=96).
  // "The logo must be LARGE and CLEAR."
  // "compact" -> for navbar
  
  const sizeClasses = {
    compact: 'w-12 h-12 sm:w-14 sm:h-14 p-[1.5px] rounded-xl', // slightly bigger than before for navbar
    standard: 'w-20 h-20 sm:w-24 sm:h-24 p-[2px] rounded-2xl', // auth / standard branding
    large: 'w-24 h-24 sm:w-28 sm:h-28 p-[2.5px] rounded-3xl', // giant splash screens if needed
  };
  
  const imgClasses = {
    compact: 'p-1.5',
    standard: 'p-3',
    large: 'p-4',
  };

  return (
    <div className={`relative shrink-0 bg-[linear-gradient(135deg,#C51F24_0%,#8B4935_45%,#D8C6AE_85%,#087D91_100%)] shadow-sm flex items-center justify-center overflow-hidden ${sizeClasses[variant]} ${className}`}>
      {/* 
        The interior background MUST be light/warm in both modes. 
        #FDFBF7 is a warm paper color. 
        It ensures the logo's red, teal, and copper always have high contrast.
      */}
      <div className={`w-full h-full rounded-[inherit] bg-[#F9F7F1] dark:bg-[#EDE7DC] flex items-center justify-center overflow-hidden`}>
        <img 
          src="/logo.png" 
          alt="Watazawwado Logo" 
          className={`w-full h-full object-contain drop-shadow-sm ${imgClasses[variant]}`} 
        />
      </div>
    </div>
  );
}
