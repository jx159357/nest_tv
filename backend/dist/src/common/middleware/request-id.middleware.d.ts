import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare class RequestIdMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void;
    private generateRequestId;
    private getCounter;
}
declare global {
    namespace Express {
        interface Request {
            requestId: string;
            startTime: number;
        }
    }
}
