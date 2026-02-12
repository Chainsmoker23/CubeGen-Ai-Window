import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';

type Theme = 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes = {
  light: {
    '--color-bg': '#FDFDFD',
    '--color-panel-bg': '#FFFFFF',
    '--color-panel-bg-translucent': 'rgba(255, 255, 255, 0.75)',
    '--color-canvas-bg': '#FDFDFD',
    '--color-node-bg': '#FFFFFF',
    '--color-button-bg': '#FEF2F2',
    '--color-button-bg-hover': '#FEE2E2',
    '--color-bg-input': '#FDFDFD',
    '--color-text-primary': '#1F2937',
    '--color-text-secondary': '#6B7280',
    '--color-text-tertiary': '#E5E7EB',
    '--color-border': '#FEE2E2',
    '--color-border-translucent': 'rgba(254, 226, 226, 0.7)',
    '--color-link': '#E11D48',
    '--color-grid-dot': 'rgba(244, 63, 94, 0.1)',
    '--color-accent': '#F43F5E',
    '--color-accent-soft': '#FFE4E6',
    '--color-accent-text': '#E11D48',
    '--color-accent-text-strong': '#FFFFFF',
    '--color-shadow': '#444444',
    '--color-tier-1': 'rgba(254, 226, 226, 0.4)',
    '--color-tier-2': 'rgba(219, 234, 254, 0.4)',
    '--color-tier-3': 'rgba(209, 250, 229, 0.4)',
    '--color-tier-4': 'rgba(254, 243, 199, 0.4)',
    '--color-tier-5': 'rgba(233, 213, 255, 0.4)',
    '--color-tier-6': 'rgba(243, 244, 246, 0.5)',
    '--color-tier-default': 'rgba(243, 244, 246, 0.5)',
    '--color-glow-highlight': 'rgba(255, 255, 255, 0.2)',
    '--color-aurora-1': 'rgba(251, 113, 133, 0.8)',
    '--color-aurora-2': 'rgba(147, 197, 253, 0.8)',
    '--color-aurora-3': 'rgba(221, 214, 254, 0.7)',
  },

};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const storedTheme = window.localStorage.getItem('app-theme') as Theme;
      return storedTheme || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    const themeProperties = themes[theme];
    
    Object.entries(themeProperties).forEach(([key, value]) => {
      root.style.setProperty(key, value as string);
    });

    try {
      window.localStorage.setItem('app-theme', theme);
    } catch (error) {
      console.error(`Could not access localStorage to save theme: ${String(error)}`);
    }
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};