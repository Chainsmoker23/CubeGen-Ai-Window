import React, { useState, useEffect, useRef } from 'react';
import { ArchNode, Container, Link, NodeShape } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

import { BorderStyle, BorderStyleSelector, BorderWidthSelector } from './BorderOptions';

type Item = ArchNode | Container | Link;

interface PropertiesSidebarProps {
  item: Item | null;
  onPropertyChange: (itemId: string, newProps: Partial<Item>) => void;
  selectedCount: number;
  onClose?: () => void;
}

// ====================================================================================
// --- Shape Definitions for Custom Dropdown ---
// ====================================================================================

const ShapeIcon: React.FC<{ shape: NodeShape; className?: string }> = ({ shape, className = "w-5 h-5" }) => {
  const commonProps = {
    className: className,
    viewBox: "0 0 24 24",
    strokeWidth: "2",
    stroke: "currentColor",
    fill: "none",
    strokeLinecap: "round" as "round",
    strokeLinejoin: "round" as "round",
  };
  switch (shape) {
    case 'rectangle': return <svg {...commonProps}><rect x="3" y="6" width="18" height="12" rx="2" /></svg>;
    case 'rounded-rectangle': return <svg {...commonProps}><rect x="3" y="6" width="18" height="12" rx="6" /></svg>;
    case 'ellipse': return <svg {...commonProps}><ellipse cx="12" cy="12" rx="10" ry="6" /></svg>;
    case 'circle': return <svg {...commonProps}><circle cx="12" cy="12" r="8" /></svg>;
    case 'diamond': return <svg {...commonProps}><path d="M12 2L20 12L12 22L4 12Z" /></svg>;
    case 'triangle': return <svg {...commonProps}><path d="M12 2L22 22H2Z" /></svg>;
    case 'cylinder': return <svg {...commonProps}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" /></svg>;
    case 'cloud': return <svg {...commonProps}><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" /></svg>;
    case 'document': return <svg {...commonProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
    case 'folder': return <svg {...commonProps}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>;
    case 'actor': return <svg {...commonProps}><circle cx="12" cy="7" r="4" /><path d="M12 11v11m-4 0h8m-8-5h8" /></svg>;
    case 'hexagon': return <svg {...commonProps}><path d="M21 16V8l-6-4-6 4v8l6 4z" /></svg>;
    case 'pentagon': return <svg {...commonProps}><path d="M12 2l10 7.5L17 22H7L2 9.5z" /></svg>;
    case 'octagon': return <svg {...commonProps}><path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z" /></svg>;
    case 'parallelogram': return <svg {...commonProps}><path d="M21 4H7l-4 16h14l4-16z" /></svg>;
    case 'step': return <svg {...commonProps}><path d="M2 12l5 5 14-14" stroke="none" fill="currentColor" /><path d="M6 3h12v6h-6v6H6z" /></svg>;
    case 'tape': return <svg {...commonProps}><path d="M4 12c0-1.66 3.58-3 8-3s8 1.34 8 3-3.58 3-8 3-8-1.34-8-3z M4 6c0-1.66 3.58-3 8-3s8 1.34 8 3v1c-2 .6-5 1-8 1s-6-.4-8-1z M4 18v-1c2 .6 5 1 8 1s6-.4 8-1v1c0 1.66-3.58 3-8 3s-8-1.34-8-3z" /></svg>;
    case 'storage': return <svg {...commonProps}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" /></svg>;
    case 'component': return <svg {...commonProps}><path d="M2 9.5V12h1.5V9.5zM2 14.5V12h1.5v2.5zM20 10V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-4" /></svg>;
    case 'queue': return <svg {...commonProps}><circle cx="12" cy="12" r="8" /><path d="M8 12h8m-4-4l4 4-4 4" /></svg>;
    default: return <svg {...commonProps}><rect x="3" y="6" width="18" height="12" rx="2" /></svg>;
  }
};

const SHAPE_OPTIONS: { key: NodeShape; label: string }[] = [
  { key: 'rectangle', label: 'Rectangle' },
  { key: 'rounded-rectangle', label: 'Round Rect' },
  { key: 'ellipse', label: 'Ellipse' },
  { key: 'circle', label: 'Circle' },
  { key: 'diamond', label: 'Diamond' },
  { key: 'triangle', label: 'Triangle' },
  { key: 'parallelogram', label: 'Parallelogram' },
  { key: 'step', label: 'Step' },
  { key: 'hexagon', label: 'Hexagon' },
  { key: 'pentagon', label: 'Pentagon' },
  { key: 'octagon', label: 'Octagon' },
  { key: 'cylinder', label: 'Cylinder' },
  { key: 'storage', label: 'Storage' },
  { key: 'queue', label: 'Queue' },
  { key: 'cloud', label: 'Cloud' },
  { key: 'document', label: 'Document' },
  { key: 'folder', label: 'Folder' },
  { key: 'tape', label: 'Tape' },
  { key: 'actor', label: 'Actor' },
  { key: 'component', label: 'Component' },
];

const ShapeSelector: React.FC<{
  selectedShape: NodeShape;
  onSelectShape: (shape: NodeShape) => void;
}> = ({ selectedShape, onSelectShape }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = SHAPE_OPTIONS.find(opt => opt.key === selectedShape) || SHAPE_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          <ShapeIcon shape={selectedOption.key} />
          {selectedOption.label}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full mb-2 w-full max-h-60 overflow-y-auto bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-xl shadow-lg z-10 p-1"
          >
            {SHAPE_OPTIONS.map(option => (
              <button
                key={option.key}
                onClick={() => {
                  onSelectShape(option.key);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 p-2 text-left text-sm rounded-lg hover:bg-[var(--color-button-bg-hover)]"
              >
                <ShapeIcon shape={option.key} className="w-6 h-6 flex-shrink-0" />
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};



const PropertiesSidebar: React.FC<PropertiesSidebarProps> = ({ item, onPropertyChange, selectedCount, onClose }) => {
  // Mock user for Login-Free Mode
  const isPremiumUser = true; // Always true for desktop app

  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#ffffff');
  const [linkStyle, setLinkStyle] = useState<'solid' | 'dotted' | 'dashed' | 'double'>('solid');
  const [linkThickness, setLinkThickness] = useState<'thin' | 'medium' | 'thick'>('medium');
  const [arrowheadSize, setArrowheadSize] = useState<number>(1);
  const [arrowheadColor, setArrowheadColor] = useState<string>(''); // Empty means inherit
  const [nodeShape, setNodeShape] = useState<NodeShape>('rectangle');
  const [customIconSize, setCustomIconSize] = useState(80);
  const [shapeOpacity, setShapeOpacity] = useState(100);
  const [borderStyle, setBorderStyle] = useState<BorderStyle>('solid');
  const [borderWidth, setBorderWidth] = useState<'thin' | 'medium' | 'thick'>('medium');
  const [borderColor, setBorderColor] = useState('#000000');

  useEffect(() => {
    if (item) {
      if ('label' in item) {
        setLabel(item.label || '');
      }
      if ('description' in item) {
        setDescription(item.description || '');
      }
      if ('color' in item && item.color) {
        setColor(item.color);
      } else {
        if ('source' in item) setColor('#9ca3af');
        else setColor('#FFFFFF');
      }
      if ('style' in item && item.style) {
        setLinkStyle(item.style);
      }
      if ('thickness' in item && item.thickness) {
        setLinkThickness(item.thickness);
      }
      if ('arrowheadSize' in item && typeof item.arrowheadSize === 'number') {
        setArrowheadSize(item.arrowheadSize);
      } else {
        setArrowheadSize(1);
      }
      if ('arrowheadColor' in item && item.arrowheadColor) {
        setArrowheadColor(item.arrowheadColor);
      } else {
        setArrowheadColor('');
      }
      if ('shape' in item && item.shape) {
        setNodeShape(item.shape);
      } else if ('type' in item) {
        setNodeShape('rectangle');
      }
      if ('customIconSize' in item && typeof item.customIconSize === 'number') {
        setCustomIconSize(item.customIconSize);
      } else {
        setCustomIconSize(80); // Default
      }
      if ('borderStyle' in item && item.borderStyle) {
        setBorderStyle(item.borderStyle);
      } else {
        setBorderStyle('solid');
      }
      if ('borderWidth' in item && item.borderWidth) {
        setBorderWidth(item.borderWidth);
      } else {
        setBorderWidth('medium');
      }
      if ('borderColor' in item && item.borderColor) {
        setBorderColor(item.borderColor);
      } else {
        setBorderColor('#000000');
      }
      if ('shapeOpacity' in item && typeof item.shapeOpacity === 'number') {
        setShapeOpacity(item.shapeOpacity);
      } else {
        // Default: 0 for custom-image (no background), 100 for others
        setShapeOpacity('type' in item && item.type === 'custom-image' ? 0 : 100);
      }
    }
  }, [item]);

  const handlePropertyUpdate = (props: Partial<Item>) => {
    if (item) {
      onPropertyChange(item.id, props);
    }
  };



  const handleBlur = () => {
    if (item && 'label' in item && item.label !== label) {
      handlePropertyUpdate({ label });
    }
    if (item && 'description' in item && item.description !== description) {
      handlePropertyUpdate({ description });
    }
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handlePropertyUpdate({ customIcon: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
    // Clear the input value to allow re-uploading the same file
    e.target.value = '';
  };

  const handleRemoveIcon = () => {
    handlePropertyUpdate({ customIcon: null });
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value, 10);
    setCustomIconSize(newSize);
    handlePropertyUpdate({ customIconSize: newSize });
  };

  if (selectedCount > 1) {
    return (
      <div className="glass-panel rounded-2xl flex flex-col h-full items-center justify-center text-center text-[var(--color-text-secondary)] p-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" /></svg>
        <h3 className="mt-2 font-semibold text-[var(--color-text-primary)]">{selectedCount} items selected</h3>
        <p className="text-sm">Edit properties by selecting a single item.</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="glass-panel rounded-2xl flex flex-col h-full items-center justify-center text-center text-[var(--color-text-secondary)] p-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
        <h3 className="mt-2 font-semibold text-[var(--color-text-primary)]">Properties</h3>
        <p className="text-sm">Select an item on the canvas to view and edit its properties.</p>
      </div>
    );
  }

  const isLink = 'source' in item;
  const isNode = 'type' in item && !('childNodeIds' in item);

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col h-full glass-panel p-6 rounded-2xl overflow-y-auto"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Properties</h2>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-button-bg-hover)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>
      <div className="space-y-4">
        <div>
          <label htmlFor="label" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Label</label>
          <input
            id="label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleBlur}
            className="w-full p-2 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
          />
        </div>
        {!isLink && (
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleBlur}
              rows={4}
              className="w-full p-2 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] resize-none"
            />
          </div>
        )}
        {isNode && (
          <div>
            <label htmlFor="nodeShape" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Shape</label>
            <ShapeSelector
              selectedShape={nodeShape}
              onSelectShape={(newShape) => {
                setNodeShape(newShape);
                handlePropertyUpdate({ shape: newShape });
              }}
            />
          </div>
        )}
        {isNode && isPremiumUser && (
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Custom Icon</label>
            <input
              type="file"
              id="custom-icon-upload"
              className="hidden"
              accept="image/png, image/jpeg, image/svg+xml"
              onChange={handleIconUpload}
            />
            <label htmlFor="custom-icon-upload" className="w-full cursor-pointer text-center p-3 bg-transparent border border-dashed border-[var(--color-border)] rounded-xl hover:border-[var(--color-accent)] hover:text-[var(--color-accent-text)] transition flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span className="text-sm font-medium">Upload Image</span>
            </label>

            {(item as ArchNode).customIcon && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <label htmlFor="icon-size" className="font-medium text-[var(--color-text-secondary)]">Icon Size</label>
                  <span className="font-semibold">{customIconSize}%</span>
                </div>
                <input
                  id="icon-size"
                  type="range"
                  min="10"
                  max="100"
                  value={customIconSize}
                  onChange={handleSizeChange}
                  className="w-full h-2 bg-[var(--color-bg-input)] rounded-lg appearance-none cursor-pointer"
                />
                <button onClick={handleRemoveIcon} className="w-full text-center mt-4 text-sm font-semibold text-red-500 hover:bg-red-500/10 py-1 rounded-lg transition-colors">
                  Remove Custom Icon
                </button>
              </div>
            )}

            {/* Shape/Background Opacity for Custom Images */}
            {(item as ArchNode).type === 'custom-image' && (
              <div className="mt-4 p-3 bg-violet-50 rounded-xl border border-violet-100">
                <div className="flex items-center justify-between text-sm mb-2">
                  <label htmlFor="shape-opacity" className="font-medium text-violet-700">Background Opacity</label>
                  <span className="font-semibold text-violet-600">{shapeOpacity}%</span>
                </div>
                <input
                  id="shape-opacity"
                  type="range"
                  min="0"
                  max="100"
                  value={shapeOpacity}
                  onChange={(e) => {
                    const newOpacity = parseInt(e.target.value, 10);
                    setShapeOpacity(newOpacity);
                    handlePropertyUpdate({ shapeOpacity: newOpacity });
                  }}
                  className="w-full h-2 bg-violet-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-violet-500 mt-2">0% = Image only, 100% = With background</p>
              </div>
            )}
          </div>
        )}
        {!isLink && (
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Type</label>
            <p className="p-2 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-sm capitalize">{item.type}</p>
          </div>
        )}

        <div>
          <label htmlFor="color" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{isLink ? 'Link Color' : 'Fill Color'}</label>
          <div className="relative">
            <input
              id="color"
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                handlePropertyUpdate({ color: e.target.value });
              }}
              className="w-full p-1 h-10 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl cursor-pointer"
            />
          </div>
        </div>

        {!isLink && (
          <>
            <div>
              <label htmlFor="borderStyle" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Border Style</label>
              <BorderStyleSelector
                selectedStyle={borderStyle}
                onSelectStyle={(newStyle) => {
                  setBorderStyle(newStyle);
                  const borderProps: Partial<ArchNode | Container> = { borderStyle: newStyle };
                  handlePropertyUpdate(borderProps);
                }}
              />
            </div>
            <div>
              <label htmlFor="borderWidth" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Border Width</label>
              <BorderWidthSelector
                selectedWidth={borderWidth}
                onSelectWidth={(newWidth) => {
                  setBorderWidth(newWidth);
                  const borderProps: Partial<ArchNode | Container> = { borderWidth: newWidth };
                  handlePropertyUpdate(borderProps);
                }}
              />
            </div>
            <div>
              <label htmlFor="borderColor" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Border Color</label>
              <div className="relative">
                <input
                  id="borderColor"
                  type="color"
                  value={borderColor}
                  onChange={(e) => {
                    setBorderColor(e.target.value);
                    const borderProps: Partial<ArchNode | Container> = { borderColor: e.target.value };
                    handlePropertyUpdate(borderProps);
                  }}
                  className="w-full p-1 h-10 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl cursor-pointer"
                />
              </div>
            </div>
          </>
        )}

        {isLink && (
          <>
            <div>
              <label htmlFor="linkStyle" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Link Style</label>
              <select
                id="linkStyle"
                value={linkStyle}
                onChange={(e) => {
                  const newStyle = e.target.value as typeof linkStyle;
                  setLinkStyle(newStyle);
                  handlePropertyUpdate({ style: newStyle });
                }}
                className="w-full p-2 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
              >
                <option value="solid">Solid</option>
                <option value="dotted">Dotted</option>
                <option value="dashed">Dashed</option>
                <option value="double">Double</option>
              </select>
            </div>
            <div>
              <label htmlFor="linkThickness" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Thickness</label>
              <select
                id="linkThickness"
                value={linkThickness}
                onChange={(e) => {
                  const newThickness = e.target.value as typeof linkThickness;
                  setLinkThickness(newThickness);
                  handlePropertyUpdate({ thickness: newThickness });
                }}
                className="w-full p-2 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
              >
                <option value="thin">Thin</option>
                <option value="medium">Medium</option>
                <option value="thick">Thick</option>
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <label htmlFor="arrowheadSize" className="font-medium text-[var(--color-text-secondary)]">Arrowhead Size</label>
                <span className="font-semibold text-[var(--color-text-primary)]">{arrowheadSize}x</span>
              </div>
              <input
                id="arrowheadSize"
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={arrowheadSize}
                onChange={(e) => {
                  const newSize = parseFloat(e.target.value);
                  setArrowheadSize(newSize);
                  handlePropertyUpdate({ arrowheadSize: newSize });
                }}
                className="w-full h-2 bg-[var(--color-bg-input)] rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label htmlFor="arrowheadColor" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Arrowhead Color</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="arrowheadColor"
                    type="color"
                    value={arrowheadColor || '#000000'}
                    onChange={(e) => {
                      setArrowheadColor(e.target.value);
                      handlePropertyUpdate({ arrowheadColor: e.target.value });
                    }}
                    className="w-full p-1 h-10 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => {
                    setArrowheadColor('');
                    handlePropertyUpdate({ arrowheadColor: undefined });
                  }}
                  title="Reset to match link color"
                  className="p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-button-bg-hover)] rounded-xl border border-[var(--color-border)]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Leave empty or reset to match link color.</p>
            </div>

            {/* Animated Flow Toggle */}
            <div className="mt-3 p-3 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl border border-violet-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <label htmlFor="animatedFlow" className="text-sm font-semibold text-violet-700">Animated Flow</label>
                </div>
                <button
                  id="animatedFlow"
                  type="button"
                  onClick={() => {
                    const newValue = !(item as any).animated;
                    handlePropertyUpdate({ animated: newValue });
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-violet-400 ${(item as any).animated ? 'bg-violet-500' : 'bg-gray-300'
                    }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${(item as any).animated ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>
              <p className="text-xs text-violet-500 mt-1.5">Shows data flow direction on the arrow</p>
            </div>

            {/* Arrowhead Toggle */}
            <div className="mt-3 p-3 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl border border-violet-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <label htmlFor="showArrowhead" className="text-sm font-semibold text-violet-700">Show Arrowhead</label>
                </div>
                <button
                  id="showArrowhead"
                  type="button"
                  onClick={() => {
                    const currentStyle = (item as Link).arrowheadStyle;
                    const newValue = currentStyle === 'none' ? 'default' : 'none';
                    handlePropertyUpdate({ arrowheadStyle: newValue });
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-violet-400 ${((item as Link).arrowheadStyle !== 'none') ? 'bg-violet-500' : 'bg-gray-300'
                    }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${((item as Link).arrowheadStyle !== 'none') ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default PropertiesSidebar;