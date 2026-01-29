# MES Backend

A clean and production-ready server built with Express.js and TypeScript, for backend operations of Manipal
Entrepreneurship Summit 2026 organized by Entrepreneurship Cell, MIT Manipal.

---

### **Response Structure** (Strictly Followed)

The response format is strictly enforced and will always follow the structure outlined below:

- **`success`**: A boolean flag indicating the success or failure of the operation.
- **`message`**: A string providing additional context or details about the operation, such as status messages or error
  descriptions.
- **`payload`**: A field that may contain a defined TypeScript schema, representing the data returned from the
  operation. If there is no data, this will be `null`.
- **`error`**: This field will be included only if `success` is `false`

---

## Table of Contents

1. [Project Organisation](#project-organisation)
2. [First-Time Setup](#first-time-setup)
3. [Running Locally](#running-locally)
4. [How to Contribute](#how-to-contribute)

## Project Organisation

Here’s how the codebase is organised:

| Directory      | Purpose                          |
| -------------- | -------------------------------- |
| `src/`         | Main application code            |
| `index.js`     | Entry point for development mode |
| `server.js`    | Bootstrapping of Express app     |
| `.env.example` | Sample environment configuration |

Key files to note:

- `src/` with example feature as user
  - `/route/user.js`: handle only routes
  - `/controller/user.js`: handle only request and response functionality
  - `/service/user.js`: handle business logic
  - `/model/user.js`: contain database (e.g. MongoDb through Mongoose or SQL) models, preferably with request zod
    schemas
  - `src/middleware/requestLogger.ts`: logging setup.
  - `src/utils/envConfig.ts`: environment schema with Zod.

---

## First-Time Setup

### Dependencies

- Node.js (preferably LTS version)
- pnpm (or NPM/Yarn, but `pnpm` is used by default)

### Setup Steps

```bash
# Clone repository
git clone https://github.com/E-Cell-MIT-MPL/mes-backend.git
cd mes-backend

# Install dependencies
npm install
# or
pnpm install

# Copy the environment template
cp .env.example .env
# Then edit `.env` to fill in any required variables (see `.env.example`)
```

---

## Running Locally

For development:

```bash
pnpm dev
# or
npm run dev
```

This runs in watch mode, restarting on changes.

For production simulation:

```bash
# Remember to set NODE_ENV to "production"
pnpm start
# or
npm run start
```

The server listens (by default) on the port specified in your `.env` (e.g., `PORT=8080`). Health Check endpoint is
available at `/health-check`.

---

## How to Contribute

1. Create a new branch: `git checkout -b feature/your-feature`.
2. Make your changes, ensure tests pass, if implemented.
3. Follow the existing code style (passing lints `npm run lint` or `pnpm lint`; formatted code `npm run format` or
   `pnpm format`)
4. Commit with clear message and push your branch.
5. Open a pull request describing your change and why it’s beneficial.
6. The head will review and merge once CI (if configured) is passing.

Keep changes minimal and focused, and document any major additions.

---

Kudos to you for being a backend contributor for E-Cell. Thanks and hope to see your code powering our technical
infrastructure.
