import { config } from '../config/config';
import { logger } from '../utils/logger';
import { encrypt } from '../utils/crypto';
import { KiteCallbackInput, LoginInput } from '../dtos/dto.auth';
import { systemKiteClient } from '../clients';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants';
import { UserRepository } from '../repositories/repository.user';

export const AuthService = {
    async login(input: LoginInput) {
        const user = await UserRepository.findByEmail(input.email);

        if (!user || !user.isActive) {
            throw new AppError(401, ErrorCode.AUTH_INVALID_CREDENTIALS, 'Invalid credentials or inactive account');
        }

        const isValid = await bcrypt.compare(input.password, user.password);
        if (!isValid) {
            throw new AppError(401, ErrorCode.AUTH_INVALID_CREDENTIALS, 'Invalid credentials');
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return { token, user: { id: user.id, email: user.email, name: user.name } };
    },

    async register(input: LoginInput & { name?: string }) {
        const existing = await UserRepository.findByEmail(input.email);
        if (existing) throw new AppError(409, ErrorCode.AUTH_USER_NOT_FOUND, 'User already exists'); // Reusing code or add AUTH_USER_EXISTS

        const hashedPassword = await bcrypt.hash(input.password, 10);
        const user = await UserRepository.createUser({
            email: input.email,
            password: hashedPassword,
            name: input.name,
            isActive: true
        });

        return { id: user.id, email: user.email };
    },

    getLoginUrl() {
        return systemKiteClient.getLoginURL();
    },

    async handleCallback(input: KiteCallbackInput) {
        try {
            const response = await systemKiteClient.generateSession(input.request_token, config.KITE_API_SECRET);
            
            if (!response.access_token) {
                throw new AppError(502, ErrorCode.KITE_API_ERROR, 'No access_token in Kite response');
            }

            // Encrypt token before returning or storing (Strategy: Store in DB, return App JWT)
            // User requested: "Store encrypted access_token... Never log/store tokens in audit/logs."
            
            const encryptedToken = encrypt(response.access_token);
            
            // Save User to DB with encryptedToken
            await UserRepository.updateKiteToken(input.userId, encryptedToken);

            return {
                ...response,
                access_token: '', // Don't return to UI
                public_token: '',  // Don't return to UI
                encrypted_token_preview: 'Stored Securely'
            };
        } catch (error) {
            logger.error({ msg: 'Kite Session Generation Failed', error });
            throw error;
        }
    }
};
