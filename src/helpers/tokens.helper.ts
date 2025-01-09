import jwt from 'jsonwebtoken';
import type { Request } from 'express';
import type { UserVerifiedObj } from '../types/global.types';

export function generateAccessToken(user: any): string | false {
  return (
    process.env.ACCESS_TOKEN_SECRET !== null &&
    jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: '45d'
    })
  );
}

export function generateRefreshToken(user: any): string | false {
  return (
    process.env.REFRESH_TOKEN_SECRET !== null &&
    jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '45d' })
  );
}

function extractToken(authorizationHeader?: string): string | null {
  if (authorizationHeader == null || authorizationHeader.trim() === '') {
    return null; // Return null if authorization header is null, undefined, or empty
  }

  const parts = authorizationHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  } else {
    return null;
  }
}

export function verifyToken(req: Request): string | undefined {
  const authorizationHeader = req.headers.authorization;
  const token = extractToken(authorizationHeader);

  if (token !== null && token !== undefined) {
    try {
      const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) as UserVerifiedObj;
      return user?.id;
    } catch (e) {
      console.log(e);
    }
  }
}
