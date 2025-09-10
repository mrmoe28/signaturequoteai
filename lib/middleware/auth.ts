import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '../logger';

const logger = createLogger('auth-middleware');

export type AuthLevel = 'public' | 'authenticated' | 'admin';

export interface AuthContext {
  userId?: string;
  email?: string;
  role?: string;
}

// Simple auth middleware - in production, integrate with NextAuth or similar
export function withAuth(authLevel: AuthLevel = 'authenticated') {
  return function authMiddleware(
    handler: (req: NextRequest, context: AuthContext, ...args: any[]) => Promise<NextResponse>
  ) {
    return async function(req: NextRequest, ...args: any[]): Promise<NextResponse> {
      // For now, implement basic API key auth
      // In production, use proper JWT tokens or session-based auth
      
      if (authLevel === 'public') {
        return handler(req, {}, ...args);
      }

      const authHeader = req.headers.get('authorization');
      const apiKey = req.headers.get('x-api-key');

      // Check for API key (for cron jobs and internal services)
      if (apiKey && process.env.INTERNAL_API_KEY && apiKey === process.env.INTERNAL_API_KEY) {
        logger.debug('API key authentication successful');
        return handler(req, { role: 'internal' }, ...args);
      }

      // Check for Bearer token
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        
        try {
          // In production, verify JWT token here
          // For now, just check if token exists
          if (token && token.length > 0) {
            logger.debug('Bearer token authentication successful');
            return handler(req, { 
              userId: 'user-from-token',
              email: 'user@example.com',
              role: 'user' 
            }, ...args);
          }
        } catch (error) {
          logger.warn({ error }, 'Invalid token provided');
        }
      }

      // In development, allow unauthenticated requests to quotes API
      if (process.env.NODE_ENV === 'development' && authLevel === 'authenticated') {
        logger.debug('Development mode: allowing unauthenticated request');
        return handler(req, { 
          userId: 'dev-user',
          email: 'dev@example.com',
          role: 'user' 
        }, ...args);
      }

      logger.warn({ 
        path: req.nextUrl.pathname,
        authLevel,
        hasAuthHeader: !!authHeader,
        hasApiKey: !!apiKey
      }, 'Unauthorized request');

      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Valid authentication required',
        },
        { status: 401 }
      );
    };
  };
}

// Rate limiting middleware
export function withRateLimit(
  requestsPerMinute: number = 60,
  windowMs: number = 60000
) {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return function rateLimitMiddleware(
    handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
  ) {
    return async function(req: NextRequest, ...args: any[]): Promise<NextResponse> {
      // Get client identifier (IP address)
      const clientId = req.ip || 
        req.headers.get('x-forwarded-for') || 
        req.headers.get('x-real-ip') || 
        'unknown';

      const now = Date.now();
      const clientData = requestCounts.get(clientId);

      if (clientData) {
        if (now < clientData.resetTime) {
          // Within the current window
          if (clientData.count >= requestsPerMinute) {
            logger.warn({ 
              clientId,
              count: clientData.count,
              limit: requestsPerMinute 
            }, 'Rate limit exceeded');

            return NextResponse.json(
              {
                success: false,
                error: 'Rate limit exceeded',
                message: `Too many requests. Limit: ${requestsPerMinute} per minute`,
              },
              { 
                status: 429,
                headers: {
                  'Retry-After': Math.ceil((clientData.resetTime - now) / 1000).toString(),
                  'X-RateLimit-Limit': requestsPerMinute.toString(),
                  'X-RateLimit-Remaining': Math.max(0, requestsPerMinute - clientData.count).toString(),
                  'X-RateLimit-Reset': clientData.resetTime.toString(),
                }
              }
            );
          }
          
          clientData.count++;
        } else {
          // Window expired, reset
          clientData.count = 1;
          clientData.resetTime = now + windowMs;
        }
      } else {
        // First request from this client
        requestCounts.set(clientId, {
          count: 1,
          resetTime: now + windowMs,
        });
      }

      // Clean up old entries periodically
      if (Math.random() < 0.01) { // 1% chance
        const cutoff = now - windowMs;
        Array.from(requestCounts.entries()).forEach(([key, value]) => {
          if (value.resetTime < cutoff) {
            requestCounts.delete(key);
          }
        });
      }

      return handler(req, ...args);
    };
  };
}

// Combine middleware
export function withMiddleware(
  authLevel: AuthLevel = 'authenticated',
  rateLimit: number = 60
) {
  return function(
    handler: (req: NextRequest, context: AuthContext, ...args: any[]) => Promise<NextResponse>
  ) {
    return withRateLimit(rateLimit)(
      withAuth(authLevel)(handler)
    );
  };
}