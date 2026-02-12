import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

import { InteractionMode } from './DiagramCanvas';

interface PlaygroundToolbarProps {
    interactionMode: InteractionMode;
    onSetInteractionMode: (mode: InteractionMode) => void;
    onAddContainer: (containerType?: 'tier' | 'vpc' | 'region' | 'availability-zone' | 'subnet' | 'rectangle' | 'triangle' | 'circle') => void;
    onFitToScreen: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onExport: (format: 'png' | 'html' | 'json') => void;
    onImport: () => void;
    isViewMode: boolean;
    onToggleViewMode: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    zoomLevel?: number;
}

// Define ToolButton component
const ToolButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
    isActive?: boolean;
    isDisabled?: boolean;
}> = ({ children, isActive, isDisabled = false, ...props }) => (
    <button
        {...props}
        className={`p-2 rounded-lg transition-colors flex flex-col items-center justify-center
            ${isActive
                ? 'bg-[var(--color-button-bg-selected)] text-[var(--color-text-primary)] border border-[var(--color-accent-text)]'
                : 'bg-[var(--color-button-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-button-bg-hover)]'}
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${props.className || ''}
        `}
        disabled={isDisabled}
    >
        {children}
    </button>
);

const PlaygroundToolbar: React.FC<PlaygroundToolbarProps> = (props) => {
    const { interactionMode, onSetInteractionMode, onAddContainer, onFitToScreen } = props;
    const { onUndo, onRedo, canUndo, canRedo, onExport, onImport, isViewMode, onToggleViewMode, onZoomIn, onZoomOut, zoomLevel = 1 } = props;

    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const moreMenuRef = useRef<HTMLDivElement>(null);
    const [isContainerMenuOpen, setIsContainerMenuOpen] = useState(false);
    const containerMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setIsMoreMenuOpen(false);
            }
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
            if (containerMenuRef.current && !containerMenuRef.current.contains(event.target as Node)) {
                setIsContainerMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExportClick = (format: 'png' | 'html' | 'json') => {
        onExport(format);
        setIsExportMenuOpen(false);
    };

    const containerMenu = (
        <div className="relative" ref={containerMenuRef}>
            <ToolButton aria-label="Add Container" title="Add Container (B)" onClick={() => setIsContainerMenuOpen(p => !p)} className="w-14 h-14 md:w-12 md:h-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                </svg>
            </ToolButton>
            {isContainerMenuOpen && (
                <div className="absolute bottom-full mb-2 left-0 md:bottom-auto md:top-0 md:left-full md:ml-2 w-48 bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-xl shadow-lg p-1 z-30">
                    <a onClick={() => { onAddContainer('rectangle'); setIsContainerMenuOpen(false); }} className="block px-3 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-button-bg-hover)] rounded-md cursor-pointer flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current rounded-sm"></div>
                        Rectangle
                    </a>
                    <a onClick={() => { onAddContainer('triangle'); setIsContainerMenuOpen(false); }} className="block px-3 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-button-bg-hover)] rounded-md cursor-pointer flex items-center gap-2">
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-current"></div>
                        Triangle
                    </a>
                    <a onClick={() => { onAddContainer('circle'); setIsContainerMenuOpen(false); }} className="block px-3 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-button-bg-hover)] rounded-md cursor-pointer flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current rounded-full"></div>
                        Circle
                    </a>
                </div>
            )}
        </div>
    );

    const mobileMenu = (
        <div className="relative" ref={moreMenuRef}>
            <ToolButton aria-label="More Options" onClick={() => setIsMoreMenuOpen(p => !p)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 01-2 0 1 1 0 012 0zm7 0a1 1 0 01-2 0 1 1 0 012 0z" /></svg>
                <span className="text-xs mt-1">More</span>
            </ToolButton>
            <AnimatePresence>
                {isMoreMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-40 bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-xl shadow-lg p-1 z-30">
                        <button onClick={onFitToScreen} className="w-full text-left block px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-button-bg-hover)] rounded-md">Fit to Screen</button>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <div className="
            fixed bottom-0 left-0 right-0 z-40 
            md:relative md:h-full md:w-auto md:flex-col md:border-r md:p-3 md:space-y-3
            bg-[var(--color-panel-bg)] border-t border-[var(--color-border)] 
            flex justify-around items-center
        ">
            {/* --- Primary Tools --- */}
            <ToolButton aria-label="Select (V)" title="Select (V)" onClick={() => onSetInteractionMode('select')} isActive={interactionMode === 'select'} className="w-14 h-14 md:w-12 md:h-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
            </ToolButton>

            <ToolButton aria-label="Add Node (N)" title="Add Node (N)" onClick={() => onSetInteractionMode('addNode')} isActive={interactionMode === 'addNode'} className="w-14 h-14 md:w-12 md:h-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </ToolButton>

            {containerMenu}

            <div className="flex-grow hidden md:block" />

            {/* --- Secondary Tools (Desktop) --- */}
            <div className="hidden md:flex flex-col items-center space-y-3">
                {/* Zoom Controls */}
                <div className="flex flex-col items-center gap-1 bg-[var(--color-bg-input)] rounded-lg p-1 border border-[var(--color-border)]">
                    <ToolButton aria-label="Zoom In" title="Zoom In (+)" onClick={onZoomIn} className="w-8 h-8 !p-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    </ToolButton>
                    <span className="text-[10px] font-mono text-[var(--color-text-secondary)] select-none">
                        {Math.round(zoomLevel * 100)}%
                    </span>
                    <ToolButton aria-label="Zoom Out" title="Zoom Out (-)" onClick={onZoomOut} className="w-8 h-8 !p-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                    </ToolButton>
                </div>

                <div className="w-10/12 h-px bg-[var(--color-border)] my-1" />

                <ToolButton aria-label="Undo (Cmd+Z)" title="Undo (Cmd+Z)" onClick={onUndo} isDisabled={!canUndo} className="w-12 h-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
                </ToolButton>
                <ToolButton aria-label="Redo (Cmd+Shift+Z)" title="Redo (Cmd+Shift+Z)" onClick={onRedo} isDisabled={!canRedo} className="w-12 h-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 15l3-3m0 0l-3-3m3 3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </ToolButton>
                <div className="w-10/12 h-px bg-[var(--color-border)] my-1" />
                <ToolButton aria-label="Fit to Screen (F)" title="Fit to Screen (F)" onClick={onFitToScreen} className="w-12 h-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                </ToolButton>
                <div className="relative" ref={exportMenuRef}>
                    <ToolButton aria-label="Export" title="Export" onClick={() => setIsExportMenuOpen(prev => !prev)} className="w-12 h-12">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </ToolButton>
                    {isExportMenuOpen && (
                        <div className="absolute bottom-full left-0 mb-2 md:bottom-auto md:top-0 md:left-full md:ml-2 w-32 bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-xl shadow-lg p-1 z-20">
                            <a onClick={() => handleExportClick('png')} className="block px-3 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-button-bg-hover)] rounded-md cursor-pointer">PNG</a>
                            <a onClick={() => handleExportClick('html')} className="block px-3 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-button-bg-hover)] rounded-md cursor-pointer">HTML</a>
                            <a onClick={() => handleExportClick('json')} className="block px-3 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-button-bg-hover)] rounded-md cursor-pointer">JSON</a>
                        </div>
                    )}
                </div>
                <ToolButton aria-label="Import JSON" title="Import JSON" onClick={onImport} className="w-12 h-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </ToolButton>
                <ToolButton aria-label="View Mode" title="View Mode (Shift+V)" onClick={onToggleViewMode} isActive={isViewMode} className="w-12 h-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </ToolButton>

            </div>

            <div className="md:hidden">
                {mobileMenu}
            </div>

        </div>
    );
};

export default PlaygroundToolbar;