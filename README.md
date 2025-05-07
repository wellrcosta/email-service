# Email Service

A lightweight and production-ready microservice for sending emails using **RabbitMQ**, **Redis** (for retries and rate limiting), and **SMTP** (Mailtrap, Gmail, or any provider).

---

## 🚀 Features

- Consume email requests from RabbitMQ
- Send emails via SMTP
- Retry failed deliveries using Redis
- Rate limit the number of emails sent per minute
- Dead Letter Queue (DLQ) support for permanently failed emails
- Graceful shutdown on termination signals
- Structured JSON logging (ready for Loki integration)
- Healthcheck endpoint (`GET /health`)

---

## 🛠️ Technologies

- Node.js 20 (TypeScript)
- Express (for Healthcheck only)
- amqplib (RabbitMQ client)
- ioredis (Redis client)
- nodemailer (SMTP email sending)
- Docker + Docker Compose (multi-stage, minimal production image)

---

## 📦 Setup

### 1. Clone the repository

```bash
git clone https://github.com/wellrcosta/email-service.git
cd email-service 
```

### 2. Configure environment variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` to match your SMTP or SendGrid provider and queue configurations.

---

## 🐳 Running locally with Docker Compose

```bash
docker-compose up --build
```

- **Email Service** will be available at `http://localhost:3000`
- **RabbitMQ Management UI** will be available at `http://localhost:15672`  
  (Login: `guest` / `guest`)
- **Redis** will be running at `localhost:6379`

---

## 📬 Sending an email (Publishing to RabbitMQ)

You can manually send a test message using RabbitMQ Management UI or any AMQP client.

Example payload:

```json
{
  "to": "recipient@example.com",
  "subject": "Test Email",
  "bodyHtml": "<h1>Hello, World!</h1>",
  "bodyText": "Hello, World!",
  "attachments": [
    {
      "filename": "test.txt",
      "path": "/path/to/file/test.txt"
    }
  ]
}
```

**Important:**
- Either `bodyHtml` or `bodyText` must be provided.
- Attachments are optional.

---

## 🛡️ Healthcheck

Check if the service is healthy:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

---

## 🛉 Project Structure

```
src/
├── app.ts              # Application entrypoint
├── application/        # Use cases and service contracts
├── config/             # Environment configs
├── domain/             # Entities
├── infra/              # Providers (SMTP, Redis, RabbitMQ)
├── middlewares/        # Payload validation
├── shared/             # Logger and Graceful shutdown
└── web/                # Express server for healthcheck
test/
├──                     # Where the tests is located
```

---

## 🛠️ Building only the Docker image

If you want to build the image without running:

```bash
docker build -t email-service .
```

To run it manually:

```bash
docker run -p 3000:3000 email-service
```

---

## 📈 Logging

All logs are structured in JSON format, including:

- Timestamp
- Log Level (`info`, `warn`, `error`)
- Message
- Additional metadata (such as email address, retry count, etc)

Example log:

```json
{
  "timestamp": "2025-04-28T20:00:00.000Z",
  "level": "info",
  "message": "Email processed successfully",
  "email": "user@example.com"
}
```

---

## 🧠 Notes

- RabbitMQ retry logic is managed via Redis counters.
- After exceeding max retries, messages are moved automatically to the Dead Letter Queue (`DLQ`).
- Rate limiter controls the number of emails per minute per recipient.
- Healthcheck endpoint (`/health`) can be used by monitoring tools.
- Fully ready for production use.

---

## ✨ Future improvements (optional)

- Implement metrics (Prometheus exporter)
- Support multiple SMTP providers dynamically
- Circuit Breaker pattern for SMTP failures

---

## 👨‍💻 Author

Developed by Wellington Reis.
