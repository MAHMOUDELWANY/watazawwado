import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, CheckCircle2, Sparkles } from 'lucide-react';

export interface OtpOrbitalGraphicProps {
  /** How many digits have been entered (0 to 6) */
  digitCount?: number;
  /** Whether the code is currently being verified */
  isVerifying?: boolean;
  /** Whether verification was successful */
  isSuccess?: boolean;
  /** Size tier: 'sm' (modal), 'md' (standard), 'lg' (hero page) */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Mesmerizing 3D Celestial Orbital Animation ("بتلف حوالين بعضها")
 * Multi-axis concentric & tilted rings revolving around each other in 3D space,
 * infused with the 4 Islamic architectural heritage colors:
 * - Glazed Zellij Teal (#087D91 / #12A4BC)
 * - Andalusian Crimson (#C51F24 / #E82C32)
 * - Cedar Terracotta (#8B4935 / #DA7960)
 * - Parchment Sand Gold (#D8C6AE / #E8DAC8)
 */
export const OtpOrbitalGraphic: React.FC<OtpOrbitalGraphicProps> = ({
  digitCount = 0,
  isVerifying = false,
  isSuccess = false,
  size = 'md',
  className = '',
}) => {
  const isReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Pixel dimensions based on size
  const pxSize = size === 'sm' ? 140 : size === 'lg' ? 220 : 180;
  const coreSize = size === 'sm' ? 52 : size === 'lg' ? 76 : 64;

  // Energy multiplier based on digits filled (0 to 6)
  const energyScale = 1 + (digitCount / 6) * 0.12;

  return (
    <div
      role="img"
      aria-label="Celestial security orbit animation"
      className={`relative inline-flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{
        width: pxSize,
        height: pxSize,
        perspective: '800px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* ── 1. AMBIENT GLOW BACKDROP (4 Heritage Colors) ── */}
      <div
        className="absolute inset-0 rounded-full animate-pulse-glow"
        style={{
          background: isSuccess
            ? 'radial-gradient(circle, rgba(18,164,188,0.35) 0%, rgba(52,168,83,0.25) 45%, transparent 70%)'
            : isVerifying
            ? 'radial-gradient(circle, rgba(197,31,36,0.35) 0%, rgba(8,125,145,0.3) 50%, transparent 75%)'
            : 'radial-gradient(circle, rgba(8,125,145,0.22) 0%, rgba(197,31,36,0.18) 35%, rgba(139,73,53,0.14) 60%, transparent 75%)',
          filter: 'blur(20px)',
          transform: `scale(${energyScale})`,
          transition: 'transform 0.4s ease, background 0.4s ease',
        }}
      />

      {/* ── 2. OUTER PLANAR ASTROLABE RING (Z-Axis Clockwise) ── */}
      <div
        className={`absolute inset-1 rounded-full border border-teal-500/20 dark:border-teal-400/25 ${
          !isReducedMotion ? (isVerifying ? 'animate-orbit-z-fast' : 'animate-orbit-z') : ''
        }`}
        style={{
          boxShadow: 'inset 0 0 12px rgba(8,125,145,0.08)',
        }}
      >
        {/* Satellites on outer ring */}
        {/* Node 1: Glazed Teal Top */}
        <span
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#087D91] dark:bg-[#12A4BC]"
          style={{ boxShadow: '0 0 10px #087D91' }}
        />
        {/* Node 2: Andalusian Crimson Bottom */}
        <span
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#C51F24] dark:bg-[#E82C32]"
          style={{ boxShadow: '0 0 10px #C51F24' }}
        />
        {/* Subtle dashed compass ticks */}
        <div className="absolute inset-2 rounded-full border border-dashed border-sand/30 dark:border-sand-light/40" />
      </div>

      {/* ── 3. FIRST 3D TILTED ORBIT (Angle 1: 65° / 25° Clockwise) ── */}
      {/* "بتلف حوالين بعضها" — Tilted plane weaving in 3D space */}
      <div
        className="absolute inset-2 rounded-full pointer-events-none"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className={`w-full h-full rounded-full border-2 border-dashed border-[#C51F24]/40 dark:border-[#E82C32]/50 ${
            !isReducedMotion ? 'animate-orbit-3d-1' : ''
          }`}
          style={{
            boxShadow: '0 0 14px rgba(197,31,36,0.18)',
          }}
        >
          {/* Crimson Orb traveling on 3D plane */}
          <span
            className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#C51F24] dark:bg-[#E82C32]"
            style={{
              boxShadow: '0 0 12px #C51F24, 0 0 20px #E82C32',
              transform: 'translateZ(10px)',
            }}
          />
          {/* Opposite Sand Gold bead */}
          <span
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#D8C6AE] dark:bg-[#FAF7F2]"
            style={{
              boxShadow: '0 0 8px #D8C6AE',
              transform: 'translateZ(-10px)',
            }}
          />
        </div>
      </div>

      {/* ── 4. SECOND 3D TILTED ORBIT (Angle 2: 65° / -35° Counter-Clockwise) ── */}
      {/* Crossing the first orbit in 3D perspective to create the intertwined rotation */}
      <div
        className="absolute inset-2 rounded-full pointer-events-none"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className={`w-full h-full rounded-full border border-[#087D91]/40 dark:border-[#12A4BC]/50 ${
            !isReducedMotion ? 'animate-orbit-3d-2' : ''
          }`}
          style={{
            boxShadow: '0 0 14px rgba(8,125,145,0.18)',
          }}
        >
          {/* Glazed Teal Orb traveling on the crossing plane */}
          <span
            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-[#087D91] dark:bg-[#12A4BC]"
            style={{
              boxShadow: '0 0 12px #087D91, 0 0 20px #12A4BC',
              transform: 'translateZ(12px)',
            }}
          />
          {/* Terracotta Copper bead on the other side */}
          <span
            className="absolute top-1/2 -left-1 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#8B4935] dark:bg-[#DA7960]"
            style={{
              boxShadow: '0 0 8px #8B4935',
              transform: 'translateZ(-8px)',
            }}
          />
        </div>
      </div>

      {/* ── 5. THIRD COMPLEMENTARY 3D ORBIT (Angle 3: 25° / 65°) ── */}
      {/* Adds deep orbital depth so all three weave around each other */}
      <div
        className="absolute inset-4 rounded-full pointer-events-none"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className={`w-full h-full rounded-full border border-[#8B4935]/35 dark:border-[#DA7960]/45 ${
            !isReducedMotion ? 'animate-orbit-3d-3' : ''
          }`}
        >
          {/* Terracotta Node */}
          <span
            className="absolute bottom-1 right-2 w-2 h-2 rounded-full bg-[#8B4935] dark:bg-[#DA7960]"
            style={{ boxShadow: '0 0 6px #8B4935' }}
          />
          {/* Sand Gold Node */}
          <span
            className="absolute top-1 left-2 w-2 h-2 rounded-full bg-[#D8C6AE] dark:bg-[#E8DAC8]"
            style={{ boxShadow: '0 0 6px #D8C6AE' }}
          />
        </div>
      </div>

      {/* ── 6. COUNTER-ROTATING INNER CONCENTRIC LASER RING ── */}
      <div
        className={`absolute inset-6 rounded-full border border-sand/40 dark:border-sand/30 ${
          !isReducedMotion ? 'animate-orbit-z-reverse' : ''
        }`}
      >
        {/* 4 Cardinal Diamond Pointers */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-[#C51F24]" />
        <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 rotate-45 bg-[#087D91]" />
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-[#8B4935]" />
        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-1.5 h-1.5 rotate-45 bg-[#D8C6AE]" />
      </div>

      {/* ── 7. CENTRAL FLOATING SANCTUARY (MEDALLION) ── */}
      <motion.div
        animate={{
          scale: isSuccess ? [1, 1.15, 1.05] : isVerifying ? [1, 1.08, 1] : [1, 1.03, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: isVerifying ? 1.2 : 3,
          ease: 'easeInOut',
        }}
        className="relative z-10 flex items-center justify-center rounded-2xl sm:rounded-3xl p-[2px] shadow-xl"
        style={{
          width: coreSize,
          height: coreSize,
          background: isSuccess
            ? 'linear-gradient(135deg, #12A4BC 0%, #34A853 100%)'
            : isVerifying
            ? 'conic-gradient(from 0deg, #C51F24, #087D91, #8B4935, #D8C6AE, #C51F24)'
            : 'linear-gradient(135deg, #C51F24 0%, #8B4935 30%, #D8C6AE 70%, #087D91 100%)',
          boxShadow: isSuccess
            ? '0 0 24px rgba(52,168,83,0.45)'
            : '0 8px 24px rgba(8,125,145,0.22), 0 2px 6px rgba(197,31,36,0.18)',
        }}
      >
        {/* Core Shield / Lock Sanctuary Interior */}
        <div
          className="w-full h-full rounded-[14px] sm:rounded-[22px] flex items-center justify-center transition-colors duration-300 shadow-inner"
          style={{
            backgroundColor: 'var(--surface, #FAF7F2)',
          }}
        >
          {isSuccess ? (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            >
              <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 dark:text-emerald-400" />
            </motion.div>
          ) : isVerifying ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            >
              <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-[#087D91] dark:text-[#12A4BC]" />
            </motion.div>
          ) : digitCount === 6 ? (
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-[#C51F24] dark:text-[#E82C32]" />
            </motion.div>
          ) : (
            <Lock className="w-5 h-5 sm:w-7 sm:h-7 text-foreground/80" />
          )}
        </div>
      </motion.div>

      {/* ── 8. DIGIT ENTRY ENERGY RAYS (Dynamic based on digitCount) ── */}
      {digitCount > 0 && !isSuccess && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className="w-24 h-24 rounded-full border border-teal-500/30 animate-ping"
            style={{
              animationDuration: `${Math.max(1.2, 3 - digitCount * 0.3)}s`,
            }}
          />
        </div>
      )}
    </div>
  );
};
