export interface RenderHelperOptions {
  theme?: string;
  route?: string;
}

export function renderWithProviders(componentName: string, options?: RenderHelperOptions): string {
  const theme = options?.theme || 'default';
  const route = options?.route || '/';
  return `<TestProvider theme="${theme}" route="${route}">${componentName}</TestProvider>`;
}
