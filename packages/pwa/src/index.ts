export interface PwaConfig {
  appName: string;
  shortName: string;
  startUrl: string;
}

export function isOnline(): boolean {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
}
