import React from 'react';
import { Language } from '../types.js';

interface CountryFlagProps {
  language: Language;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  xs: 'w-4 h-3 rounded-xs',
  sm: 'w-5 h-3.5 rounded-xs',
  md: 'w-6 h-4 rounded-sm',
  lg: 'w-8 h-5 rounded-sm',
};

export const CountryFlag: React.FC<CountryFlagProps> = ({
  language,
  className = '',
  size = 'sm',
}) => {
  const baseSize = sizeClasses[size] || sizeClasses.sm;

  // Render authentic vector flags for all 20 supported languages
  const renderSvg = () => {
    switch (language) {
      case 'en': // United States
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            {/* 13 Stripes */}
            <rect width="640" height="480" fill="#B22234" />
            <path
              d="M0,36.9h640M0,110.8h640M0,184.6h640M0,258.5h640M0,332.3h640M0,406.2h640"
              stroke="#FFFFFF"
              strokeWidth="36.9"
            />
            {/* Blue Canton */}
            <rect width="256" height="258.5" fill="#3C3B6E" />
            {/* Stars grid approximation */}
            <g fill="#FFFFFF">
              {[30, 70, 110, 150, 190, 230].map((y, rowIdx) => (
                <g key={rowIdx}>
                  {(rowIdx % 2 === 0 ? [25, 65, 105, 145, 185, 225] : [45, 85, 125, 165, 205]).map((x, colIdx) => (
                    <circle key={colIdx} cx={x} cy={y} r="5" />
                  ))}
                </g>
              ))}
            </g>
          </svg>
        );

      case 'fa': // Iran
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            {/* Green, White, Red horizontal stripes */}
            <rect width="640" height="160" fill="#239F40" />
            <rect y="160" width="640" height="160" fill="#FFFFFF" />
            <rect y="320" width="640" height="160" fill="#DA0000" />
            {/* Subtle stylized Allah symbol in red center */}
            <g transform="translate(320, 240) scale(1.4)" fill="#DA0000">
              <path d="M0,-30 C-4,-20 -4,15 0,25 C4,15 4,-20 0,-30 Z" />
              <path d="M-12,-18 C-20,-8 -18,16 -7,22 C-6,14 -12,2 -8,-10 Z" />
              <path d="M12,-18 C20,-8 18,16 7,22 C6,14 12,2 8,-10 Z" />
              <path d="M-22,-5 C-28,4 -24,20 -15,24 C-14,17 -22,7 -16,-2 Z" />
              <path d="M22,-5 C28,4 24,20 15,24 C14,17 22,7 16,-2 Z" />
              <circle cx="0" cy="-35" r="3.5" />
            </g>
          </svg>
        );

      case 'ar': // Saudi Arabia
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <rect width="640" height="480" fill="#007A3D" />
            {/* White Shahada calligraphic silhouette and sword */}
            <g fill="#FFFFFF" transform="translate(320, 230)">
              {/* Calligraphy bars */}
              <path d="M-180,-40 H180 V-28 H-180 Z" opacity="0.9" />
              <path d="M-160,-20 Q-100,-35 0,-20 Q100,-35 160,-20 V-10 Q100,-25 0,-10 Q-100,-25 -160,-10 Z" />
              <path d="M-140,5 H140 V15 H-140 Z" opacity="0.95" />
              {/* Sword */}
              <path d="M-170,35 H150 L140,43 H-170 Z" />
              <rect x="145" y="27" width="8" height="24" rx="2" />
              <circle cx="160" cy="39" r="6" />
            </g>
          </svg>
        );

      case 'es': // Spain
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <rect width="640" height="120" fill="#AA151B" />
            <rect y="120" width="640" height="240" fill="#F1BF00" />
            <rect y="360" width="640" height="120" fill="#AA151B" />
            {/* Coat of arms */}
            <g transform="translate(190, 240) scale(0.65)">
              <rect x="-40" y="-50" width="80" height="100" rx="8" fill="#AA151B" stroke="#FFFFFF" strokeWidth="4" />
              <rect x="-30" y="-40" width="60" height="80" rx="4" fill="#F1BF00" />
              <circle cx="0" cy="-60" r="14" fill="#F1BF00" stroke="#AA151B" strokeWidth="4" />
            </g>
          </svg>
        );

      case 'zh': // China
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <rect width="640" height="480" fill="#DE2910" />
            {/* Big star */}
            <polygon
              points="100,50 112,87 151,87 119,110 131,148 100,125 69,148 81,110 49,87 88,87"
              fill="#FFDE00"
            />
            {/* 4 small stars */}
            <polygon points="200,45 204,56 216,56 206,63 210,74 200,67 190,74 194,63 184,56 196,56" fill="#FFDE00" />
            <polygon points="230,85 234,96 246,96 236,103 240,114 230,107 220,114 224,103 214,96 226,96" fill="#FFDE00" />
            <polygon points="230,135 234,146 246,146 236,153 240,164 230,157 220,164 224,153 214,146 226,146" fill="#FFDE00" />
            <polygon points="200,175 204,186 216,186 206,193 210,204 200,197 190,204 194,193 184,186 196,186" fill="#FFDE00" />
          </svg>
        );

      case 'fr': // France
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <rect width="213.3" height="480" fill="#002654" />
            <rect x="213.3" width="213.4" height="480" fill="#FFFFFF" />
            <rect x="426.7" width="213.3" height="480" fill="#CE1126" />
          </svg>
        );

      case 'de': // Germany
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <rect width="640" height="160" fill="#000000" />
            <rect y="160" width="640" height="160" fill="#DD0000" />
            <rect y="320" width="640" height="160" fill="#FFCC00" />
          </svg>
        );

      case 'ru': // Russia
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <rect width="640" height="160" fill="#FFFFFF" />
            <rect y="160" width="640" height="160" fill="#0039A6" />
            <rect y="320" width="640" height="160" fill="#D52B1E" />
          </svg>
        );

      case 'pt': // Brazil
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <rect width="640" height="480" fill="#009739" />
            <polygon points="320,50 580,240 320,430 60,240" fill="#FEDD00" />
            <circle cx="320" cy="240" r="105" fill="#012169" />
            <path d="M220,250 Q320,200 420,255" stroke="#FFFFFF" strokeWidth="14" fill="none" />
          </svg>
        );

      case 'ja': // Japan
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <rect width="640" height="480" fill="#FFFFFF" />
            <circle cx="320" cy="240" r="144" fill="#BC002D" />
          </svg>
        );

      case 'hi': // India
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <rect width="640" height="160" fill="#FF9933" />
            <rect y="160" width="640" height="160" fill="#FFFFFF" />
            <rect y="320" width="640" height="160" fill="#138808" />
            {/* Ashoka Chakra */}
            <g transform="translate(320, 240)">
              <circle r="55" fill="none" stroke="#000080" strokeWidth="8" />
              <circle r="12" fill="#000080" />
              {[...Array(12)].map((_, i) => (
                <line
                  key={i}
                  x1="0"
                  y1="-50"
                  x2="0"
                  y2="50"
                  stroke="#000080"
                  strokeWidth="3"
                  transform={`rotate(${i * 15})`}
                />
              ))}
            </g>
          </svg>
        );

      case 'it': // Italy
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <rect width="213.3" height="480" fill="#008C45" />
            <rect x="213.3" width="213.4" height="480" fill="#F4F5F0" />
            <rect x="426.7" width="213.3" height="480" fill="#CD212A" />
          </svg>
        );

      case 'tr': // Turkey
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <rect width="640" height="480" fill="#E30A17" />
            {/* Crescent moon */}
            <circle cx="260" cy="240" r="120" fill="#FFFFFF" />
            <circle cx="290" cy="240" r="96" fill="#E30A17" />
            {/* Star */}
            <g transform="translate(385, 240) rotate(-15) scale(0.7)">
              <polygon
                points="0,-60 18,-18 60,-18 24,8 38,50 0,24 -38,50 -24,8 -60,-18 -18,-18"
                fill="#FFFFFF"
              />
            </g>
          </svg>
        );

      case 'ko': // South Korea
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <rect width="640" height="480" fill="#FFFFFF" />
            {/* Taegeuk center */}
            <g transform="translate(320, 240) rotate(-35)">
              <path d="M-90,0 A90,90 0 0,1 90,0 A45,45 0 0,0 0,0 A45,45 0 0,1 -90,0 Z" fill="#CD2E3A" />
              <path d="M-90,0 A90,90 0 0,0 90,0 A45,45 0 0,1 0,0 A45,45 0 0,0 -90,0 Z" fill="#0047A0" />
            </g>
            {/* Trigrams in corners */}
            <g fill="#000000">
              <rect x="120" y="80" width="60" height="10" transform="rotate(35, 150, 85)" />
              <rect x="120" y="96" width="60" height="10" transform="rotate(35, 150, 101)" />
              <rect x="120" y="112" width="60" height="10" transform="rotate(35, 150, 117)" />

              <rect x="460" y="360" width="60" height="10" transform="rotate(35, 490, 365)" />
              <rect x="460" y="376" width="60" height="10" transform="rotate(35, 490, 381)" />
              <rect x="460" y="392" width="60" height="10" transform="rotate(35, 490, 397)" />
            </g>
          </svg>
        );

      case 'nl': // Netherlands
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <rect width="640" height="160" fill="#AE1C28" />
            <rect y="160" width="640" height="160" fill="#FFFFFF" />
            <rect y="320" width="640" height="160" fill="#21468B" />
          </svg>
        );

      case 'pl': // Poland
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <rect width="640" height="240" fill="#FFFFFF" />
            <rect y="240" width="640" height="240" fill="#DC143C" />
          </svg>
        );

      case 'id': // Indonesia
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <rect width="640" height="240" fill="#FF0000" />
            <rect y="240" width="640" height="240" fill="#FFFFFF" />
          </svg>
        );

      case 'vi': // Vietnam
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <rect width="640" height="480" fill="#DA251D" />
            <polygon
              points="320,120 357,235 478,235 380,306 418,420 320,349 222,420 260,306 162,235 283,235"
              fill="#FFFF00"
            />
          </svg>
        );

      case 'ur': // Pakistan
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <rect width="640" height="480" fill="#01411C" />
            <rect width="160" height="480" fill="#FFFFFF" />
            {/* Crescent and star */}
            <circle cx="400" cy="240" r="110" fill="#FFFFFF" />
            <circle cx="425" cy="225" r="95" fill="#01411C" />
            <polygon
              points="450,170 457,192 480,192 461,206 468,228 450,214 432,228 439,206 420,192 443,192"
              fill="#FFFFFF"
            />
          </svg>
        );

      case 'bn': // Bangladesh
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <rect width="640" height="480" fill="#006A4E" />
            <circle cx="280" cy="240" r="140" fill="#F42A41" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <rect width="640" height="480" fill="#4F46E5" />
          </svg>
        );
    }
  };

  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden border border-white/20 shadow-xs select-none ${baseSize} ${className}`}
      aria-hidden="true"
    >
      {renderSvg()}
    </span>
  );
};
