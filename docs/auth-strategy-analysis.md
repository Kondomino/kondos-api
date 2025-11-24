# Authentication Strategy Analysis

**Date:** Analysis performed prior to strategy migration  
**Context:** Current Google OAuth implementation was working fine. Analysis prepared for switching to a new OAuth strategy.

---

## Architecture Overview

The current Google OAuth flow follows the standard NestJS Passport pattern with these key components:

1. **Routes**: `GET /auth` and `GET /auth/google-redirect` in `AppController`
2. **Guard**: `GoogleOAuthGuard` protects these routes
3. **Strategy**: `GoogleStrategy` validates Google OAuth responses
4. **Service**: `AuthService.googleLogin()` processes authenticated users

---

## Critical Coupling Points

### 1. Module Registration (⚠️ **CRITICAL**)

**Location:** `src/app.module.ts`

```typescript
providers: [...kondoProviders, GoogleStrategy],
```

**Issues:**
- `GoogleStrategy` is registered in `AppModule` instead of `AuthModule`
- Breaks proper encapsulation and separation of concerns
- Makes it harder to manage auth-related components in one place

**Impact:** Strategy is disconnected from other authentication components, making it harder to swap strategies modularly.

---

### 2. Guard-to-Strategy Coupling (⚠️ **HIGH**)

**Location:** `src/auth/guards/google-oauth.guard.ts`

```typescript
export class GoogleOAuthGuard extends AuthGuard('google') {
```

**Issues:**
- Hard-coded strategy name `'google'`
- Guard cannot be reused with other OAuth providers
- Tightly coupled to Passport's Google strategy

**Impact:** Cannot switch providers without modifying the guard.

---

### 3. Strategy Profile Parsing (⚠️ **HIGH**)

**Location:** `src/auth/strategies/google.strategy.ts`

```typescript
async validate(
  accessToken: string,
  refreshToken: string,
  profile: any,
  done: VerifyCallback,
): Promise<any> {
  const { name, emails, photos } = profile;
  const user = {
    email: emails[0].value,
    firstName: name.givenName,
    lastName: name.familyName,
    picture: photos[0].value,
    accessToken,
    refreshToken,
  };
  done(null, user);
}
```

**Issues:**
- Directly accesses Google-specific profile structure
- Assumes `profile.name.givenName` and `profile.name.familyName` exist
- Assumes `emails[0]` and `photos[0]` arrays are present
- No error handling for missing properties

**Impact:** Will break with any other OAuth provider that has a different profile structure.

---

### 4. Service Method Coupling (⚠️ **MEDIUM**)

**Location:** `src/auth/auth.service.ts`

```typescript
async googleLogin(req): Promise<LoginResponseType> {
  if (!req.user) {
    return { message: 'No user from google' };
  }

  const userDTO: UserDto = {
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    picture: req.user.picture
  }

  // FIND OR CREATE USER
  const fetch = await this.usersService.findOrCreate(userDTO);

  return {
    message: 'User information from google',
    access_token: this.generateJwt({email: fetch[0].email }),
    user: req.user,
  };
}
```

**Issues:**
- Method name is Google-specific (`googleLogin`)
- Expects specific `req.user` structure
- Return message explicitly mentions "from google"
- No abstraction layer for different providers

**Impact:** Cannot reuse this method for other OAuth providers without modification.

---

### 5. Route Naming (⚠️ **MEDIUM**)

**Location:** `src/app.controller.ts`

```typescript
@Public()
@Get('auth')
@UseGuards(GoogleOAuthGuard)
async googleAuth(@Request() req) {
  console.log('received google auth attempt');
}

@Public()
@Get('auth/google-redirect')
@UseGuards(GoogleOAuthGuard)
@Redirect('', 302)
async googleAuthRedirect(@Request() req, @Res({ passthrough: true }) response: Response) {
  const { access_token } = await this.authService.googleLogin(req);
  // ...
}
```

**Issues:**
- Route `/auth/google-redirect` is Google-specific
- Controller method names reference Google
- No parameterized routes for multi-provider support

**Impact:** Routes should be provider-agnostic if supporting multiple OAuth providers.

---

### 6. External Dependencies (⚠️ **HIGH**)

**Package:** `passport-google-oauth20` (v2.0.0)

**Environment Variables:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `API_URL` (used for constructing callback URL)

