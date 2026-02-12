
import React from 'react';
import '../style.css';

const TitleBar: React.FC = () => {

    return (
        <div className="flex items-center justify-between h-8 w-full bg-transparent select-none z-50 fixed top-0 left-0 pointer-events-none">
            {/* Drag Region - invisible but draggable */}
            <div
                className="flex-1 h-full pointer-events-auto"
                style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            />

            {/* Window Controls */}
            {/* Window Controls Removed (Using Native Frame) */}
        </div>
    );
};

export default TitleBar;
