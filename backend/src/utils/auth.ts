import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  subscriptionStatus: string;
}

export class AuthUtils {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateToken(payload: TokenPayload): string {
    return jwt.sign(
      payload, 
      env.JWT_SECRET as jwt.Secret, 
      {
        expiresIn: env.JWT_EXPIRES_IN as string | number,
        issuer: 'dream-journal-pro',
        audience: 'dream-journal-pro-users',
      } as jwt.SignOptions
    );
  }

  static verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, env.JWT_SECRET, {
        issuer: 'dream-journal-pro',
        audience: 'dream-journal-pro-users',
      }) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  static generateRefreshToken(): string {
    return jwt.sign({}, env.JWT_SECRET, {
      expiresIn: '30d',
      issuer: 'dream-journal-pro',
    });
  }

  static generateResetToken(): string {
    return jwt.sign({}, env.JWT_SECRET, {
      expiresIn: '1h',
      issuer: 'dream-journal-pro-reset',
    });
  }

  static verifyResetToken(token: string): boolean {
    try {
      jwt.verify(token, env.JWT_SECRET, {
        issuer: 'dream-journal-pro-reset',
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  static generateVerificationToken(): string {
    return jwt.sign({}, env.JWT_SECRET, {
      expiresIn: '24h',
      issuer: 'dream-journal-pro-verify',
    });
  }

  static verifyVerificationToken(token: string): boolean {
    try {
      jwt.verify(token, env.JWT_SECRET, {
        issuer: 'dream-journal-pro-verify',
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}