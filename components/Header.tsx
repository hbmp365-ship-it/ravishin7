
import React from 'react';
import { InstagramIcon, BlogIcon, YouTubeIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-white backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <svg className="w-12 h-12 text-[#004B49]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
              <path d="M16.24 7.76C15.07 6.59 13.53 6 12 6v6l-4.24 4.24c2.34 2.34 6.14 2.34 8.48 0 2.34-2.34 2.34-6.14 0-8.48z" fill="currentColor" opacity="0.6"/>
              <path d="M12 4c-1.57 0-3.04.64-4.12 1.73L12 10V4z" fill="#004B49"/>
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
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-200 hover:scale-105"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#833AB4" />
                    <stop offset="50%" stopColor="#E1306C" />
                    <stop offset="100%" stopColor="#F77737" />
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#instagram-gradient)"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="white"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="white" strokeWidth="2" strokeLinecap="round"></line>
              </svg>
              <span className="text-sm font-medium">티샷 인스타</span>
            </a>
            
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-200 hover:scale-105"
            >
              <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm font-medium">티샷 페이스북</span>
            </a>
            
            <a
              href="https://blog.naver.com/teeshotgolf-"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-200 hover:scale-105"
            >
              <BlogIcon className="w-4 h-4" style={{ color: '#03C75A' }} />
              <span className="text-sm font-medium">티샷 블로그</span>
            </a>
            
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-200 hover:scale-105"
            >
              <svg className="w-4 h-4" fill="#FF6600" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 4v8.82c0 4.54-3.07 8.79-8 9.82-4.93-1.03-8-5.28-8-9.82V8.18l8-4z"/>
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
              </svg>
              <span className="text-sm font-medium">티샷 카페</span>
            </a>
            
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-200 hover:scale-105"
            >
              <svg className="w-4 h-4" fill="#00C73C" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
              <span className="text-sm font-medium">티샷 밴드</span>
            </a>
            
            <a
              href="https://www.youtube.com/@%ED%8B%B0%EC%83%B7%EC%88%8F%EC%B8%A0"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-200 hover:scale-105"
            >
              <YouTubeIcon className="w-4 h-4 text-[#FF0000]" />
              <span className="text-sm font-medium">티샷 유튜브</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
