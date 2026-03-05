import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, statusCode: number = 200) => {
    const requestId = (res.req as any).requestId as string;
    res.status(statusCode).json({
        success: true,
        data: data,
        requestId: requestId,
        timestamp: new Date().toISOString()
    });
};

export const sendError = (
    res: Response, 
    statusCode: number, 
    code: string, 
    message: string, 
    details?: any, 
    retryable: boolean = false
) => {
    const requestId = (res.req as any).requestId as string;
    res.status(statusCode).json({
        success: false,
        error: {
            code: code,
            message: message,
            details: details || {},
            retryable: retryable
        },
        requestId: requestId || 'unknown',
        timestamp: new Date().toISOString()
    });
};
