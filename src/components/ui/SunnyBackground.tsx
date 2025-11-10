/**
 * SunnyBackground Component
 * 
 * Reusable background component featuring the claymation classroom scene.
 * Creates warmth and continuity across transitional and low-content pages.
 */

'use client';

import React from 'react';

interface SunnyBackgroundProps {
  children: React.ReactNode;
  opacity?: number; // 0-1, default 0.15
  overlay?: boolean; // Add white overlay for better contrast
  className?: string;
}

export function SunnyBackground({
  children,
  opacity = 0.15,
  overlay = true,
  className = '',
}: SunnyBackgroundProps) {
  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Background Image */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: opacity,
        }}
        aria-hidden="true"
      />

      {/* Optional Overlay for Better Contrast */}
      {overlay && (
        <div
          className="fixed inset-0 z-0 bg-gradient-to-b from-white/80 via-white/60 to-white/80"
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Lightweight version for modals and small components
 */
export function SunnyBackgroundLight({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        backgroundImage: 'url(/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#f8f4f2',
      }}
    >
      <div className="absolute inset-0 bg-white/90" aria-hidden="true" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
