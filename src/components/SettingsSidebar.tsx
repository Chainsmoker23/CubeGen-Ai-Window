import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface SettingsSidebarProps {
  userApiKey: string | null;
  setUserApiKey: (key: string | null) => void;
  onNavigate: () => void; // Kept for compatibility but might handle navigation directly
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = () => {
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGoHome = () => {
    navigate('/dashboard');
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Menu Trigger Button */}
      {/* Draggable Container */}
      <motion.div
        className="fixed z-50 cursor-move"
        style={{ top: 16, left: 16 }}
        ref={menuRef}
        drag
        dragMomentum={false}
        dragConstraints={{ left: 0, right: window.innerWidth - 60, top: 0, bottom: window.innerHeight - 60 }}
        dragElastic={0}
        whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
      >
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`p-2 rounded-xl transition-all duration-200 shadow-sm border
            ${isMenuOpen
              ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200'
              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          title="Menu"
        >
          {/* Stylish "Cube/Menu" Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white/90 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl overflow-hidden p-1 flex flex-col gap-1 ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">

            {/* Home Option */}
            <button
              onClick={handleGoHome}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-colors text-left w-full group"
            >
              <div className="p-1.5 bg-emerald-100/50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              Back to Home
            </button>

          </div>
        )}
      </motion.div>

      {/* Backdrop */}
      {isMenuOpen && ( // Changed from isOpen to isMenuOpen for backdrop if needed, but actually the menu is small.
        // The previous code had a backdrop for the sidebar (isOpen). Since we removed the sidebar, we might not need this full backdrop.
        // But isMenuOpen uses clickOutside listener.
        // Let's remove the sidebar backdrop entirely.
        <></>
      )}

      {/* Sidebar - Removed */}
    </>
  );
};

export default SettingsSidebar;