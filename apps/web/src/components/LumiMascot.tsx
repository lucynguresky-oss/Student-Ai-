'use client';

import { motion } from 'framer-motion';

interface LumiProps {
  size?: number;
  mood?: 'happy' | 'thinking' | 'celebrating' | 'idle';
  animate?: boolean;
  className?: string;
}

export default function LumiMascot({ size = 120, mood = 'happy', animate = true, className = '' }: LumiProps) {
  const eyeY = mood === 'thinking' ? 38 : 40;
  const mouthPath =
    mood === 'celebrating'
      ? 'M 38 62 Q 50 72 62 62'
      : mood === 'thinking'
      ? 'M 42 64 Q 50 68 58 64'
      : 'M 38 64 Q 50 74 62 64';

  return (
    <motion.div
      className={`inline-block select-none ${className}`}
      animate={animate ? { y: [0, -8, 0], rotate: [0, 1, -1, 0] } : {}}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
      >
        {/* Glow aura */}
        <circle cx="50" cy="50" r="46" fill="url(#lumiAura)" opacity="0.25" />

        {/* Body */}
        <circle cx="50" cy="50" r="38" fill="url(#lumiBody)" />

        {/* Body sheen */}
        <ellipse cx="38" cy="34" rx="10" ry="6" fill="white" opacity="0.18" transform="rotate(-30 38 34)" />

        {/* Left eye */}
        <ellipse cx="36" cy={eyeY} rx="5" ry="5.5" fill="white" />
        <circle cx="37.5" cy={eyeY + 0.5} r="3" fill="#1a1a2e" />
        <circle cx="38.5" cy={eyeY - 0.5} r="1" fill="white" />

        {/* Right eye */}
        <ellipse cx="64" cy={eyeY} rx="5" ry="5.5" fill="white" />
        <circle cx="65.5" cy={eyeY + 0.5} r="3" fill="#1a1a2e" />
        <circle cx="66.5" cy={eyeY - 0.5} r="1" fill="white" />

        {/* Blink line (subtle) */}
        {mood === 'thinking' && (
          <line x1="31" y1="38" x2="41" y2="38" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        )}

        {/* Mouth */}
        <path d={mouthPath} stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* Celebrating sparkles */}
        {mood === 'celebrating' && (
          <>
            <motion.text
              x="72" y="28" fontSize="10" textAnchor="middle"
              animate={{ y: [0, -4, 0], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >✨</motion.text>
            <motion.text
              x="18" y="32" fontSize="8" textAnchor="middle"
              animate={{ y: [0, -3, 0], opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            >⭐</motion.text>
          </>
        )}

        {/* Ears / side bumps */}
        <circle cx="14" cy="50" r="8" fill="url(#lumiBody)" />
        <circle cx="86" cy="50" r="8" fill="url(#lumiBody)" />
        <circle cx="14" cy="50" r="4" fill="url(#lumiEar)" opacity="0.6" />
        <circle cx="86" cy="50" r="4" fill="url(#lumiEar)" opacity="0.6" />

        {/* Gradient definitions */}
        <defs>
          <radialGradient id="lumiAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#9333ea" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="lumiBody" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="40%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#7c3aed" />
          </radialGradient>
          <radialGradient id="lumiEar" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f0abfc" />
            <stop offset="100%" stopColor="#c084fc" />
          </radialGradient>
        </defs>
      </svg>
    </motion.div>
  );
}
