# Iteration Log - 2026-07-24 09:10 - Session Cookie Security

**Request**: Configure the authentication token cookie to expire immediately upon browser closure so that users are forced to log in upon reopening the browser.

**Affected files**:
- `backend/routes/auth/helpers.js`

## Solution

1. **Analysis**:
   - The auth token cookie was configured with `maxAge: 24 * 60 * 60 * 1000` (24 hours).
   - This made it a persistent cookie stored on disk, so reopening the browser sent the cookie and bypassed the login screen.
   
2. **Implementation**:
   - Removed the `maxAge` option from `res.cookie('token', ...)` in `setCookieToken` inside `backend/routes/auth/helpers.js`.
   - The browser now stores the cookie in memory only and discards it when closed (standard session cookie behavior).

3. **Deployment**:
   - Deployed successfully using `node scripts/deploy-sftp.js`.
   - PM2 backend service reloaded on the production server.
