import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { ErrorCode } from '../constants';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { sendError } from '../utils/ApiResponse';

export const globalErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    let statusCode = 500;
    let errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let details = undefined;

    // Handle AppError (Known Operational Errors)
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        errorCode = err.errorCode;
        message = err.message;
        details = err.details;
    } 
    // Handle Zod Validation Errors
    else if (err instanceof ZodError) {
        statusCode = 400;
        errorCode = ErrorCode.VALIDATION_ERROR;
        message = 'Validation Failed';
        details = err.issues;
    }
    // Handle JWT Errors
    else if (err instanceof TokenExpiredError) {
        statusCode = 401; // Or 403? 401 is usually for 'expired/invalid credentials'
        errorCode = ErrorCode.AUTH_TOKEN_EXPIRED;
        message = 'Token has expired';
        details = { expiredAt: err.expiredAt };
    }
    else if (err instanceof JsonWebTokenError) {
        statusCode = 401;
        errorCode = ErrorCode.AUTH_TOKEN_INVALID;
        message = 'Invalid Token';
    }
    // Handle Syntax Errors (e.g. malformed JSON)
    else if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
        statusCode = 400;
        errorCode = ErrorCode.VALIDATION_ERROR;
        message = 'Malformed JSON';
    }
    // Handle Kite Connect Errors (duck typing)
    else if ((err as any).error_type) {
        const kiteErr = err as any;
        if (kiteErr.error_type === 'TokenException') {
            statusCode = 401; // Or 403?
            errorCode = ErrorCode.KITE_SESSION_EXPIRED;
            message = 'Kite Session Expired or Invalid. Please re-login.';
            details = { kiteMessage: kiteErr.message };
        } else {
            statusCode = 502; // Bad Gateway / Upstream Error
            errorCode = ErrorCode.KITE_API_ERROR;
            message = kiteErr.message || 'Kite API Error';
            details = { type: kiteErr.error_type, data: kiteErr.data };
        }
    }

    // unexpected errors
    if (statusCode === 500) {
        logger.error({ msg: 'Unhandled Exception', error: err.message, stack: err.stack });
    } else {
        // Operational errors can be warned
        logger.warn({ msg: 'Operational Error', errorCode, message, url: req.url });
    }

    sendError(res, statusCode, errorCode, message, details, false);
};
