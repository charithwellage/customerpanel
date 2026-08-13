export interface DialogProps {
    id: string;
    isOpen: boolean;
    title: string;
    description?: string;
    ariaDescribedBy?: string;
}
export declare function getDialogAccessibilityAttributes(props: DialogProps): Record<string, string | boolean>;
//# sourceMappingURL=Dialog.d.ts.map