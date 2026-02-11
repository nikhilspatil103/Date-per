# DatePer Backend API

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Install MongoDB:
```bash
brew install mongodb-community
brew services start mongodb-community
```

3. Start server:
```bash
npm run dev
```

## API Endpoints

### POST /auth/signup
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### POST /auth/login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### GET /auth/me
Headers: `Authorization: Bearer <token>`

## Update Frontend

Replace API URL in app with: `http://localhost:3000/auth/login`
