export interface ButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function renderButtonSkeleton(props: ButtonProps): string {
  return `<button ${props.disabled ? 'disabled' : ''}>${props.label}</button>`;
}