**Location in Strategy:**
```typescript
super({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.API_URL}/auth/google-redirect`,
  scope: ['email', 'profile'],
});
```

**Impact:** Changing providers requires replacing the entire package dependency.

---

### 7. Guard Configuration (⚠️ **MEDIUM**)

**Location:** `src/auth/guards/google-oauth.guard.ts`

```typescript
super({
  accessType: 'offline',
});
```

**Issue:** `accessType: 'offline'` is a Google-specific OAuth option (for refresh tokens).

**Impact:** Not applicable to other OAuth providers.

---

## Summary of Coupling Levels

| Component | Coupling Level | Issues |
|-----------|---------------|--------|
| **Module Registration** | ⚠️ **CRITICAL** | Strategy in wrong module |
| **Guard** | ⚠️ **HIGH** | Hard-coded strategy name |
| **Strategy** | ⚠️ **HIGH** | Google-specific profile parsing |
| **Service Method** | ⚠️ **MEDIUM** | Google-specific naming and logic |
| **Routes** | ⚠️ **MEDIUM** | Google-specific URLs |
| **Package** | ⚠️ **HIGH** | Direct dependency on `passport-google-oauth20` |

---

## Current Flow Diagram

```
User → GET /auth 
     → GoogleOAuthGuard 
     → GoogleStrategy 
     → Google OAuth Server
     → GET /auth/google-redirect
     → GoogleOAuthGuard 
     → GoogleStrategy.validate()
     → req.user (Google profile shape)
     → AuthService.googleLogin(req)
     → JWT generation
     → Response with token
```

**Key Observation:** Every component in this flow is Google-specific, making it difficult to swap providers without changes across multiple layers.

---

## Recommendations for Strategy Migration

### 1. **Extract Strategy to AuthModule** (Priority: High)
   - Move `GoogleStrategy` registration from `AppModule` to `AuthModule`
   - Proper encapsulation of all auth-related components

### 2. **Create Abstraction Layer** (Priority: High)
   - Define a strategy interface or use factory pattern
   - Abstract the common OAuth flow
   - Normalize provider-specific profile structures to a common format

### 3. **Make Guards Provider-Agnostic** (Priority: Medium)
   - Use dynamic strategy selection
   - Create a generic `OAuthGuard` that can work with multiple strategies
   - Pass provider name as parameter

### 4. **Refactor Service Methods** (Priority: Medium)
   - Rename `googleLogin` to `oauthLogin` or `handleOAuthCallback`
   - Accept normalized user object instead of provider-specific structure
   - Remove provider-specific messages

### 5. **Use Generic Route Patterns** (Priority: Medium)
   - Consider parameterized routes like `/auth/:provider` and `/auth/:provider/redirect`
   - Or use `/oauth/:provider` pattern
   - Make controller methods provider-agnostic

### 6. **Abstract Profile Normalization** (Priority: High)
   - Create a profile mapper/normalizer interface
   - Convert provider-specific profiles to a common `OAuthUser` format
   - Handle different field names and structures

### 7. **Environment-Based Configuration** (Priority: Medium)
   - Use provider-agnostic environment variable names
   - Create configuration objects per provider
   - Allow enabling/disabling providers via config

---

## Files Involved in Current Implementation

### Core Authentication Files
- `src/auth/auth.module.ts` - Auth module (missing GoogleStrategy)
- `src/auth/auth.service.ts` - Contains `googleLogin()` method
- `src/auth/strategies/google.strategy.ts` - Google OAuth strategy
- `src/auth/strategies/jwt.strategy.ts` - JWT validation strategy
- `src/auth/guards/google-oauth.guard.ts` - Google OAuth guard
- `src/auth/guards/jwt.auth.guard.ts` - JWT authentication guard

### Controller & Routes
- `src/app.controller.ts` - Contains Google OAuth routes

### Module Configuration
- `src/app.module.ts` - Registers GoogleStrategy (wrong location)

### Type Definitions
- `src/auth/types/google.login.type.ts` - Google-specific response type

---

## Dependencies

**Package:** `passport-google-oauth20@^2.0.0`  
**Type Definitions:** `@types/passport-google-oauth20@^2.0.16`

---

## Notes

- Current implementation was working fine with Google direct OAuth
- Analysis prepared to understand coupling before switching to new strategy
- All coupling points identified for safe migration
- Recommendations provided to minimize breaking changes during transition

