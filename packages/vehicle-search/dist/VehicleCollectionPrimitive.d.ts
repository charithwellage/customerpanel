import React from 'react';
import type { VehicleDomainSummary } from '@carchief/domain';
export interface VehicleCollectionPrimitiveProps {
    title?: string;
    description?: string;
    vehicles: VehicleDomainSummary[];
    isLoading?: boolean;
    error?: string | null;
    emptyTitle?: string;
    emptyDescription?: string;
    onRetry?: () => void;
    onSelectVehicle?: (vehicle: VehicleDomainSummary) => void;
    getVehicleHref?: (vehicle: VehicleDomainSummary) => string;
}
export declare const VehicleCollectionPrimitive: React.FC<VehicleCollectionPrimitiveProps>;
//# sourceMappingURL=VehicleCollectionPrimitive.d.ts.map