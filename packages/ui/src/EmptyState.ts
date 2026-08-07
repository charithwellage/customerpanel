export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function formatEmptyStateMessage(title: string, description: string): string {
  return `${title}: ${description}`;
}
