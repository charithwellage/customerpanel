export interface InputFieldProps {
    id: string;
    label: string;
    type?: 'text' | 'email' | 'number' | 'password' | 'search';
    value?: string;
    placeholder?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
}
export declare function renderInputFieldSkeleton(props: InputFieldProps): {
    id: string;
    labelId: string;
    errorId?: string;
    hasError: boolean;
};
//# sourceMappingURL=InputField.d.ts.map