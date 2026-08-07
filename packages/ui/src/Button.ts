export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
  className?: string;
}

export function getButtonCssClass(props: ButtonProps = {}): string {
  const variant = props.variant || 'primary';
  const size = props.size || 'md';
  const disabled = props.disabled ? 'btn-disabled opacity-50 cursor-not-allowed' : 'btn-interactive';
  return `cc-btn cc-btn-${variant} cc-btn-${size} ${disabled} ${props.className || ''}`.trim();
}
