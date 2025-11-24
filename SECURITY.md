# BuyTree Security Features

This document outlines the security measures implemented in the BuyTree platform.

## 🔒 Implemented Security Features

### 1. **Password Security**
- ✅ **Bcrypt Hashing**: All passwords hashed with bcrypt (12 rounds)
- ✅ **Minimum Length**: 8 characters required
- ✅ **Password Reset Flow**: Secure token-based password reset
  - Tokens expire in 1 hour
  - Single-use tokens (marked as used after reset)
  - Cryptographically random 32-byte tokens

### 2. **Rate Limiting**
Prevents brute force attacks and API abuse.

#### General API Limiting
- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Applies to**: All `/api/*` endpoints

#### Auth Endpoints (Stricter)
- **Window**: 15 minutes
- **Max Attempts**: 5 per IP
- **Applies to**: `/api/auth/login`, `/api/auth/signup`
- **Prevents**: Brute force login attacks

#### Password Reset (Most Restrictive)
- **Window**: 1 hour
- **Max Requests**: 3 per IP
- **Applies to**: `/api/password-reset/*`
- **Prevents**: Email enumeration and reset abuse

### 3. **Security Headers (Helmet.js)**
Protects against common web vulnerabilities.

**Headers Set:**
- `X-DNS-Prefetch-Control`: Controls browser DNS prefetching
- `X-Frame-Options`: Prevents clickjacking (DENY)
- `X-Content-Type-Options`: Prevents MIME sniffing (nosniff)
- `X-XSS-Protection`: Enables XSS filter in older browsers
- `Strict-Transport-Security`: Forces HTTPS
- `Content-Security-Policy`: Restricts resource loading
  - Images: Self + Cloudinary
  - Scripts: Self only
  - Styles: Self + inline (for Tailwind)

### 4. **HTTPS/TLS**
- ✅ All hosting providers (Render, Railway, Vercel) provide free SSL
- ✅ `FRONTEND_URL` configured in `.env`
- ✅ CORS restricted to frontend domain only

### 5. **Payment Security**
- ✅ **Never Store Card Data**: All card data handled by Paystack
- ✅ **PCI-DSS Compliant**: Paystack is Level 1 PCI-DSS certified
- ✅ **Only Store**: Payment references, order amounts, statuses

### 6. **Database Security**
- ✅ **Parameterized Queries**: All queries use `$1, $2` placeholders (prevents SQL injection)
- ✅ **Encryption at Rest**: Managed PostgreSQL (Supabase/Render) encrypts data automatically
- ✅ **Connection Pooling**: Secure connection management

### 7. **Authentication**
- ✅ **JWT Tokens**: Short-lived access tokens
- ✅ **HttpOnly Cookies**: (Can be added if needed)
- ✅ **Token Expiration**: Configurable via `JWT_SECRET`

---

## 🚀 Testing Security Features

### Test Rate Limiting

**Login Rate Limit:**
```bash
# Try to login 6 times rapidly
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo "\nAttempt $i"
done

# 6th attempt should return 429 Too Many Requests
```

**Password Reset Rate Limit:**
```bash
# Try to request password reset 4 times
for i in {1..4}; do
  curl -X POST http://localhost:5000/api/password-reset/request \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
  echo "\nAttempt $i"
done

# 4th attempt should return 429 Too Many Requests
```

### Test Security Headers

```bash
curl -I http://localhost:5000/api/health

# Should see headers like:
# X-DNS-Prefetch-Control: off
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 0
# Strict-Transport-Security: max-age=15552000; includeSubDomains
```

---

## 🔐 Environment Variables for Security

Add to `.env`:

```env
# JWT Secret (generate with: openssl rand -hex 32)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Email for Password Reset
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-digit-app-password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

---

## 📋 Security Checklist (Production)

### High Priority ✅
- [x] HTTPS enabled
- [x] Rate limiting on auth endpoints
- [x] Security headers (Helmet.js)
- [x] Password hashing (bcrypt)
- [x] Parameterized SQL queries
- [x] CORS configured
- [x] Password reset flow
- [ ] JWT token expiration (short-lived)
- [ ] Email verification (prevents fake accounts)

### Medium Priority
- [ ] Google OAuth (easier login)
- [ ] 2FA for sellers (optional)
- [ ] Session management (logout all devices)
- [ ] Account lockout after N failed attempts
- [ ] Audit logs (track suspicious activity)

### Low Priority (Nice to Have)
- [ ] IP whitelisting for admin
- [ ] Webhook signature verification
- [ ] Content Security Policy reporting
- [ ] Rate limiting per user (not just IP)

---

## 🛡️ What We DON'T Store

**Never stored in database:**
- ❌ Credit/debit card numbers
- ❌ CVV codes
- ❌ Raw passwords
- ❌ Social Security Numbers
- ❌ Bank account passwords

**What we DO store:**
- ✅ Hashed passwords (bcrypt)
- ✅ Payment references (from Paystack)
- ✅ User emails, names, addresses
- ✅ Order details, amounts

---

## 🚨 Security Incidents

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email: security@buytree.ng (or your contact)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Your contact information

We aim to respond within 48 hours.

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Paystack Security](https://paystack.com/security)

---

## 🔄 Security Updates

Last Updated: $(date +%Y-%m-%d)

**Recent Changes:**
- 2025-01-XX: Added rate limiting for auth and password reset
- 2025-01-XX: Implemented security headers with Helmet.js
- 2025-01-XX: Added password reset functionality

---

**Remember:** Security is an ongoing process, not a one-time setup. Regularly review and update security measures.
