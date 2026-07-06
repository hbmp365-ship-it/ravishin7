import React from 'react';
import { ParticleTextCanvas } from './ParticleTextCanvas';

const CONTENT_PARTICLE_GRAY: [number, number, number, number] = [156, 163, 175, 255];

export const ContentLoadingMotion: React.FC = () => {
  return (
    <div className="relative h-[min(400px,46%)] w-full max-w-xl">
      <ParticleTextCanvas
        lines={['TEESHOT', 'DESIGN']}
        sizeScale={0.72}
        particleColor={CONTENT_PARTICLE_GRAY}
        autoAnimate
        idleOrbitScale={0.2}
        className="absolute inset-0"
      />
    </div>
  );
};
