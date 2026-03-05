import { z } from 'zod';

export const KiteCallbackDto = z.object({
    request_token: z.string().min(1, "request_token is required"),
    userId: z.string().optional() // Passed from controller (req.user.id)
});

// Manually define Input type for Service to ensure userId is present
export type KiteCallbackInput = {
    request_token: string;
    userId: string;
};

export type KiteLoginResponse = {
    login_url: string;
};

export const LoginDto = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

export type LoginInput = z.infer<typeof LoginDto>;

export interface KiteSessionResponse {
    access_token: string;
    public_token?: string;
    user_id?: string;
    user_type?: string;
    email?: string;
    user_name?: string;
    login_time?: string;
    avatar_url?: string;
}
