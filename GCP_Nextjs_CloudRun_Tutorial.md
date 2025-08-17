# Tutorial: Deploying a Next.js Todo App on GCP Cloud Run with Cloud SQL, Cloud Build, and Cloud Deploy

## Overview

This tutorial will guide you through:
- Creating a Next.js app with a todo list (CRUD)
- Containerizing the app with Docker
- Setting up a MySQL database in Cloud SQL
- Connecting the app to Cloud SQL
- Creating Cloud Build and Cloud Deploy pipelines for CI/CD
- Deploying the app to Cloud Run

---

## Prerequisites

- Google Cloud account with billing enabled
- gcloud CLI installed and authenticated
- Docker installed
- Node.js and npm installed

---

## Steps

1. **Create a Next.js Todo App**
2. **Add MySQL Integration**
3. **Containerize the App with Docker**
4. **Create a Cloud SQL (MySQL) Instance**
5. **Configure App to Connect to Cloud SQL**
6. **Test Locally with Docker**
7. **Push Code to Cloud Source Repository (or GitHub)**
8. **Set Up Cloud Build Pipeline**
9. **Set Up Cloud Deploy Pipeline**
10. **Deploy to Cloud Run**
11. **Verify Deployment**

---

## Detailed Steps

### 1. Create a Next.js Todo App

```bash
npx create-next-app@latest todo-app
cd todo-app
npm install mysql2
```
- Implement a simple todo list with CRUD operations (see code below).

### 2. Add MySQL Integration

- Create a `lib/db.js` file to handle MySQL connections.
- Use environment variables for DB credentials.

#### **Create the todos table in MySQL**

```sql
CREATE TABLE todos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  text VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE
);
```

#### **Example .env file**

```
DB_HOST=YOUR_CLOUD_SQL_IP
DB_USER=root
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=todos
```

### 3. Containerize the App with Docker

- Create a `Dockerfile`:

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start"]
```

### 4. Create a Cloud SQL (MySQL) Instance

```bash
gcloud sql instances create todo-mysql \
  --database-version=MYSQL_8_0 \
  --cpu=1 --memory=4GB --region=us-central1
gcloud sql users set-password root --host=% --instance=todo-mysql --password=YOUR_PASSWORD
gcloud sql databases create todos --instance=todo-mysql
```

### 5. Configure App to Connect to Cloud SQL

- Set environment variables in `.env`:

```
DB_HOST=YOUR_CLOUD_SQL_IP
DB_USER=root
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=todos
```

- Update `lib/db.js` to use these variables.

### 6. Test Locally with Docker

```bash
docker build -t todo-app .
docker run -p 3000:3000 --env-file .env todo-app
```

### 7. Push Code to Cloud Source Repository (or GitHub)

```bash
gcloud source repos create todo-app
git remote add google https://source.developers.google.com/p/YOUR_PROJECT_ID/r/todo-app
git push google main
```

### 8. Set Up Cloud Build Pipeline

- Create `cloudbuild.yaml`:

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/todo-app', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/todo-app']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args: ['run', 'deploy', 'todo-app', '--image', 'gcr.io/$PROJECT_ID/todo-app', '--region', 'us-central1', '--platform', 'managed', '--add-cloudsql-instances', 'todo-mysql', '--set-env-vars', 'DB_HOST=/cloudsql/YOUR_PROJECT_ID:us-central1:todo-mysql,DB_USER=root,DB_PASSWORD=YOUR_PASSWORD,DB_NAME=todos']
images:
  - 'gcr.io/$PROJECT_ID/todo-app'
```

### 9. Set Up Cloud Deploy Pipeline

- Create `clouddeploy.yaml` (sample):

```yaml
apiVersion: deploy.cloud.google.com/v1
kind: DeliveryPipeline
metadata:
  name: todo-app-pipeline
description: Pipeline for Next.js Todo App
serialPipeline:
  stages:
    - targetId: prod
      profiles: []
---
apiVersion: deploy.cloud.google.com/v1
kind: Target
metadata:
  name: prod
description: Production target
run:
  location: projects/YOUR_PROJECT_ID/locations/us-central1
```

### 10. Deploy to Cloud Run

- Trigger Cloud Build or deploy manually:

```bash
gcloud builds submit --config cloudbuild.yaml
```

### 11. Verify Deployment

- Visit the Cloud Run service URL to see your todo app in action.

---

## Sample Next.js Todo Code

**pages/index.js**
```jsx
import { useState, useEffect } from "react";

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    fetch("/api/todos").then((res) => res.json()).then(setTodos);
  }, []);

  const addTodo = async () => {
    await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setText("");
    fetch("/api/todos").then((res) => res.json()).then(setTodos);
  };

  const toggleTodo = async (id, completed) => {
    await fetch(`/api/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed }),
    });
    fetch("/api/todos").then((res) => res.json()).then(setTodos);
  };

  const deleteTodo = async (id) => {
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
    fetch("/api/todos").then((res) => res.json()).then(setTodos);
  };

  return (
    <div>
      <h1>Todo List</h1>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <span
              style={{
                textDecoration: todo.completed ? "line-through" : "none",
                cursor: "pointer",
              }}
              onClick={() => toggleTodo(todo.id, todo.completed)}
            >
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**pages/api/todos.js**
```js
import db from "../../lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const [rows] = await db.query("SELECT * FROM todos");
    res.status(200).json(rows);
  } else if (req.method === "POST") {
    const { text } = req.body;
    await db.query("INSERT INTO todos (text) VALUES (?)", [text]);
    res.status(201).end();
  } else {
    res.status(405).end();
  }
}
```

**pages/api/todos/[id].js**
```js
import db from "../../../lib/db";

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === "PUT") {
    const { completed } = req.body;
    await db.query("UPDATE todos SET completed = ? WHERE id = ?", [completed, id]);
    res.status(200).end();
  } else if (req.method === "DELETE") {
    await db.query("DELETE FROM todos WHERE id = ?", [id]);
    res.status(200).end();
  } else {
    res.status(405).end();
  }
}
```

**lib/db.js**
```js
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export default pool;
```

---

## Cloud SQL Connection Notes and Local Testing

### Cloud SQL Connection (Production vs. Local)

- For production, use the [Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/mysql/connect-run) or configure IAM authentication.
- When deploying to Cloud Run, set `DB_HOST` to `/cloudsql/YOUR_PROJECT_ID:REGION:INSTANCE_NAME` and add the Cloud SQL instance to the Cloud Run service.
- For local development, connect using the public IP and authorized networks, or use the Cloud SQL Auth Proxy.

### Docker Compose for Local Testing (Optional)

```yaml
version: "3.8"
services:
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: example
      MYSQL_DATABASE: todos
    ports:
      - "3306:3306"
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - db
```

---

## Notes

- For production, use Cloud SQL Auth Proxy or configure IAM authentication.
- Secure your environment variables and secrets.
- Adjust region and instance names as needed.
