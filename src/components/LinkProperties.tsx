import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from '../types';

interface LinkPropertiesProps {
  selectedLink: Link | null;
  onUpdateLink: (linkId: string, updates: Partial<Link>) => void;
  onClose: () => void;
}

interface LinkStyleConfig {
  curvature: number;        // 0-100 (% of straight line distance)
  offsetDistance: number;   // Distance from center line (pixels)
  arrowheadStyle: 'default' | 'filled' | 'outlined' | 'none';
  lineStyle: 'straight' | 'curved' | 'elbow' | 'orthogonal';
  startMarker: boolean;
  endMarker: boolean;
  strokeWidth: number;      // 1-10 pixels
  color: string;           // Hex color code
  dashPattern: string;     // e.g., "5,5" or "10,5,2,5"
}

const DEFAULT_LINK_STYLE: LinkStyleConfig = {
  curvature: 30,
  offsetDistance: 20,
  arrowheadStyle: 'default',
  lineStyle: 'curved',
  startMarker: false,
  endMarker: true,
  strokeWidth: 2,
  color: '#4F46E5',
  dashPattern: 'none'
};

const LinkProperties: React.FC<LinkPropertiesProps> = ({ 
  selectedLink, 
  onUpdateLink,
  onClose 
}) => {
  const [styleConfig, setStyleConfig] = useState<LinkStyleConfig>(DEFAULT_LINK_STYLE);
  const [customAngle, setCustomAngle] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (selectedLink) {
      // Initialize with existing link properties or defaults
      setStyleConfig({
        curvature: selectedLink.curvature || DEFAULT_LINK_STYLE.curvature,
        offsetDistance: selectedLink.offsetDistance || DEFAULT_LINK_STYLE.offsetDistance,
        arrowheadStyle: selectedLink.arrowheadStyle || DEFAULT_LINK_STYLE.arrowheadStyle,
        lineStyle: selectedLink.lineStyle || DEFAULT_LINK_STYLE.lineStyle,
        startMarker: selectedLink.startMarker || DEFAULT_LINK_STYLE.startMarker,
        endMarker: selectedLink.endMarker !== undefined ? selectedLink.endMarker : DEFAULT_LINK_STYLE.endMarker,
        strokeWidth: selectedLink.strokeWidth || DEFAULT_LINK_STYLE.strokeWidth,
        color: selectedLink.color || DEFAULT_LINK_STYLE.color,
        dashPattern: selectedLink.dashPattern || DEFAULT_LINK_STYLE.dashPattern
      });
      setCustomAngle(selectedLink.angle || 0);
    }
  }, [selectedLink]);

  const handlePropertyChange = (property: keyof LinkStyleConfig, value: any) => {
    const newConfig = { ...styleConfig, [property]: value };
    setStyleConfig(newConfig);
    
    if (selectedLink) {
      onUpdateLink(selectedLink.id, {
        curvature: newConfig.curvature,
        offsetDistance: newConfig.offsetDistance,
        arrowheadStyle: newConfig.arrowheadStyle,
        lineStyle: newConfig.lineStyle,
        startMarker: newConfig.startMarker,
        endMarker: newConfig.endMarker,
        strokeWidth: newConfig.strokeWidth,
        color: newConfig.color,
        dashPattern: newConfig.dashPattern,
        angle: customAngle
      });
    }
  };

  if (!selectedLink) return null;

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 border-l border-gray-200"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Link Properties</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Basic Style Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Basic Style</h4>
            <div className="space-y-4">
              {/* Color Picker */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={styleConfig.color}
                    onChange={(e) => handlePropertyChange('color', e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={styleConfig.color}
                    onChange={(e) => handlePropertyChange('color', e.target.value)}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>

              {/* Stroke Width */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Stroke Width: {styleConfig.strokeWidth}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={styleConfig.strokeWidth}
                  onChange={(e) => handlePropertyChange('strokeWidth', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Line Style */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Line Style</label>
                <select
                  value={styleConfig.lineStyle}
                  onChange={(e) => handlePropertyChange('lineStyle', e.target.value as any)}
                  className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                >
                  <option value="straight">Straight</option>
                  <option value="curved">Curved</option>
                  <option value="elbow">Elbow</option>
                  <option value="orthogonal">Orthogonal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Arrowheads Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Arrowheads</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={styleConfig.startMarker}
                  onChange={(e) => handlePropertyChange('startMarker', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-xs text-gray-600">Start Marker</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={styleConfig.endMarker}
                  onChange={(e) => handlePropertyChange('endMarker', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-xs text-gray-600">End Marker</span>
              </label>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Style</label>
                <select
                  value={styleConfig.arrowheadStyle}
                  onChange={(e) => handlePropertyChange('arrowheadStyle', e.target.value as any)}
                  className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                >
                  <option value="default">Default</option>
                  <option value="filled">Filled</option>
                  <option value="outlined">Outlined</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full text-left text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700">Advanced Styling</h4>
              
              {/* Curvature */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Curvature: {styleConfig.curvature}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={styleConfig.curvature}
                  onChange={(e) => handlePropertyChange('curvature', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Offset Distance */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Offset Distance: {styleConfig.offsetDistance}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={styleConfig.offsetDistance}
                  onChange={(e) => handlePropertyChange('offsetDistance', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Dash Pattern */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Dash Pattern</label>
                <input
                  type="text"
                  value={styleConfig.dashPattern}
                  onChange={(e) => handlePropertyChange('dashPattern', e.target.value)}
                  placeholder="e.g., 5,5 or 10,5,2,5"
                  className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                />
              </div>

              {/* Custom Angle */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Custom Angle: {customAngle}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={customAngle}
                  onChange={(e) => {
                    const angle = parseInt(e.target.value);
                    setCustomAngle(angle);
                    handlePropertyChange('angle' as any, angle);
                  }}
                  className="w-full mb-2"
                />
                <input
                  type="number"
                  min="0"
                  max="360"
                  value={customAngle}
                  onChange={(e) => {
                    const angle = parseInt(e.target.value) || 0;
                    setCustomAngle(angle);
                    handlePropertyChange('angle' as any, angle);
                  }}
                  className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                />
              </div>
            </div>
          )}

          {/* Reset Button */}
          <div className="pt-4">
            <button
              onClick={() => {
                setStyleConfig(DEFAULT_LINK_STYLE);
                setCustomAngle(0);
                if (selectedLink) {
                  onUpdateLink(selectedLink.id, DEFAULT_LINK_STYLE as any);
                }
              }}
              className="w-full px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LinkProperties;