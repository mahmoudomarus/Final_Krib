import { Request, Response, NextFunction } from 'express';
interface ApiError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}
export declare const errorHandler: (err: ApiError, req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=errorHandler.d.ts.map