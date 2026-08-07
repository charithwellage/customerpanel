export interface components {
  schemas: {
    Vehicle: {
      id: string;
      chassisNumber: string;
      make: string;
      model: string;
      year: number;
      priceUsd: number;
      status: string;
    };
  };
}
