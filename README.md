# Reservation Management System

A RESTful Reservation Management API built with NestJS, TypeScript, MongoDB, and Mongoose.

The system allows customers to browse resources, check availability, and manage their reservations. Administrators can manage resources and oversee reservations.

## Tech Stack

- Node.js
- NestJS
- TypeScript
- MongoDB
- Mongoose
- JWT Authentication
- Swagger / OpenAPI
- Bruno (API Testing)

## Core Features

### Authentication & Authorization
- User registration and login.
- Secure password hashing.
- JWT access and refresh tokens.
- Refresh token rotation and session management.
- Role-based access control (ADMIN and CUSTOMER).

### User Management
- View and update personal profiles.
- Admin access to user lists and details.
- Admin activation and deactivation of users.

### Resource Management
- Create, update, and delete resources (Admin only).
- Browse and search resources.
- Filter resources by supported criteria.
- Define resource capacity and operating hours.
- Soft deletion of resources.

### Reservation Management
- Create, view, update, cancel, and confirm reservations.
- Check resource availability.
- Filter reservations by status and date range.
- Prevent capacity conflicts and overlapping reservations.
- Handle concurrent reservation requests.
- Support reservation expiration through pending reservation leases.

## Prerequisites

- Node.js
- npm
- MongoDB (local instance or MongoDB Atlas)

## Installation

Clone the repository:

```bash
git clone https://github.com/zeiadkh/reservation-app.git
cd reservation-app
npm install
```

## Environment Configuration

Create a `.env` file in the project root using `.env.example` as a reference.

Configure the required environment variables before starting the application.

Never commit your actual `.env` file or expose your secrets.

## Running the Application

Start the development server:

```bash
npm run start:dev
```

Build the application:

```bash
npm run build
```

## API Documentation

Swagger UI is available at:

```text
http://localhost:3000/api/docs
```

Use the Swagger UI to explore the available endpoints, request DTOs, and authentication requirements.

## Testing

The APIs were tested using Bruno.

Run the automated tests:

```bash
npm test
npm run test:e2e
npm run test:cov
```

## User Roles

The application supports two roles:

- **CUSTOMER:** Can browse resources and manage their own reservations and profile.
- **ADMIN:** Can manage resources, access user management operations, and oversee reservations.

Public registration creates CUSTOMER accounts. ADMIN accounts must be provisioned through an administrative process.

## Notes

- Reservation availability is protected against overlapping bookings and capacity violations.
- Resource operating hours are validated when creating or updating reservations.
- Sensitive configuration values are provided through environment variables.