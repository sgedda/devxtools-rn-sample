# devxtools.dev Tutorial Series - Sample App

> React Native (Expo) + Node.js backend monorepo demonstrating API mocking, testing, and observability

This repository contains a learning-focused monorepo that teaches modern React Native development practices. It features an interactive task management app that showcases **API mocking with MSW**, deterministic testing, and observable network behavior.

## 🎯 What This App Teaches

This is a **teaching demo** that makes testing tools visible and shows why they're needed:

1. **The Problem**: Your backend is slow, flaky, unfinished, or offline—and you can't reproduce edge cases
2. **The Solution**: Intercept requests at the network layer with MSW (Mock Service Worker)
3. **The Experience**: Switch between real API and mocked data **without changing your app code**

### Key Features

- 🔄 **Live data source switching** - Toggle between real API, MSW mocks, and recorded fixtures
- 🎭 **One-tap scenarios** - Instantly trigger empty, slow, 500 error, validation, offline, and flaky states
- 📊 **Network inspector** - See every request marked as real, mocked, or replayed
- 🧪 **Same mocks in tests** - Jest tests reuse the exact same MSW handlers
- 🔗 **Deep-link scenarios** - `devxtools://lab?scenario=error500` for deterministic E2E testing
- ♿ **Full accessibility** - testIDs, screen reader support, WCAG compliance

The app demonstrates that **the UI code never changes**—only the network layer does. This is the core value of API mocking.

## 🏗️ Architecture

```
devxtools-rn-sample/
├── apps/
│   ├── mobile/          # Expo app (React Native 0.86.3)
│   └── api/             # Hono backend (Node.js 24.22.0)
├── packages/
│   └── shared/          # Shared TypeScript types
├── tutorials/           # Future tutorial content
│   ├── 01-api-mocking/
│   ├── 02-e2e-testing/
│   └── 03-observability/
└── .github/workflows/   # CI configuration
```

## 📦 Technology Stack

### Verified Versions (as of October 15, 2026)

| Package                        | Version     | Purpose                                    |
| ------------------------------ | ----------- | ------------------------------------------ |
| **Runtime**                    |
| Node.js                        | 24.22.0 LTS | Latest stable LTS ('Krypton', Oct 2025)    |
| npm                            | 10.9.9+     | Package manager                            |
| **Mobile App (`apps/mobile`)** |
| Expo SDK                       | 57.0.30     | React Native platform                      |
| React                          | 19.3.1      | UI framework                               |
| React Native                   | 0.86.3      | Mobile framework (pinned by Expo SDK 57)   |
| Expo Router                    | 57.0.28     | File-based routing                         |
| TypeScript                     | 6.0.3       | Type safety (limited by typescript-eslint) |
| Jest                           | 30.5.2      | Test runner                                |
| @testing-library/react-native  | 14.1.0      | Component testing                          |
| **Backend API (`apps/api`)**   |
| Hono                           | 4.13.13     | Modern web framework                       |
| TypeScript                     | 6.0.3       | Type safety (limited by typescript-eslint) |
| Vitest                         | 5.0.5       | Fast test runner                           |
| tsx                            | 4.19.2      | TypeScript execution                       |
| @types/node                    | 24.19.2     | Node.js type definitions (for Node 24 LTS) |
| **Shared (`packages/shared`)** |
| TypeScript                     | 6.0.3       | Shared type definitions                    |
| **Development**                |
| ESLint                         | 10.12.0     | Linting                                    |
| Prettier                       | 3.9.10      | Code formatting                            |

### Important Version Notes

- **React Native 0.86.3**: Pinned by Expo SDK 57. Latest npm version (0.88.0) is not compatible with Expo 57. Always use the version Expo pins (`npx expo install react-native --check`).
- **TypeScript 6.0.3**: TypeScript 7.0.2 is available but not yet supported by @typescript-eslint/parser (requires <6.1.0). Will upgrade when typescript-eslint v9+ is released.
- **Node.js 24.22.0**: Latest LTS version 'Krypton', released October 2025.

### Why Hono?

Hono was chosen for the backend over Fastify because:

- **Modern**: Built for edge runtimes and modern JavaScript
- **Minimal**: Smaller footprint, simpler API
- **Fast**: Excellent performance benchmarks
- **Typed**: First-class TypeScript support
- **Flexible**: Works with Node.js, Deno, Bun, Cloudflare Workers
- **Active**: Rapidly growing ecosystem and community

## 🚀 Quick Start

### Prerequisites

- Node.js 24.22.0+ (use `.nvmrc`)
- npm 10.0.0+
- iOS Simulator (macOS) or Android Emulator/Device

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd devxtools-rn-sample

# Use correct Node version
nvm use

# Install all dependencies
npm install

# Verify everything works
npm run typecheck
npm run lint
npm test
```

### Development

**Terminal 1 - Start the API:**

```bash
npm run dev:api
# API runs on http://localhost:3000
```

**Terminal 2 - Start the mobile app:**

```bash
npm run dev:mobile
# Follow Expo CLI prompts to open on iOS, Android, or Web
```

### Testing

```bash
# Run all tests
npm test

