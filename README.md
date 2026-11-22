# StudyCircle

Find study partners in your course, schedule sessions, share notes and chat.
React + Vite front-end, Node + Express API, SQLite database.

## Run it

Requires Node.js 18 or newer (https://nodejs.org, LTS).

```bash
npm install
npm run dev
```

Open http://localhost:5173. This starts the API (port 4000) and the web app (port 5173) together.
The database is created and filled with sample data the first time the server starts.

**Demo login:** click "Continue with demo account", or use `alex@school.edu` / `demo1234`.
Sample classmates use `password123` (e.g. `ana@school.edu`).

To see it work between two people, open a second private/incognito window, sign up with another
email (same school: *University of San Carlos*), pick `CIS 2102`, click **Auto-match me**,
and chat. Messages appear in both windows within a few seconds.

## Put it on the web
See [DEPLOY.md](DEPLOY.md) for GitHub + Render (free) step by step.

## Other commands

| Command | What it does |
|---|---|
| `npm start` | Builds the web app and serves everything from one server at http://localhost:4000 |
| `npm run test:api` | Runs the API tests against a throwaway database |
| Delete `server/data/` | Resets the database to the sample data |

## How it's built

```
server/index.js   REST API (auth, groups, matching, chat, sessions, notes/files)
server/db.js      SQLite schema (users, groups, members, messages, sessions, rsvps, items)
server/seed.js    Sample data
src/store.jsx     API client + app state (polls the server every 4 s for new activity)
src/lib/match.js  Matching score (used by both the app and the server)
```

- **Auth:** passwords hashed with bcrypt; login returns a 14-day signed token (JWT).
- **Access rules:** only members can read or write a group's chat, sessions, notes and files.
  People only see groups from their own school.
- **Files:** drag & drop (or browse) PDFs and other files, up to 10 MB each and 10 at a time. Stored on disk in `server/data/uploads` and served only to group members. PDFs can be opened in a new tab.
- **Courses & goals:** each person lists their own courses (any code + optional name, e.g. `CIS 2102`) and writes their own study goal. Course codes are tidied (`cis2102` → `CIS 2102`) so classmates match.
- **Matching:** a group must be for a course you take; score = overlap of free time slots, plus a bonus for the same study goal.

## API (all under /api, JSON; send `Authorization: Bearer <token>`)

| Method & path | Purpose |
|---|---|
| POST `/auth/signup`, `/auth/login`, `/auth/demo` | Get a token |
| GET `/bootstrap` | Your profile, groups, chat, sessions, files |
| PATCH `/me` | Update profile (courses, availability, goal…) |
| POST `/groups` | Create a group |
| POST `/groups/:id/join`, `/groups/:id/leave` | Join / leave |
| POST `/automatch` | Join the best group for each of your courses |
| GET/POST `/groups/:id/messages` | Chat (`?after=<id>` for new messages only) |
| POST `/groups/:id/sessions` · POST `/sessions/:id/rsvp` · DELETE `/sessions/:id` | Study sessions |
| POST `/groups/:id/notes` · POST `/groups/:id/files` | Share a note / upload a file |
| GET `/items/:id/download` · DELETE `/items/:id` | Download / remove |

## Ideas for next steps
Real-time chat with WebSockets, school-email verification, password reset, and deploying
(set `JWT_SECRET` and `PORT`; keep `server/data` on a persistent disk).
