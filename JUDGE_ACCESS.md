# Judge Access

This app uses Supabase Auth for production-style access.

## Recommended judge flow

1. Open `http://127.0.0.1:3000/auth/signup`.
2. Create an account with name, email, and password.
3. If email confirmation is enabled in Supabase, confirm the email.
4. Sign in at `http://127.0.0.1:3000/auth/login`.
5. Open the workspace from the dashboard.

New users are assigned `Viewer` metadata by default. Admin role upgrades should be handled in Supabase or the app administration workflow.

## Local checks

- Landing page: `http://127.0.0.1:3000/`
- Signup: `http://127.0.0.1:3000/auth/signup`
- Login: `http://127.0.0.1:3000/auth/login`
- Backend health: `http://127.0.0.1:8000/api/v1/health`

## Production smoke validation

After the frontend and backend are running locally, run this from the `frontend` folder:

```bash
npm run smoke
```

The smoke validation checks backend data readiness, production readiness controls, SLA prediction evidence, and the core app routes used in the demo.
