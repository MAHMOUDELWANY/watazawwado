import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';

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
 * Mesmerizing 3D Celestial Gyroscopic Orbital Animation ("بتلف حوالين بعضها")
 * Concentric and intersecting rings revolving, tumbling and interlooping around each other in 3D,
 * tuned to the 4 architectural heritage colors of the academy:
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
  const pxSize = size === 'sm' ? 148 : size === 'lg' ? 228 : 188;
  const coreSize = size === 'sm' ? 54 : size === 'lg' ? 78 : 66;

  // Dynamic scale and glow depending on filled digits
  const energyScale = isVerifying ? 1.18 : 1 + (digitCount / 6) * 0.14;

  return (
    <div
      role="img"
      aria-label="Celestial security orbit animation"
      className={`relative inline-flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{
        width: pxSize,
        height: pxSize,
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* ── 1. AMBIENT ATMOSPHERIC RADIAL GLOW ── */}
      <div
        className={`absolute inset-0 rounded-full ${
          isVerifying ? 'animate-verification-surge' : 'animate-pulse-glow'
        }`}
        style={{
          background: isSuccess
            ? 'radial-gradient(circle, rgba(18,164,188,0.45) 0%, rgba(52,168,83,0.3) 45%, transparent 75%)'
            : isVerifying
            ? 'radial-gradient(circle, rgba(197,31,36,0.45) 0%, rgba(8,125,145,0.4) 45%, rgba(139,73,53,0.25) 65%, transparent 80%)'
            : 'radial-gradient(circle, rgba(8,125,145,0.26) 0%, rgba(197,31,36,0.2) 35%, rgba(139,73,53,0.16) 60%, transparent 75%)',
          filter: 'blur(22px)',
          transform: `scale(${energyScale})`,
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* ── 2. OUTER PLANAR ASTROLABE COMPASS RING (Clockwise) ── */}
      <div
        className={`absolute inset-1 rounded-full border border-teal-500/25 dark:border-teal-400/30 ${
          !isReducedMotion
            ? isVerifying
              ? 'animate-orbit-z-fast'
              : 'animate-orbit-z'
            : ''
        }`}
        style={{
          boxShadow: isVerifying
            ? '0 0 16px rgba(8,125,145,0.4), inset 0 0 12px rgba(8,125,145,0.25)'
            : 'inset 0 0 12px rgba(8,125,145,0.1)',
        }}
      >
        {/* Satellites on outer ring */}
        {/* Node 1: Glazed Teal Top */}
        <span
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#087D91] dark:bg-[#12A4BC]"
          style={{ boxShadow: '0 0 12px #087D91, 0 0 20px #12A4BC' }}
        />
        {/* Node 2: Andalusian Crimson Bottom */}
        <span
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#C51F24] dark:bg-[#E82C32]"
          style={{ boxShadow: '0 0 12px #C51F24, 0 0 20px #E82C32' }}
        />
        {/* Dashed astronomical ring guide */}
        <div className="absolute inset-2 rounded-full border border-dashed border-[#D8C6AE]/35 dark:border-[#D8C6AE]/25" />
      </div>

      {/* ── 3. FIRST 3D GYROSCOPIC RING (X/Y Revolving Plane) ── */}
      {/* "بتلف حوالين بعضها" — Tumbles across X/Y axis in 3D */}
      <div
        className="absolute inset-2.5 rounded-full pointer-events-none"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className={`w-full h-full rounded-full border-2 border-[#C51F24]/50 dark:border-[#E82C32]/60 ${
            !isReducedMotion
              ? isVerifying
                ? 'animate-orbit-3d-1-fast'
                : 'animate-orbit-3d-1'
              : ''
          }`}
          style={{
            boxShadow: isVerifying
              ? '0 0 22px rgba(197,31,36,0.6), inset 0 0 10px rgba(197,31,36,0.3)'
              : '0 0 14px rgba(197,31,36,0.25)',
          }}
        >
          {/* Crimson Orb traveling on 3D plane */}
          <span
            className="absolute top-0 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#C51F24] dark:bg-[#E82C32]"
            style={{
              boxShadow: '0 0 14px #C51F24, 0 0 24px #E82C32',
              transform: 'translateZ(14px)',
            }}
          />
          {/* Opposite Sand Gold bead */}
          <span
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#D8C6AE] dark:bg-[#FAF7F2]"
            style={{
              boxShadow: '0 0 10px #D8C6AE',
              transform: 'translateZ(-14px)',
            }}
          />
        </div>
      </div>

      {/* ── 4. SECOND 3D GYROSCOPIC RING (Y/Z Crossing Plane) ── */}
      {/* Intersects Ring 1 in 3D space creating the intertwining motion */}
      <div
        className="absolute inset-2.5 rounded-full pointer-events-none"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className={`w-full h-full rounded-full border-2 border-[#087D91]/50 dark:border-[#12A4BC]/60 ${
            !isReducedMotion
              ? isVerifying
                ? 'animate-orbit-3d-2-fast'
                : 'animate-orbit-3d-2'
              : ''
          }`}
          style={{
            boxShadow: isVerifying
              ? '0 0 22px rgba(8,125,145,0.6), inset 0 0 10px rgba(8,125,145,0.3)'
              : '0 0 14px rgba(8,125,145,0.25)',
          }}
        >
          {/* Glazed Teal Orb */}
          <span
            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#087D91] dark:bg-[#12A4BC]"
            style={{
              boxShadow: '0 0 14px #087D91, 0 0 24px #12A4BC',
              transform: 'translateZ(16px)',
            }}
          />
          {/* Terracotta bead */}
          <span
            className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#8B4935] dark:bg-[#DA7960]"
            style={{
              boxShadow: '0 0 10px #8B4935',
              transform: 'translateZ(-16px)',
            }}
          />
        </div>
      </div>

      {/* ── 5. THIRD 3D GYROSCOPIC RING (Diagonal Tilt Plane) ── */}
      {/* Weaves between the first two rings */}
      <div
        className="absolute inset-4.5 rounded-full pointer-events-none"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className={`w-full h-full rounded-full border border-dashed border-[#8B4935]/50 dark:border-[#DA7960]/60 ${
            !isReducedMotion
              ? isVerifying
                ? 'animate-orbit-3d-3-fast'
                : 'animate-orbit-3d-3'
              : ''
          }`}
        >
          {/* Cedar Terracotta Node */}
          <span
            className="absolute bottom-1 right-2 w-2.5 h-2.5 rounded-full bg-[#8B4935] dark:bg-[#DA7960]"
            style={{
              boxShadow: '0 0 8px #8B4935',
              transform: 'translateZ(10px)',
            }}
          />
          {/* Sand Gold Node */}
          <span
            className="absolute top-1 left-2 w-2.5 h-2.5 rounded-full bg-[#D8C6AE] dark:bg-[#E8DAC8]"
            style={{
              boxShadow: '0 0 8px #D8C6AE',
              transform: 'translateZ(-10px)',
            }}
          />
        </div>
      </div>

      {/* ── 6. COUNTER-ROTATING INNER LASER RING (Counter-Clockwise) ── */}
      <div
        className={`absolute inset-6.5 rounded-full border border-[#D8C6AE]/50 dark:border-[#D8C6AE]/40 ${
          !isReducedMotion
            ? isVerifying
              ? 'animate-orbit-z-reverse-fast'
              : 'animate-orbit-z-reverse'
            : ''
        }`}
      >
        {/* 4 Cardinal Diamond Markers */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#C51F24]" />
        <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 rotate-45 bg-[#087D91]" />
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#8B4935]" />
        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rotate-45 bg-[#D8C6AE]" />
      </div>

      {/* ── 7. CENTRAL FLOATING SANCTUARY (MEDALLION) ── */}
      <motion.div
        animate={{
          scale: isSuccess ? [1, 1.2, 1.08] : isVerifying ? [1, 1.12, 0.98, 1.12] : [1, 1.04, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: isVerifying ? 0.9 : 3,
          ease: 'easeInOut',
        }}
        className="relative z-10 flex items-center justify-center rounded-2xl sm:rounded-3xl p-[2.5px] shadow-2xl"
        style={{
          width: coreSize,
          height: coreSize,
          background: isSuccess
            ? 'linear-gradient(135deg, #12A4BC 0%, #34A853 100%)'
            : isVerifying
            ? 'conic-gradient(from 0deg, #C51F24, #087D91, #8B4935, #D8C6AE, #C51F24)'
            : 'linear-gradient(135deg, #C51F24 0%, #8B4935 30%, #D8C6AE 70%, #087D91 100%)',
          boxShadow: isSuccess
            ? '0 0 28px rgba(52,168,83,0.5)'
            : isVerifying
            ? '0 0 32px rgba(8,125,145,0.5), 0 0 20px rgba(197,31,36,0.45)'
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
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-[#087D91] dark:text-[#12A4BC]" />
            </motion.div>
          ) : digitCount === 6 ? (
            <motion.div
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-[#C51F24] dark:text-[#E82C32]" />
            </motion.div>
          ) : (
            <Lock className="w-5 h-5 sm:w-7 sm:h-7 text-foreground/80" />
          )}
        </div>
      </motion.div>

      {/* ── 8. DIGIT ENTRY ENERGY RAYS (Expands with every digit) ── */}
      {digitCount > 0 && !isSuccess && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className="w-24 h-24 rounded-full border border-teal-500/35 animate-ping"
            style={{
              animationDuration: `${Math.max(0.8, 2.6 - digitCount * 0.3)}s`,
            }}
          />
        </div>
      )}
    </div>
  );
};
