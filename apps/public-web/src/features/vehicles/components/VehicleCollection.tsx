import React from 'react';
import { VehicleCollectionPrimitive, type VehicleCollectionPrimitiveProps } from '@carchief/vehicle-search';

export type VehicleCollectionProps = VehicleCollectionPrimitiveProps;

export const VehicleCollection: React.FC<VehicleCollectionProps> = (props) => {
  return <VehicleCollectionPrimitive {...props} />;
};
