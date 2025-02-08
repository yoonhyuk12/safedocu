'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* 오버레이 */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* 사이드바 */}
      <div 
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
          
          <div className="mt-8">
            <a 
              href="https://krctbmform.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 px-4 text-lg hover:bg-gray-100 rounded-lg transition-colors"
            >
              AI-TBM 입력하기
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 