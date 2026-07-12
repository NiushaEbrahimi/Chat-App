import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type OpenPanel = "profile" | "settings" | "room-edit" | null;
export type TextSize = "small" | "medium" | "large";
export type ColorTheme = "purple" | "blue" | "pink" | "green" | "orange" | "indigo";
export type Language = "en" | "es" | "fr" | "de";

interface UiState {
  openPanel: OpenPanel;
  textSize: TextSize;
  colorTheme: ColorTheme;
  notificationsEnabled: boolean;
  language: Language;
}

const getInitialState = (): UiState => {
  return {
    openPanel: null,
    textSize: (localStorage.getItem('messageTextSize') as TextSize) || 'medium',
    colorTheme: (localStorage.getItem('colorTheme') as ColorTheme) || 'purple',
    notificationsEnabled: localStorage.getItem('notificationsEnabled') !== 'false',
    language: (localStorage.getItem('language') as Language) || 'en',
  };
};

const initialState: UiState = getInitialState();

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openProfile: (state) => {
      state.openPanel = "profile";
    },
    openSettings: (state) => {
      state.openPanel = "settings";
    },
    openRoomEdit: (state) => {
      state.openPanel = "room-edit";
    },
    setPanel: (state, action: PayloadAction<OpenPanel>) => {
      state.openPanel = action.payload;
    },
    closePanel: (state) => {
      state.openPanel = null;
    },
    setTextSize: (state, action: PayloadAction<TextSize>) => {
      state.textSize = action.payload;
      localStorage.setItem('messageTextSize', action.payload);
    },
    setColorTheme: (state, action: PayloadAction<ColorTheme>) => {
      state.colorTheme = action.payload;
      localStorage.setItem('colorTheme', action.payload);
      applyTheme(action.payload);
    },
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notificationsEnabled = action.payload;
      localStorage.setItem('notificationsEnabled', String(action.payload));
    },
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },
  },
});

// Theme color definitions
const THEME_COLORS: Record<ColorTheme, { primary: string; secondary: string }> = {
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

// Function to apply theme by updating CSS variables
const applyTheme = (theme: ColorTheme) => {
  const colors = THEME_COLORS[theme];
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
};

export const { openProfile, openSettings, openRoomEdit, setPanel, closePanel, setTextSize, setColorTheme, setNotificationsEnabled, setLanguage } = uiSlice.actions;
export default uiSlice.reducer;
