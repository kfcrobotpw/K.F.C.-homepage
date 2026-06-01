import React from 'react';

interface KfcLogoProps {
  className?: string;
  size?: number;
}

export default function KfcLogo({ className = "text-white", size = 48 }: KfcLogoProps) {
  return (
    <svg
      id="kfc-official-logo-svg"
      width={size}
      height={size}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Globe Lines Grid */}
      {/* Outer Circle boundary */}
      <circle cx="250" cy="240" r="170" stroke="currentColor" strokeWidth="8" fill="none" />
      
      {/* Central Vertical longitude axis */}
      <line x1="250" y1="70" x2="250" y2="410" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      
      {/* Central Horizontal latitude line */}
      <line x1="80" y1="240" x2="420" y2="240" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      
      {/* Perspective Longitude Ellipses */}
      <ellipse cx="250" cy="240" rx="85" ry="170" stroke="currentColor" strokeWidth="8" fill="none" />
      
      {/* Perspective Latitude Ellipse */}
      <ellipse cx="250" cy="240" rx="170" ry="75" stroke="currentColor" strokeWidth="8" fill="none" />

      {/* Left Axis Indicator Arrow & Dashed Line */}
      <path d="M 75 240 L 92 227 M 75 240 L 92 253" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="0" y1="240" x2="62" y2="240" stroke="currentColor" strokeWidth="6" strokeDasharray="10 8" strokeLinecap="round" />

      {/* Right Axis Indicator Arrow & Dashed Line */}
      <path d="M 425 240 L 408 227 M 425 240 L 408 253" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="438" y1="240" x2="500" y2="240" stroke="currentColor" strokeWidth="6" strokeDasharray="10 8" strokeLinecap="round" />

      {/* Slanted Bold "K.F.C." Text Group */}
      <g transform="translate(250, 260) skewX(-11)">
        <text 
          x="0" 
          y="15" 
          fontFamily="'Inter', 'Arial Black', sans-serif" 
          fontWeight="900" 
          fontSize="115" 
          textAnchor="middle" 
          fill="currentColor" 
          letterSpacing="-2"
        >
          K.F.C.
        </text>
      </g>

      {/* Bottom Sub-text black torn-ribbon Banner */}
      <path 
        d="M 132 342 L 368 342 L 356 362 L 368 382 L 132 382 L 144 362 Z" 
        fill="#000000" 
        stroke="currentColor" 
        strokeWidth="5" 
        strokeLinejoin="round" 
      />

      {/* Ribbon Text "Korea Fun Club" */}
      <text 
        x="250" 
        y="369" 
        fontFamily="'Inter', sans-serif" 
        fontWeight="800" 
        fontSize="17.5" 
        textAnchor="middle" 
        fill="#ffffff" 
        letterSpacing="0.8"
      >
        Korea Fun Club
      </text>
    </svg>
  );
}
