# Orbit Activity Marketplace Backend - AI Coding Guide

## Architecture Overview

This is a **NestJS + Fastify + Prisma + Redis** marketplace backend for activity booking. The app connects users with activity vendors through a recommendation system and handles payments/calendaring.

**Core Domain Models:**

- `User` ↔ `Activity` ↔ `Vendor` (many-to-many via likes/subscriptions)
- `CalendarEvent` links users to booked activities
- `Payment` tracks transactions between users/vendors/activities
- `Auth` handles authentication for both users and vendors with role-based access

## Critical Patterns & Conventions

### Authentication System

- **Token-based auth**: Uses custom `AuthGuard` that validates Bearer tokens stored in `auth.accessToken`
- **Role system**: `AuthRole` enum (USER, VENDOR, SUPERUSER) with `@AuthRole()` decorator
- **Auth injection**: Use `@Auth()` parameter decorator to get current auth record in controllers
- **Public routes**: Mark with `@Public()` decorator to bypass auth guard

```typescript
// Example controller method
@Get('profile')
@AuthRole('USER')
async getProfile(@Auth() auth: any) {
  return this.userService.getProfile(auth.userId);
}
```

### Module Structure Pattern

- Each domain has: `module.ts`, `controller.ts`, `service.ts`, `dto.ts`
- Always import `PrismaModule` for database access
- Services contain business logic, controllers handle HTTP concerns
- Use `class-validator` decorators in DTOs for request validation

### Caching Strategy

- **Redis-based**: Uses global interceptors `ReadCacheInterceptor` and `WriteCacheInterceptor`
- Cache keys are automatically generated from route patterns
- Import `CacheModule` in app.module.ts, Redis config comes from environment

### Recommendation Engine

- **Dual-mode system**: Single user recommendations (`single.core.ts`) and group recommendations (`group.core.ts`)
- Uses user preferences stored as JSON in `User.preferences`
- Activity scoring based on category preferences, location, and social signals
- Located in `src/recommendation/engine/` with separate test files

### Database Patterns

- **Prisma ORM**: Schema in `prisma/schema.prisma` with PostgreSQL backend
- **Self-referencing relations**: Categories have parent/child hierarchy, Users have friends
- **JSON fields**: Store complex data like `Activity.availability`, `User.preferences`
- **Enums**: Use Prisma enums for constrained values (`PaymentStatus`, `AuthRole`)

## Development Workflows

### Database Operations

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name description_of_change

# View database in browser
npx prisma studio
```

### Running & Testing

```bash
# Development with hot reload
npm run start:dev

# Build and production start
npm run build && npm run start:prod

# Testing
npm test                 # Unit tests
npm run test:e2e        # End-to-end tests
npm run test:cov        # Coverage report
```

### Deployment

- Uses PM2 for production process management
- Deployment via `deploy.bat` - SSH deploys to Ubuntu server
- Builds dist folder and restarts PM2 service named `orbit-api`

## Key Integration Points

### Swagger API Documentation

- Auto-generated at `/docs` endpoint in development
- Uses `@nestjs/swagger` decorators on controllers/DTOs
- Bearer token auth configured for protected endpoints

### Email Service

- Integrated via `EmailModule` for auth verification and notifications
- Uses nodemailer with environment-based SMTP configuration

### Payment Processing

- `PaymentModule` handles transactions with status tracking
- Supports multiple payment methods via `PaymentMethod` enum
- Links users, vendors, and activities in payment records

### Calendar Integration

- `CalendarEventModule` manages activity bookings
- Includes availability checking logic in `availability-check.ts`
- Time-based scheduling with start/end DateTime fields

## File Organization Principles

- **Common utilities**: `src/common/` contains shared decorators, guards, interceptors
- **Domain separation**: Each business domain gets its own module folder
- **Script utilities**: `scripts/` folder contains data seeding and test entity creation
- **Type safety**: Leverage TypeScript strict mode and Prisma type generation

## Testing Patterns

- Jest configuration in `package.json` with TypeScript support
- Test files use `.spec.ts` suffix and live alongside source files
- Recommendation engine has dedicated spec files for complex algorithms
- Use `@nestjs/testing` for NestJS-specific test utilities

When working on this codebase:

1. Always run `npx prisma generate` after schema changes
2. Use the established auth decorators rather than manual token validation
3. Follow the module-service-controller pattern for new features
4. Leverage the existing caching system for read-heavy operations
5. Consider recommendation engine impacts when modifying user/activity relationships
