import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

// Theme color definitions
const THEME_COLORS: Record<string, { primary: string; secondary: string }> = {
  purple: {
    primary: 'rgba(179, 141, 220, 1)',
    secondary: 'rgba(169, 194, 235, 1)',
  },
  blue: {
    primary: 'rgba(96, 165, 250, 1)',
    secondary: 'rgba(59, 130, 246, 1)',
  },
  pink: {
    primary: 'rgba(236, 72, 153, 1)',
    secondary: 'rgba(244, 63, 94, 1)',
  },
  green: {
    primary: 'rgba(16, 185, 129, 1)',
    secondary: 'rgba(52, 211, 153, 1)',
  },
  orange: {
    primary: 'rgba(249, 115, 22, 1)',
    secondary: 'rgba(251, 146, 60, 1)',
  },
  indigo: {
    primary: 'rgba(99, 102, 241, 1)',
    secondary: 'rgba(79, 70, 229, 1)',
  },
};

export const useThemeInitializer = () => {
  const colorTheme = useSelector((state: RootState) => state.ui.colorTheme);

  useEffect(() => {
    const colors = THEME_COLORS[colorTheme];
    const root = document.documentElement;

    // Parse RGB values to extract numbers
    const primaryRgb = colors.primary.match(/\d+/g);
    const secondaryRgb = colors.secondary.match(/\d+/g);

    if (primaryRgb && secondaryRgb) {
      const [pr, pg, pb] = primaryRgb;
      const [sr, sg, sb] = secondaryRgb;

      // Update CSS variables
      root.style.setProperty('--primary', `rgb(${pr}, ${pg}, ${pb})`);
      root.style.setProperty('--primary-faded', `rgba(${pr}, ${pg}, ${pb}, 0.18)`);
      root.style.setProperty('--secondary', `rgb(${sr}, ${sg}, ${sb})`);
      root.style.setProperty('--secondary-faded', `rgba(${sr}, ${sg}, ${sb}, 0.2)`);
      root.style.setProperty('--border', `rgba(${pr}, ${pg}, ${pb}, 0.28)`);
    }
  }, [colorTheme]);
};
