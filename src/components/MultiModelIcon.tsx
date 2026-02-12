import React from 'react';

const GearIcon: React.FC<{ className?: string, gradId: string }> = ({ className, gradId }) => (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path
            fill={`url(#${gradId})`}
            stroke="#fbcfe8"
            strokeWidth="0.5"
            filter="url(#gear-shadow-filter)"
            d="M 50,6 L 58,11 L 62,20 L 71,22 L 75,30 L 82,35 L 85,42 L 85,58 L 82,65 L 75,70 L 71,78 L 62,80 L 58,89 L 50,94 L 42,89 L 38,80 L 29,78 L 25,70 L 18,65 L 15,58 L 15,42 L 18,35 L 25,30 L 29,22 L 38,20 L 42,11 Z M 50,22 A 28,28 0 1,0 50,78 A 28,28 0 1,0 50,22 Z"
        />
    </svg>
);

const MultiModelIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => {
    return (
        <div className={`engine-container ${className}`}>
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                    <radialGradient id="gear-grad-main" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="70%" stopColor="#f472b6" />
                        <stop offset="100%" stopColor="#ec4899" />
                    </radialGradient>
                     <radialGradient id="gear-grad-sub" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#f51393ff" />
                        <stop offset="70%" stopColor="#fbcfe8" />
                        <stop offset="100%" stopColor="#f9a8d4" />
                    </radialGradient>
                    <radialGradient id="gear-grad-sub" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#fc0a93ff" />
                        <stop offset="70%" stopColor="#fbcfe8" />
                        <stop offset="100%" stopColor="#f9a8d4" />
                    </radialGradient>
                    <filter id="gear-shadow-filter" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.2" />
                    </filter>
                </defs>
            </svg>
            <GearIcon className="gear gear-main" gradId="gear-grad-main" />
            <GearIcon className="gear gear-sub-1" gradId="gear-grad-sub" />
            <GearIcon className="gear gear-sub-2" gradId="gear-grad-sub" />
        </div>
    );
};

export default MultiModelIcon;
