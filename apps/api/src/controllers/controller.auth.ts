import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/service.auth';
import { KiteCallbackDto, LoginDto } from '../dtos/dto.auth';
import { sendSuccess } from '../utils/ApiResponse';
import { UserRepository } from '../repositories/repository.user';

export const AuthController = {
    getLoginUrl(req: Request, res: Response, next: NextFunction) {
        try {
            const url = AuthService.getLoginUrl();
            sendSuccess(res, { login_url: url });
        } catch (error) {
            next(error);
        }
    },

    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const input = LoginDto.parse(req.body); // minimalistic validation for now
            const result = await AuthService.register(req.body); // pass body to get name too
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    },

    async appLogin(req: Request, res: Response, next: NextFunction) {
        try {
            const input = LoginDto.parse(req.body);
            const result = await AuthService.login(input);
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    },

    async logout(req: Request, res: Response, next: NextFunction) {
        // Stateless JWT: Client just deletes token.
        // Server could add to blacklist if needed, but for now just respond success.
        sendSuccess(res, { message: 'Logged out successfully' });
    },

    async disconnectKite(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            await UserRepository.clearKiteToken(userId);
            sendSuccess(res, { message: 'Kite disconnected successfully' });
        } catch (error) {
            next(error);
        }
    },

    async handleCallback(req: Request, res: Response, next: NextFunction) {
        try {
            // Support both GET (query) and POST (body)
            const requestToken = req.method === 'GET' 
                ? req.query.request_token 
                : req.body.request_token;

            // Validate Input (Manually or construct object for Zod)
            const input = KiteCallbackDto.parse({ 
                request_token: requestToken,
                userId: req.user?.id 
            });
            
            if (!input.userId) {
                // Should be caught by auth middleware, but double check
                return res.status(401).json({ message: 'User not authenticated for callback' });
            }

            const result = await AuthService.handleCallback(input as any); // cast as any because Zod optional vs required in service logic
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    }
};
