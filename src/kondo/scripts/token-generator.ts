import * as jwt from 'jsonwebtoken';

const JWT_SECRET = 'BOLOTA123'; // Same as in auth/constants.ts
const JWT_EXPIRES_IN = '9999s'; // Same as in auth.module.ts

export interface TokenPayload {
  email: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function generateMockToken(): string {
  // Generate a token for a mock user
  const mockPayload: TokenPayload = {
    email: 'mock-user@kondos-api.com'
  };
  
  return generateToken(mockPayload);
}

export async function loginAndGetToken(email: string, password: string): Promise<string> {
  const API_BASE_URL = 'http://localhost:3003/api';
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

// For testing the token generation
if (require.main === module) {
  const token = generateMockToken();
  console.log('Generated JWT Token:');
  console.log(token);
  console.log('\nUse this token in your Authorization header:');
  console.log(`Authorization: Bearer ${token}`);
} 