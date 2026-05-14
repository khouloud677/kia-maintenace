# Kia Tunisia RDV Platform

Production-oriented Next.js platform for Kia maintenance appointments in Tunisia with two access modes:
- Guest website mode (no account)
- Mobile app mode (Keycloak-authenticated users)

## Stack
- Frontend: Next.js App Router + TypeScript + Tailwind CSS
- Backend: Next.js API routes
- ORM: Prisma
- Database: PostgreSQL
- OCR: Tesseract.js
- Notifications: Email (SMTP) + SMS (Twilio)
- Maps: Google Maps deep-link integration from agency coordinates

## Main Features
### Guest Website Flow

- Home landing page with stats and CTA
- Booking flow with:
	- VIN + matricule (or foreign car)
	- OCR scan with manual correction
	- SMS/Email verification code
	- Service and agency selection
	- Map link for agency location
	- Date/time confirmation
- Tracking with:
	- RDV reference, or
	- VIN (+ optional matricule)
- Reclamations and feedback forms
- FAQ page

### Mobile Flow (API for mobile app)
- Keycloak JWT validation
- Profile get/update
- Car management (user can save multiple cars)
- Appointment booking from saved cars
- Dashboard with active appointments by car
- Appointments list endpoint

### Business Rules
- Guest and mobile flows are separated in API logic and data ownership
- Same car can be used in both flows (VIN-based shared car model)
- Duplicate/overlapping appointments are blocked in a +/- 2 hour window per car
- OCR output is always editable in UI

## Project Structure
- `prisma/schema.prisma`: data model
- `prisma/seed.ts`: agencies/services seed
- `src/app/api/**`: API routes for guest, mobile, OCR, feedback, tracking
- `src/app/page.tsx`: landing page
- `src/app/book/page.tsx`: guest booking flow
- `src/app/track/page.tsx`: tracking page
- `src/app/faq/page.tsx`: faq, reclamation, feedback
- `src/lib/*`: shared business logic (auth, notifications, validation, references)

## Database Design Notes
Guest flow:

- `GuestSession` stores verification state (`token`, code hash, expiry, verifiedAt)
- Guest appointment links to `guestSessionId`, contact email/phone, and vehicle

User flow:
- `User` keyed by `keycloakSub`
- `User` has many `Car`
- `Car` has many `Appointment`
- Mobile appointment links to `userId`

Shared car usage:
- `Car` is unique by VIN
- Guest and user bookings can target the same VIN safely

## Environment
Create `.env` with at least:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kia_rdv"

# Keycloak
KEYCLOAK_ISSUER_URL="https://keycloak.example.com/realms/kia"
KEYCLOAK_AUDIENCE="kia-mobile"
KEYCLOAK_CLIENT_ID="kia-web"
KEYCLOAK_CLIENT_SECRET="..."
KEYCLOAK_WEB_REDIRECT_URI="http://localhost:3000/api/auth/keycloak/callback"

# SMTP
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user"
SMTP_PASS="pass"
SMTP_FROM="noreply@kia.tn"

# Twilio
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_FROM_NUMBER="+1..."
```

If notification credentials are missing, the app uses safe console mock sends.

## Setup

```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

## API Summary

Guest:

- `POST /api/guest/verification/start`
- `POST /api/guest/verification/confirm`
- `POST /api/appointments/guest`
- `GET /api/appointments/track`

Catalog:

- `GET /api/services`
- `GET /api/agencies`

Extras:

- `POST /api/ocr/vehicle`
- `POST /api/reclamations`
- `POST /api/feedback`

Mobile (Keycloak bearer token):

- `GET|PUT /api/mobile/profile`
- `GET|POST /api/mobile/cars`
- `GET|POST /api/mobile/appointments`
- `GET /api/mobile/dashboard`

Web Keycloak session:

- `GET /api/auth/keycloak/login`
- `GET /api/auth/keycloak/callback`
- `GET /api/auth/keycloak/logout`
- `GET /api/auth/me`

## Notes for Production

- Replace mock notification fallback with monitored providers
- Add Redis rate limiting for OTP endpoints
- Add observability (OpenTelemetry + logs)
- Add background worker for ready-status notification fanout
- Integrate mobile push provider (FCM/APNS)
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
