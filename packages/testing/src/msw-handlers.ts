import { createMockVehicle } from './builders.js';

export interface HttpMockResponse<T> {
  status: number;
  data: T;
}

export function getMockVehiclesEndpoint(): HttpMockResponse<unknown[]> {
  return {
    status: 200,
    data: [createMockVehicle()],
  };
}
