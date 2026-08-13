export interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    ariaLabel?: string;
    className?: string;
}
export declare function getButtonCssClass(props?: ButtonProps): string;
//# sourceMappingURL=Button.d.ts.map