# Tambola Pulse — Twilio Verify OTP setup

The player checkout and admin login both use `/api/auth/request-otp` and `/api/auth/verify-otp`. The backend now uses Twilio Verify to send/check SMS codes; OTP values are not printed to logs or returned to the frontend.

## Twilio Console

1. Create/sign in to a Twilio account.
2. Open Verify and create a Verify Service.
3. Copy the Account SID, Auth Token, and Verify Service SID.
4. In a trial account, verify the recipient phone number(s) first. Trial account restrictions apply.
5. Confirm Twilio supports your Tambola Pulse use case and destination-country requirements before production use. Twilio's India SMS guidelines prohibit gambling-related messaging; obtain confirmation from Twilio compliance before using it for a paid/prize-based Tambola service.

## Render backend environment

Add these to the Render Web Service environment (never to the Vite client):

- `TWILIO_ACCOUNT_SID`: Twilio Account SID (`AC...`)
- `TWILIO_AUTH_TOKEN`: Twilio Auth Token
- `TWILIO_VERIFY_SERVICE_SID`: Verify Service SID (`VA...`)
- `MONGO_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: a strong random secret
- `CLIENT_URL`: deployed Render Static Site URL
- `NODE_ENV`: `production`

The code converts unprefixed 10-digit Indian mobile numbers to `+91` for Twilio while preserving the existing phone value for database lookup. Other destinations must be entered with country code in E.164 form.

## Render service settings

Backend Web Service:
- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`

Frontend Static Site:
- Root directory: `client`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment: `VITE_API_URL=https://YOUR-API.onrender.com/api`

Set `CLIENT_URL` on the backend to the exact frontend URL. Redeploy both services after saving the environment variables.
