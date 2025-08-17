# Next.js Todo App on GCP Cloud Run

This project is a full-stack Next.js todo app with MySQL, containerized for Cloud Run, and CI/CD via Cloud Build.

## Features

- Next.js frontend and API routes
- MySQL (Cloud SQL) backend
- Dockerized for Cloud Run
- Automated build, test, and deploy with Cloud Build
- Unit tests for API and frontend

## Local Development

1. Copy `.env.example` to `.env` and set your DB credentials.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start MySQL locally (or use Docker Compose):

   ```bash
   docker-compose up db
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

## Testing

```bash
npm run test
```

## Deployment to GCP

1. Create a Cloud SQL instance and database.
2. Set up your Cloud Run and Cloud Build permissions.
3. Update `cloudbuild.yaml` with your DB credentials.
4. Push to your repository (Cloud Build will trigger):

   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

Cloud Build will:
- Install dependencies
- Run unit tests
- Build and push Docker image to GCR
- Deploy to Cloud Run

## Environment Variables

See `.env.example` for required variables.

- For **local development**, set DB_HOST to your local MySQL host (e.g., `localhost` or the Docker Compose service name).
- For **Cloud Run deployment**, DB_HOST is set to the Cloud SQL Unix socket path via `--set-env-vars` in `cloudbuild.yaml` (e.g., `/cloudsql/YOUR_PROJECT_ID:us-central1:todo-mysql`). The `.env` file is not used in Cloud Run.

## SQL Schema

```sql
CREATE TABLE todos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  text VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE
);
```

## License

MIT

update to trigger
