'use client';

import GradientWaves from './GradientWaves';

export default function BackgroundWaves({
  horizonColor = '#000000',
  waveColor = '#1c1917',
  crestColor = '#fde047',
  speed = 0.22,
  amplitude = 1.8,
  waveScale = 0.5,
  waveRatio = 0.85,
  swell = 25,
  turbulence = 12,
  tilt = 1.05,
  zoom = 1.0,
  height = 4.8,
  fogDepth = 16,
  detail = 'low',
  brightness = 0.9,
  opacity = 0.65,
  mouseInteraction = true,
  parallaxStrength = 0.3,
  grain = false,
  grainIntensity = 0,
  dpr = 1.0,
  className = '',
  style = {}
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        ...style
      }}
      className={`app-background-waves ${className}`.trim()}
    >
      <GradientWaves
        horizonColor={horizonColor}
        waveColor={waveColor}
        crestColor={crestColor}
        speed={speed}
        amplitude={amplitude}
        waveScale={waveScale}
        waveRatio={waveRatio}
        swell={swell}
        turbulence={turbulence}
        tilt={tilt}
        zoom={zoom}
        height={height}
        fogDepth={fogDepth}
        detail={detail}
        brightness={brightness}
        opacity={opacity}
        mouseInteraction={mouseInteraction}
        parallaxStrength={parallaxStrength}
        grain={grain}
        grainIntensity={grainIntensity}
        dpr={dpr}
      />
    </div>
  );
}
