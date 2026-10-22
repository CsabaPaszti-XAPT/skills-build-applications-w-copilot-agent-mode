# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision:Use React components and React Router for all UI rendering and navigation. The frontend will communicate only through the shared API client and will not contain business logic or direct database access.
- Logic tier decision:Implement validation and business rules in Express routes and services. Return explicit 4xx responses for invalid requests and reserve 5xx responses for unexpected server errors.
- Data tier decision:Use Mongoose schemas for persistence and model validation. Store users, teams, and activities in MongoDB and keep data access isolated from the presentation layer.
- Activity tracking approach:Validate that userId and teamId are valid existing records before creating an activity. Compute points based on activity data and persist occurredAt automatically.
- Team management approach:Support listing and creating teams. Validate that a team name is provided and return HTTP 400 when required data is missing.
- Leaderboard approach:Aggregate activity points by team, sort descending by total points, and generate a 1-based rank for each team in the response.
- Workout suggestions approach:Find the user by email, analyze recent activities and goals, and return recommendations with a focus and explanation. Return 404 when the user does not exist.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Verifies Mongoose models, relationships, validation rules, and seed data.
  - Failures indicate schema or persistence issues.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Verifies API contract behavior, response codes, and business logic.
  - Failures indicate route, validation, or service implementation issues.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Verifies React components, routing, and API integration behavior.
  - Failures indicate UI or client-side logic issues.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Verifies TypeScript compilation succeeds.
  - Failures indicate typing or build configuration issues.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Verifies the React application builds successfully.
  - Failures indicate compilation, dependency, or bundling issues.