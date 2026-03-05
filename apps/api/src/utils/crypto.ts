import crypto from 'crypto';
// Need a dummy config import or pass key. To avoid circular deps or complexity, let's allow passing key or use env.
// But we have strict config now.
import { config } from '../config/config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; 

// We need a 32-byte key. The config Zod checks length 64 hex chars? 
// Wait, previous config said "length(64)". 64 hex chars = 32 bytes.
// Buffer.from(key, 'hex') works effectively.

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(config.ENCRYPTION_KEY || '', 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

export const decrypt = (text: string): string => {
  const [ivHex, authTagHex, encryptedText] = text.split(':');
  
  if (!ivHex || !authTagHex || !encryptedText) throw new Error('Invalid encrypted text format');
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM, 
    Buffer.from(config.ENCRYPTION_KEY || '', 'hex'), 
    Buffer.from(ivHex, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
