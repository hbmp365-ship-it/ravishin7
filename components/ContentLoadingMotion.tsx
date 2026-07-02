import React from 'react';
import Lottie from 'lottie-react';
import appIconMotion from '../assets/app-icon-motion.json';

type ContentLoadingMotionProps = {
  className?: string;
};

export const ContentLoadingMotion: React.FC<ContentLoadingMotionProps> = ({ className = '' }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center h-full min-h-[calc(100vh-20rem)] ${className}`}
      role="img"
      aria-label="TeeShot"
    >
      <Lottie
        animationData={appIconMotion}
        loop
        autoplay
        className="h-40 w-40 opacity-40"
        aria-hidden
      />
    </div>
  );
};