# Run tests in a specific workspace
npm test --workspace=apps/api
npm test --workspace=apps/mobile

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

## 📱 API Endpoints

The API server provides the following endpoints:

### Health & Logging

- `GET /health` - Health check endpoint (returns status, timestamp, uptime)
- `POST /logs` - Client logging endpoint for observability demos

### Tasks CRUD

- `GET /tasks` - List all tasks
- `GET /tasks/:id` - Get a specific task
- `POST /tasks` - Create a new task (body: `{ title: string }`)
- `PATCH /tasks/:id` - Update a task (body: `{ completed?: boolean, title?: string }`)
- `DELETE /tasks/:id` - Delete a task

## 🧪 Testing Strategy

### API Tests (Vitest)

Located in `apps/api/src/app.test.ts`:

- Integration tests for all endpoints
- Request/response validation
- Validation error scenarios (empty titles, length limits)
- UUID generation testing

### Mobile Tests (Jest + MSW)

Located in `apps/mobile/src/api/__tests__/client.test.ts` and `app/(tabs)/__tests__/TasksScreen.test.tsx`:

- **API client tests** using MSW handlers (5 tests)
- **Component tests** rendering Tasks screen against MSW scenarios (2 tests)
- Demonstrates **the same handlers work in both dev and tests**
- Scenarios: success, empty, 500 error, validation
- Ready for expansion with React Native Testing Library

The mobile test setup (`jest-setup.ts`) configures MSW for Node.js test environment. This proves the core value: **write handlers once, use everywhere**.

### MSW Version: Why 2.7.0?

This project uses **MSW 2.7.0** instead of the latest 2.15.x or 3.x because:

1. **MSW 2.15.x+ has ESM issues in Jest** - Verified: `npm install msw@2.15.0 && npm test` breaks with module resolution errors
2. **MSW 3.x is ESM-only** - requires Node.js native ESM support and doesn't provide a `/native` export
3. **No React Native package** - `@msw/react-native` doesn't exist on npm
4. **Jest compatibility** - MSW 2.7.0 works seamlessly with Jest's CommonJS mode in React Native
5. **Production-ready** - MSW 2.7.0 is stable, widely used, and actively maintained
6. **Same teaching concept** - Demonstrates identical API mocking principles as newer versions

**Error when using 2.15.0:** Tests fail to import MSW modules during Jest execution. MSW 2.7.0 ships with the documented `msw/native` export and polyfills needed for React Native. The teaching concept (write handlers once, use in dev and tests) is identical across versions.

## 🔄 CI/CD

GitHub Actions CI runs on every push and PR:

1. ✅ Install dependencies
2. ✅ Type check all workspaces
3. ✅ Lint all workspaces
4. ✅ Check code formatting
5. ✅ Run all tests

See `.github/workflows/ci.yml` for configuration.

## 📚 Tutorial Series (Planned)

This repository will support the following tutorials:

### 1. API Mocking (`tutorials/01-api-mocking/`)

**Status**: Core implementation complete, tutorial content coming soon

- ✅ MSW integrated in the app with live switching
- ✅ Scenarios: empty, slow, 500, 400, offline, flaky
- ✅ Network inspector showing mocked vs real requests
- ✅ Jest tests reusing MSW handlers
- 🚧 Mockifyer replay mode (stubbed)
- 📝 Tutorial walkthrough content (planned)

### 2. E2E Testing (`tutorials/02-e2e-testing/`)

**Status**: Planned

- testIDs added throughout the UI for E2E testing
- Deep-link scenario support (`devxtools://lab?scenario=...`)
- Detox and Maestro comparison (coming soon)

### 3. Observability & Logging (`tutorials/03-observability/`)

**Status**: Planned

- Structured logging setup
- Client-to-server log aggregation
- Error tracking
- Performance monitoring

## 🛠️ Development Workflow

### Adding Dependencies

```bash
# Root workspace
npm install <package> --workspace=root -D

# Mobile app
npm install <package> --workspace=apps/mobile

# API
npm install <package> --workspace=apps/api

# Shared types
npm install <package> --workspace=packages/shared
```

### Creating New Shared Types

1. Add types to `packages/shared/src/types.ts`
2. Export from `packages/shared/src/index.ts`
3. Use in mobile or API via `import type { ... } from '@devxtools/shared'`

### Mobile App Configuration

The mobile app uses environment variables for configuration:

```bash
# Copy the example
cp apps/mobile/.env.example apps/mobile/.env

# Edit with your values
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## 🤝 Contributing

This is a tutorial repository, but contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure tests pass: `npm test`
5. Ensure linting passes: `npm run lint`
6. Submit a pull request

## 📄 License

MIT

## 🙏 Acknowledgments

This sample app is maintained for the devxtools.dev tutorial series. It uses only open-source tools and frameworks, with no vendor lock-in or promotional content.

---

**Last Updated**: October 15, 2026
**Versions Verified**: October 15, 2026
