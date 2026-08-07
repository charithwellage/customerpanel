export interface DialogProps {
  id: string;
  isOpen: boolean;
  title: string;
  description?: string;
  ariaDescribedBy?: string;
}

export function getDialogAccessibilityAttributes(props: DialogProps): Record<string, string | boolean> {
  return {
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': `${props.id}-title`,
    'aria-describedby': props.description ? `${props.id}-description` : props.ariaDescribedBy || '',
    hidden: !props.isOpen,
  };
}
