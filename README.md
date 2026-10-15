# devxtools.dev Tutorial Series - Sample App

> React Native (Expo) + Node.js backend monorepo for the devxtools.dev tutorial series

This repository contains a fully-typed, production-ready monorepo showcasing modern React Native development with a Node.js backend. It serves as the foundation for a tutorial series covering API mocking, E2E testing, and observability.

## 📋 What's Inside

A simple **tasks/notes app** with list, create, toggle, and delete operations. The architecture demonstrates:

- ✅ Modern npm workspaces monorepo
- ✅ Latest stable versions (verified October 15, 2026)
- ✅ Full TypeScript coverage
- ✅ Shared types between frontend and backend
- ✅ Comprehensive testing setup
- ✅ CI/CD with GitHub Actions
- ✅ Linting and formatting
- ✅ Clear documentation

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

| Package                        | Version     | Purpose                           |
| ------------------------------ | ----------- | --------------------------------- |
| **Runtime**                    |
| Node.js                        | 24.22.0 LTS | Latest stable LTS                 |
| npm                            | 10.9.9+     | Package manager                   |
| **Mobile App (`apps/mobile`)** |
| Expo SDK                       | 57.0.29     | React Native platform             |
| React                          | 19.2.3      | UI framework                      |
| React Native                   | 0.86.3      | Mobile framework (pinned by Expo) |
| Expo Router                    | 57.0.27     | File-based routing                |
| TypeScript                     | 7.0.2       | Type safety                       |
| Jest                           | 30.5.2      | Test runner                       |
| @testing-library/react-native  | 12.9.0      | Component testing                 |
| **Backend API (`apps/api`)**   |
| Hono                           | 4.13.13     | Modern web framework              |
| TypeScript                     | 7.0.2       | Type safety                       |
| Vitest                         | 5.0.5       | Fast test runner                  |
| tsx                            | 4.19.2      | TypeScript execution              |
| **Shared (`packages/shared`)** |
| TypeScript                     | 7.0.2       | Shared type definitions           |
| **Development**                |
| ESLint                         | 10.12.0     | Linting                           |
| Prettier                       | 3.9.10      | Code formatting                   |

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
- Error handling scenarios

### Mobile Tests (Jest + React Native Testing Library)

Located in `apps/mobile/src/components/WelcomeMessage.test.tsx`:

- Component rendering tests
- Demonstration of testing setup
- Ready for expansion with API integration tests

## 🔄 CI/CD

GitHub Actions CI runs on every push and PR:

1. ✅ Install dependencies
2. ✅ Type check all workspaces
3. ✅ Lint all workspaces
4. ✅ Check code formatting
5. ✅ Run all tests

See `.github/workflows/ci.yml` for configuration.

## 📚 Tutorial Series Roadmap

This repository supports the following tutorials:

### 1. API Mocking (`tutorials/01-api-mocking/`)

- Setting up MSW (Mock Service Worker)
- Creating mock handlers
- Mocking in tests vs development
- Alternative: Mockifyer

### 2. E2E Testing (`tutorials/02-e2e-testing/`)

- Detox setup and configuration
- Writing E2E test flows
- Maestro as an alternative
- Running E2E in CI

### 3. Observability & Logging (`tutorials/03-observability/`)

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
