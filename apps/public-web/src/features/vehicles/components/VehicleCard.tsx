import React from 'react';
import { VehicleCardPrimitive, type VehicleCardPrimitiveProps } from '@carchief/vehicle-search';

export type VehicleCardProps = VehicleCardPrimitiveProps;

export const VehicleCard: React.FC<VehicleCardProps> = (props) => {
  return <VehicleCardPrimitive {...props} />;
};
