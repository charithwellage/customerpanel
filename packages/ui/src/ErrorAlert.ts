export interface ErrorAlertProps {
  id: string;
  message: string;
  recoverable?: boolean;
}

export function getErrorAlertAttributes(props: ErrorAlertProps): Record<string, string | boolean> {
  return {
    role: 'alert',
    'aria-live': 'assertive',
    id: props.id,
  };
}
