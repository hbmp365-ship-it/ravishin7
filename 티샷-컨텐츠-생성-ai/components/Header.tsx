
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center space-x-3">
          <svg className="w-8 h-8 text-[#1FA77A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
            <path d="M16.24 7.76C15.07 6.59 13.53 6 12 6v6l-4.24 4.24c2.34 2.34 6.14 2.34 8.48 0 2.34-2.34 2.34-6.14 0-8.48z" fill="currentColor" opacity="0.6"/>
            <path d="M12 4c-1.57 0-3.04.64-4.12 1.73L12 10V4z" fill="#1FA77A"/>
          </svg>
          <h1 className="text-xl font-bold text-black tracking-wide">
            TeeShot <span className="font-light text-gray-600">Content Generator V 0.1</span>
          </h1>
        </div>
      </div>
    </header>
  );
};
