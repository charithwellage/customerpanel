import React from 'react';
import type { VehicleDomainSummary } from '@carchief/domain';
export interface VehicleCardPrimitiveProps {
    vehicle: VehicleDomainSummary;
    onSelect?: (vehicle: VehicleDomainSummary) => void;
    actionHref?: string;
    actionLabel?: string;
    showDiscount?: boolean;
}
export declare const VehicleCardPrimitive: React.FC<VehicleCardPrimitiveProps>;
//# sourceMappingURL=VehicleCardPrimitive.d.ts.map