import { describe, it, expect } from 'vitest';
import { createMockApiApp } from '../server.js';

describe('Mock API Server Integration Tests', () => {
  const app = createMockApiApp();

  it('instantiates app cleanly', () => {
    expect(app).toBeDefined();
  });
});
