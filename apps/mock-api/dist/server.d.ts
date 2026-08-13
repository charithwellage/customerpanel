import { Request, Express } from 'express';
import { JwtClaims } from '@carchief/domain';
import { type DemoStore } from './store.js';
export interface AuthenticatedRequest extends Request {
    user?: JwtClaims;
}
export declare function createMockApiApp(store?: DemoStore): Express;
//# sourceMappingURL=server.d.ts.map