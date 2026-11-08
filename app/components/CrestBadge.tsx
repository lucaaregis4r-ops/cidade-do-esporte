import React from 'react';
import type { CrestShape } from '../../game/core/club/ClubIdentity';

export interface CrestBadgeProps {
  shape?: CrestShape;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  monogram: string;
  size?: number;
  className?: string;
}

export function CrestBadge({
  shape = 'swiss',
  primaryColor,
  secondaryColor,
  accentColor = '#f5da90',
  monogram,
  size = 64,
  className,
}: CrestBadgeProps) {
  const letters = monogram.slice(0, 4);

  // SVG dimensions: 100 x 120 viewBox
  const renderShape = () => {
    switch (shape) {
      case 'circle':
        return (
          <>
            <circle cx="50" cy="60" r="46" fill={primaryColor} stroke={accentColor} strokeWidth="3" />
            <circle cx="50" cy="60" r="38" fill={secondaryColor} stroke={primaryColor} strokeWidth="1.5" />
            <text
              x="50"
              y="68"
              textAnchor="middle"
              fill={primaryColor}
              fontFamily="Georgia, 'Times New Roman', serif"
              fontWeight="bold"
              fontSize={letters.length > 3 ? '22' : '28'}
              letterSpacing="1"
            >
              {letters}
            </text>
          </>
        );

      case 'diamond':
        return (
          <>
            <polygon
              points="50,6 94,60 50,114 6,60"
              fill={primaryColor}
              stroke={accentColor}
              strokeWidth="3.5"
            />
            <polygon
              points="50,16 84,60 50,104 16,60"
              fill={secondaryColor}
              stroke={primaryColor}
              strokeWidth="2"
            />
            <text
              x="50"
              y="68"
              textAnchor="middle"
              fill={primaryColor}
              fontFamily="Georgia, 'Times New Roman', serif"
              fontWeight="bold"
              fontSize={letters.length > 3 ? '20' : '26'}
            >
              {letters}
            </text>
          </>
        );

      case 'stripes':
        return (
          <>
            <clipPath id="stripes-clip">
              <path d="M10,12 L90,12 C90,60 75,98 50,116 C25,98 10,60 10,12 Z" />
            </clipPath>
            <path
              d="M10,12 L90,12 C90,60 75,98 50,116 C25,98 10,60 10,12 Z"
              fill={secondaryColor}
              stroke={accentColor}
              strokeWidth="3.5"
            />
            <g clipPath="url(#stripes-clip)">
              <rect x="25" y="10" width="16" height="110" fill={primaryColor} />
              <rect x="59" y="10" width="16" height="110" fill={primaryColor} />
              {/* Header band for letters */}
              <rect x="10" y="44" width="80" height="32" fill={primaryColor} stroke={accentColor} strokeWidth="1.5" />
            </g>
            <text
              x="50"
              y="67"
              textAnchor="middle"
              fill={secondaryColor}
              fontFamily="Georgia, 'Times New Roman', serif"
              fontWeight="bold"
              fontSize={letters.length > 3 ? '18' : '22'}
              letterSpacing="1.5"
            >
              {letters}
            </text>
          </>
        );

      case 'sash':
        return (
          <>
            <clipPath id="sash-clip">
              <path d="M12,12 L88,12 C88,58 74,96 50,114 C26,96 12,58 12,12 Z" />
            </clipPath>
            <path
              d="M12,12 L88,12 C88,58 74,96 50,114 C26,96 12,58 12,12 Z"
              fill={primaryColor}
              stroke={accentColor}
              strokeWidth="3.5"
            />
            <g clipPath="url(#sash-clip)">
              {/* Diagonal sash across shield */}
              <polygon points="0,0 35,0 100,80 100,120 65,120 0,40" fill={secondaryColor} stroke={accentColor} strokeWidth="1.5" />
            </g>
            <text
              x="50"
              y="68"
              textAnchor="middle"
              fill={secondaryColor === '#ffffff' || secondaryColor === '#f8f8f8' ? primaryColor : '#ffffff'}
              fontFamily="Georgia, 'Times New Roman', serif"
              fontWeight="bold"
              fontSize={letters.length > 3 ? '20' : '25'}
              stroke="#000000"
              strokeWidth="0.5"
            >
              {letters}
            </text>
          </>
        );

      case 'swiss':
      default:
        return (
          <>
            <path
              d="M12,10 L88,10 C88,60 72,98 50,116 C28,98 12,60 12,10 Z"
              fill={primaryColor}
              stroke={accentColor}
              strokeWidth="3.5"
            />
            <path
              d="M18,16 L82,16 C82,56 68,90 50,106 C32,90 18,56 18,16 Z"
              fill={secondaryColor}
              stroke={primaryColor}
              strokeWidth="1.5"
            />
            <text
              x="50"
              y="66"
              textAnchor="middle"
              fill={primaryColor}
              fontFamily="Georgia, 'Times New Roman', serif"
              fontWeight="bold"
              fontSize={letters.length > 3 ? '20' : '26'}
              letterSpacing="1"
            >
              {letters}
            </text>
          </>
        );
    }
  };

  return (
    <svg
      width={size}
      height={Math.round(size * 1.2)}
      viewBox="0 0 100 120"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
      aria-label={`Escudo do clube ${monogram}`}
    >
      {renderShape()}
    </svg>
  );
}
