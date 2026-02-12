import React from 'react';

export type BorderStyle = 'solid' | 'dotted' | 'dashed' | 'double' | 'none';

export interface BorderOptions {
  borderStyle?: BorderStyle;
  borderWidth?: 'thin' | 'medium' | 'thick';
  borderColor?: string;
}

export const BORDER_STYLE_OPTIONS: { key: BorderStyle; label: string }[] = [
  { key: 'solid', label: 'Solid' },
  { key: 'dotted', label: 'Dotted' },
  { key: 'dashed', label: 'Dashed' },
  { key: 'double', label: 'Double' },
  { key: 'none', label: 'None' },
];

export const BORDER_WIDTH_OPTIONS = [
  { key: 'thin', label: 'Thin' },
  { key: 'medium', label: 'Medium' },
  { key: 'thick', label: 'Thick' },
];

interface BorderStyleSelectorProps {
  selectedStyle: BorderStyle;
  onSelectStyle: (style: BorderStyle) => void;
}

export const BorderStyleSelector: React.FC<BorderStyleSelectorProps> = ({ 
  selectedStyle, 
  onSelectStyle 
}) => {
  return (
    <select 
      value={selectedStyle}
      onChange={(e) => onSelectStyle(e.target.value as BorderStyle)}
      className="w-full p-2 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
    >
      {BORDER_STYLE_OPTIONS.map(option => (
        <option key={option.key} value={option.key}>{option.label}</option>
      ))}
    </select>
  );
};

interface BorderWidthSelectorProps {
  selectedWidth: 'thin' | 'medium' | 'thick';
  onSelectWidth: (width: 'thin' | 'medium' | 'thick') => void;
}

export const BorderWidthSelector: React.FC<BorderWidthSelectorProps> = ({ 
  selectedWidth, 
  onSelectWidth 
}) => {
  return (
    <select 
      value={selectedWidth}
      onChange={(e) => onSelectWidth(e.target.value as 'thin' | 'medium' | 'thick')}
      className="w-full p-2 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
    >
      {BORDER_WIDTH_OPTIONS.map(option => (
        <option key={option.key} value={option.key}>{option.label}</option>
      ))}
    </select>
  );
};