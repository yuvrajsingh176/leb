import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import type { UserVerifiedObj } from '../types/global.types';

function sendUserUnauthenticatedResp(res: Response): Response {
  return res.status(401).json({ msg: "User isn't authenticated" });
}

function checkAuthenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Response | undefined {
  const token: string = req.cookies.access_token;
  if (token === null || token === undefined) {
    next();
  } else {
    try {
      req.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) as UserVerifiedObj;
      next();
    } catch (e) {
      console.log(e);
      return sendUserUnauthenticatedResp(res);
    }
  }
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

function requireAuthenticationToken(
  req: Request,
  res: Response,
  next: NextFunction
): Response | undefined {
  const authorizationHeader = req.headers.authorization;

  const token = extractToken(authorizationHeader);
  if (token === null || token === undefined) {
    return sendUserUnauthenticatedResp(res);
  } else {
    try {
      req.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) as UserVerifiedObj;
      next();
    } catch (e) {
      console.log(e);
      return sendUserUnauthenticatedResp(res);
    }
  }
}

export { checkAuthenticateToken, requireAuthenticationToken };
