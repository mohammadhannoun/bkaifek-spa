# Bkaifek Backend

## Overview

Bkaifek is a mentorship platform that connects mentors and mentees. This repository contains the backend API built with Express.js and TypeScript.

## Tech Stack

- **Framework**: Express.js 5
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Development**: ts-node-dev for hot reloading
- **Testing**: Jest

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/bkaifek.git
cd bkaifek/backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables (if it is not created):

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret
DATABASE_URL=postgresql://username:password@localhost:5432/bkaifek
```

4. Set up the database:

```bash
npm run db:setup
```

5. Start the development server:

```bash
npm run dev
```

## API Documentation

Detailed API documentation is available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── tests/              # Test files
├── .env               # Environment variables
├── package.json       # Project dependencies
└── tsconfig.json      # TypeScript configuration
```

## Testing

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run linter
- `npm run format` - Format code
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with test data

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Most endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

The API follows a consistent error response format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
