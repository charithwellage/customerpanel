export interface ThemeTokens {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
  };
}

export const defaultTheme: ThemeTokens = {
  colors: {
    primary: '#1d4ed8',
    secondary: '#0f766e',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
  },
};
