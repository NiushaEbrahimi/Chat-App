# ChatApp

A full-stack real-time chat application built with React, TypeScript, and Django. The project covers the full development lifecycle — authentication, WebSocket messaging, state management, REST API design, and CI-ready project structure.

---

## Tech stack

**Frontend**

- React 18 with TypeScript
- Redux Toolkit — global client state (auth, UI, typing indicators)
- TanStack React Query — server state, message history with infinite scroll
- Axios with JWT interceptor — silent token refresh and request queuing
- React Hook Form with Zod — form validation
- React Router v6 — client-side routing and protected routes
- Vite — build tool and dev server

**Backend**

- Django 5 with Django REST Framework
- Django Channels — WebSocket support
- Simple JWT — access and refresh token authentication
- Redis — channel layer for broadcasting WebSocket events
- Daphne — ASGI server
- PostgreSQL (production) / SQLite (development)

---

## Features

- JWT authentication with silent token refresh. The axios interceptor catches 401 responses, refreshes the access token in the background, and retries the original request without the user noticing.
- Email or username login. A custom Django authentication backend resolves both identifiers before passing to the token layer.
- Password reset via Gmail SMTP. Tokens are generated with Django's built-in `default_token_generator`, tied to the user's password hash so they self-invalidate after use.
- Real-time messaging over a persistent WebSocket connection. One endpoint handles all event types — messages, typing indicators, online status, and read receipts.
- Typing indicators with debounce. Sends `typing_start` once per typing session and `typing_stop` after two seconds of inactivity.
- Read receipts tracked with `IntersectionObserver`. Messages are marked as read when they become fully visible in the viewport.
- Online and offline presence. User status is broadcast to all shared rooms on connect and disconnect.
- Infinite scroll for message history using `useInfiniteQuery` with cursor-based pagination.
- Rate limiting on auth endpoints. Login and password reset are protected at 5 requests per minute per IP.
- Vague error responses on auth failure to prevent account enumeration.

---

## Project structure

```
chatapp/
├── backend/
│   ├── apps/
│   │   ├── users/          — custom user model, JWT auth, password reset
│   │   └── chat/           — rooms, messages, WebSocket consumer
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── asgi.py         — HTTP + WebSocket routing
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── api/            — axios instance, auth and chat endpoints
│       ├── features/
│       │   ├── auth/       — login, register, forgot/reset password, protected route
│       │   └── chat/       — conversation list, message thread, input, typing indicator
│       ├── hooks/          — useAuth, useWebSocket, useDebounce
│       ├── store/
│       │   └── slices/     — authSlice, chatSlice
│       └── types/          — shared TypeScript interfaces
│
└── .github/
    └── workflows/          — CI pipelines for frontend and backend
```

---

## Data models

**User** — extends Django's `AbstractUser`. Adds `avatar`, `is_online`, and `last_seen`. Uses UUID primary keys. Login is by email or username.

**Room** — represents a conversation. Can be a direct message (no name, two members) or a group (named, multiple members). Tracks `created_by` and exposes a `get_channel_group_name()` method used by the WebSocket consumer to address Redis groups.

**Message** — belongs to a room and a sender. Supports text, image, and file types. Indexed on `created_at` for efficient pagination.

**MessageRead** — one row per user per message, enforced with `unique_together`. Used to render read receipts.

**Reaction** — stores emoji reactions per user per message, also with `unique_together`.

---

## Authentication flow

```
Register   POST /api/auth/register/
Login      POST /api/auth/token/          returns access (15 min) + refresh (7 days)
Refresh    POST /api/auth/token/refresh/  handled silently by axios interceptor
Logout     POST /api/auth/logout/         blacklists the refresh token
Profile    GET  /api/auth/me/
Reset      POST /api/auth/password-reset/
Confirm    POST /api/auth/password-reset/confirm/
```

Tokens are stored in `localStorage` and rehydrated into Redux on page load. The axios request interceptor attaches the `Authorization` header to every request. A response interceptor catches 401s, queues concurrent requests, refreshes the token once, and replays the queue — preventing the race condition where multiple requests trigger parallel refresh calls.

---

## WebSocket event types

All chat events travel over a single WebSocket connection at `ws://host/ws/chat/?token=<access_token>`.

| Direction | Type | Payload |
|---|---|---|
| client → server | `send_message` | `room_id`, `content` |
| client → server | `typing_start` | `room_id` |
| client → server | `typing_stop` | `room_id` |
| client → server | `message_read` | `message_id` |
| server → client | `new_message` | `message_id`, `room_id`, `sender_id`, `content`, `created_at` |
| server → client | `typing_indicator` | `room_id`, `user_id`, `username`, `is_typing` |
| server → client | `message_read` | `message_id`, `room_id`, `user_id` |
| server → client | `online_status` | `user_id`, `username`, `is_online` |

Close code `4001` signals an unauthorized connection. The frontend `useWebSocket` hook handles this separately from network errors and waits for a token refresh before reconnecting.

---

## Running locally

**Requirements:** Python 3.11+, Node 18+, Redis

**Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env          # fill in SECRET_KEY and email credentials
python manage.py migrate
python manage.py createsuperuser
daphne -p 8000 config.asgi:application
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env.local    # set VITE_API_URL and VITE_WS_URL
npm run dev
```

**Redis** (required for WebSocket broadcasting)

```bash
redis-server
```

The frontend runs on `http://localhost:5173` and connects to the backend at `http://localhost:8000`.

---

## Environment variables

**backend/.env**

```
SECRET_KEY=
DEBUG=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
FRONTEND_URL=http://localhost:5173
```

**frontend/.env.local**

```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## Branch strategy

```
main        production-ready, protected
dev         integration branch, CI runs on every push
feature/*   one branch per feature, merged into dev via pull request
fix/*       bug fixes, same lifecycle as feature branches
```

Commits follow the conventional commits format: `feat(auth): add JWT refresh interceptor`.

---

## Security notes

- Auth endpoints return identical error messages regardless of whether the identifier exists, preventing account enumeration.
- Password reset tokens are generated by Django's `default_token_generator` and are tied to the user's current password hash. They invalidate automatically when the password changes.
- The refresh token is blacklisted on logout using `djangorestframework-simplejwt`'s token blacklist app.
- Login and password reset endpoints are rate limited at 5 requests per minute per IP.
- Usernames are restricted to alphanumeric characters and underscores, making the `@` symbol a reliable signal for email detection in the authentication backend.
