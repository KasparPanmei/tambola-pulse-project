# Tambola Pulse — standalone MERN checkout module

Implements the supplied HTML flow: room card → ticket selection → player/OTP → payment method → UPI QR checkout → payment verification → room entry state.

**Demo payment only:** the supplied HTML simulated bank verification, so this implementation keeps that behavior. Replace the demo endpoint with a real payment gateway/webhook before production.

## Requirements
Node.js 20+, MongoDB 7+ (local or Atlas).

## Run
```bash
cd server
npm install
cp .env.example .env
npm run seed
npm run dev
```
In another terminal:
```bash
cd client
npm install
npm run dev
```
Client: http://localhost:5173 | API: http://localhost:5000

Development OTP is returned by the API and printed by the server. Never expose OTPs this way in production.

## Production
Use a real SMS provider, gateway-side payment verification/webhooks, atomic ticket reservation/transactions, HTTPS, secure cookies or short-lived tokens, rate limiting, audit logs, and applicable legal/KYC/tax/consumer-protection requirements for any real-money gaming deployment.
