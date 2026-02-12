import React, { useState, useMemo } from 'react';
import { ICONS, preloadCloudIcons } from './content/iconConstants';
import { IconType } from '../types';
import ArchitectureIcon from './ArchitectureIcon';
import CustomImageUpload from './CustomImageUpload';

interface AddNodePanelProps {
    onSelectNodeType: (type: IconType) => void;
    onClose: () => void;
    onCustomImageUpload?: (imageData: string) => void;
}

const AddNodePanel: React.FC<AddNodePanelProps> = ({ onSelectNodeType, onClose, onCustomImageUpload }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [iconsLoaded, setIconsLoaded] = useState(false);

    // Preload icons on mount
    React.useEffect(() => {
        preloadCloudIcons().then(() => setIconsLoaded(true));
    }, []);

    const filteredIcons = useMemo(() => {
        const term = searchTerm.toLowerCase();
        // Filter out custom-image from the grid since it's handled separately
        return Object.keys(ICONS).filter(key => key.includes(term) && key !== 'custom-image');
    }, [searchTerm, iconsLoaded]);

    const handleImageUpload = (imageData: string) => {
        if (onCustomImageUpload) {
            onCustomImageUpload(imageData);
            onClose();
        }
    };

    // VIRTUALIZATION: Limit initial render count to prevent UI lag with 1000+ icons
    const [displayLimit, setDisplayLimit] = useState(60);

    // Reset limit when search changes
    useMemo(() => {
        setDisplayLimit(60);
    }, [searchTerm]);

    const visibleIcons = filteredIcons.slice(0, displayLimit);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 100) {
            setDisplayLimit(prev => Math.min(prev + 60, filteredIcons.length));
        }
    };

    return (
        <div className="h-full md:h-full w-screen max-w-[320px] md:w-80 bg-[var(--color-panel-bg)] md:border-r md:border-[var(--color-border)] p-4 flex flex-col rounded-t-2xl md:rounded-none">
            <div className="w-12 h-1.5 bg-[var(--color-border)] rounded-full mx-auto mb-4 md:hidden" />
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Add Node</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-[var(--color-button-bg-hover)]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Custom Image Upload - Pro Feature */}
            {onCustomImageUpload && (
                <div className="mb-4">
                    <CustomImageUpload onImageSelect={handleImageUpload} />
                </div>
            )}

            <input
                type="text"
                placeholder="Search components..."
                aria-label="Search components"
                autoComplete="off"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 mb-4 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
            />
            <div
                className="flex-1 overflow-y-auto pr-2"
                onScroll={handleScroll}
            >
                <div className="grid grid-cols-2 gap-2">
                    {visibleIcons.map(iconKey => (
                        <button
                            key={iconKey}
                            onClick={() => onSelectNodeType(iconKey as IconType)}
                            title={iconKey}
                            className="p-3 flex flex-col items-center justify-center space-y-2 bg-[var(--color-button-bg)] rounded-xl hover:bg-[var(--color-button-bg-hover)] transition-colors"
                        >
                            <ArchitectureIcon type={iconKey} className="w-8 h-8" />
                            <span className="text-xs text-center text-[var(--color-text-secondary)] truncate w-full">
                                {iconKey.replace('aws-', '').replace('gcp-', '').replace('azure-', '').replace(/-/g, ' ')}
                            </span>
                        </button>
                    ))}
                </div>
                {/* Loader or spacer could go here */}
                {visibleIcons.length < filteredIcons.length && (
                    <div className="p-4 text-center text-xs text-[var(--color-text-secondary)]">Loading more...</div>
                )}
            </div>
        </div>
    );
};

export default AddNodePanel;