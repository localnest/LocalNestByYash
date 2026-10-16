# Google OAuth Setup & Configuration Guide

This guide describes how to configure Google Sign-In for LocalNest using Supabase Auth.

---

## 1. Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com).
2. Create or select a project: `localnest-auth`.
3. Go to **APIs & Services > Credentials**.
4. Configure the **OAuth Consent Screen**:
   - User Type: External
   - App Name: LocalNest
   - Scopes: `email`, `profile`, `openid`
5. Create an **OAuth 2.0 Client ID**:
   - Application Type: Web application
   - Name: LocalNest Web Client
   - **Authorized JavaScript Origins:**
     - `http://localhost:3000` (Local development)
     - `https://localnest-app.vercel.app` (Production)
     - `https://*.vercel.app` (Preview deployments)
   - **Authorized Redirect URIs:**
     - `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`

---

## 2. Supabase Authentication Provider Setup

1. Open your Supabase Project Dashboard.
2. Navigate to **Authentication > Providers > Google**.
3. Toggle Google to **Enabled**.
4. Enter the **Client ID** and **Client Secret** obtained from Google Cloud Console.
5. Save settings.

---

## 3. Application Redirect Flow

The application initiates login via `signInWithGoogle()`:

1. User clicks "Sign in with Google" -> redirected to Google Accounts.
2. Google redirects back to Supabase Auth callback URL.
3. Supabase redirects to LocalNest `/auth/callback?code=...` Route Handler.
4. The Route Handler exchanges the temporary code for a session and redirects the resident back to `/`.
