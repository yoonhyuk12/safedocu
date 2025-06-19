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
          
          <div className="mt-8 h-[calc(100vh-5rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <a 
              href="https://krctbmform.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 px-4 text-lg hover:bg-gray-100 rounded-lg transition-colors"
            >
              AI-TBM 입력하기
            </a>
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSd2u_GP-RE7jXmUXENi9lNHez3-U-FHz_GjhOjO90-D64ipjw/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 px-4 text-lg hover:bg-gray-100 rounded-lg transition-colors mt-2"
            >
              구글폼 안전서류 점검(삭제 예정)
            </a>
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSeSTpnRsOBiy0myufl0itGdeDeVzfkYWeybqBhR7ThDef5HHw/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 px-4 text-lg hover:bg-gray-100 rounded-lg transition-colors mt-2"
            >
              구글폼 품질서류 점검
            </a>
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSdY1beSxNGj6niH6_jG7onccyQsUoIBfldYbIWsbMkc7VoQKA/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 px-4 text-lg hover:bg-gray-100 rounded-lg transition-colors mt-2"
            >
              구글폼 시공서류 점검
            </a>
            <a 
              href="https://docs.google.com/spreadsheets/d/1eIwB1Jg6TaHONWPN5lCOJWwD5oRNg7qgmSSBEd2OP_0/edit?gid=0#gid=0"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 px-4 text-lg hover:bg-gray-100 rounded-lg transition-colors mt-2"
            >
              안전서류 점검 결과(구글시트)
            </a>
            <a 
              href="https://chatgpt.com/g/g-uhvOsghT3-hangugnongeocongongsa-wiheomseongpyeongga-jagseong-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 px-4 text-lg hover:bg-gray-100 rounded-lg transition-colors mt-2"
            >
              위험성평가 작성 GPTS AI
            </a>
            <a 
              href="https://chatgpt.com/g/g-nsUeMuOdM-nongeocongongsa-geonseol-anjeonjeomgeom-doumi"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 px-4 text-lg hover:bg-gray-100 rounded-lg transition-colors mt-2"
            >
              안전점검 GPTS AI
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 