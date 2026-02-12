import React, { useRef } from 'react';


interface CustomImageUploadProps {
    onImageSelect: (imageData: string) => void;
    className?: string;
}

/**
 * CustomImageUpload - A component for Pro users to upload custom images as nodes
 * The uploaded image will be converted to base64 and can be used as a full node in the diagram
 */
const CustomImageUpload: React.FC<CustomImageUploadProps> = ({ onImageSelect, className = '' }) => {

    const fileInputRef = useRef<HTMLInputElement>(null);


    const isPremiumUser = true; // Always true for desktop app

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            onImageSelect(base64);
        };
        reader.readAsDataURL(file);

        // Reset input for re-upload
        e.target.value = '';
    };

    const handleClick = () => {
        if (!isPremiumUser) {
            // Could show upgrade modal here
            return;
        }
        fileInputRef.current?.click();
    };

    if (!isPremiumUser) {
        return (
            <div className={`relative ${className}`}>
                <button
                    disabled
                    className="w-full p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-amber-700 flex items-center justify-center gap-2 opacity-80 cursor-not-allowed"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="font-medium text-sm">Custom Images - Pro Feature</span>
                </button>
                <span className="block text-xs text-center mt-1 text-amber-600">Upgrade to Pro to unlock</span>
            </div>
        );
    }

    return (
        <div className={className}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/gif, image/webp, image/svg+xml"
                onChange={handleFileSelect}
                className="hidden"
            />
            <button
                onClick={handleClick}
                className="w-full p-4 bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-dashed border-violet-300 rounded-xl hover:border-violet-500 hover:from-violet-100 hover:to-purple-100 transition-all flex flex-col items-center justify-center gap-2 group"
            >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <span className="font-semibold text-violet-700">Upload Custom Image</span>
                <span className="text-xs text-violet-500">PNG, JPG, GIF, WebP, SVG (max 5MB)</span>
            </button>
        </div>
    );
};

export default CustomImageUpload;
