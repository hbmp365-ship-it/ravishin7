
import React from 'react';
import { InstagramIcon, BlogIcon, YouTubeIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-white backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <svg className="w-12 h-12 text-[#1FA77A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
              <path d="M16.24 7.76C15.07 6.59 13.53 6 12 6v6l-4.24 4.24c2.34 2.34 6.14 2.34 8.48 0 2.34-2.34 2.34-6.14 0-8.48z" fill="currentColor" opacity="0.6"/>
              <path d="M12 4c-1.57 0-3.04.64-4.12 1.73L12 10V4z" fill="#1FA77A"/>
            </svg>
            <h1 className="text-2xl font-bold text-black tracking-wide">
              TeeShot <span className="font-light text-gray-600">Content Generator V 0.1</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <a
              href="https://www.instagram.com/teeshot_official/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <InstagramIcon className="w-4 h-4" />
              <span className="text-sm font-medium">티샷 인스타</span>
            </a>
            
            <a
              href="https://blog.naver.com/teeshotgolf-"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#03C75A] text-white hover:bg-[#02B350] hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <BlogIcon className="w-4 h-4" />
              <span className="text-sm font-medium">티샷 블로그</span>
            </a>
            
            <a
              href="https://www.youtube.com/@%ED%8B%B0%EC%83%B7%EC%88%8F%EC%B8%A0"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#FF0000] text-white hover:bg-[#CC0000] hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <YouTubeIcon className="w-4 h-4" />
              <span className="text-sm font-medium">티샷 유튜브</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
