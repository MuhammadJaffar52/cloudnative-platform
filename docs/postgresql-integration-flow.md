================================================================================
       POSTGRESQL DATABASE INTEGRATION - COMPLETE FLOW & DESCRIPTION
================================================================================

  This document describes the full plan to replace in-memory data stores
  with PostgreSQL running as a StatefulSet inside the Kind cluster.


================================================================================
  1. CURRENT STATE
================================================================================

  All 4 microservices use in-memory JavaScript Map objects:

    SERVICE            PORT    IN-MEMORY STORE         DATA LOST ON RESTART?
    ─────────────────  ──────  ──────────────────────  ─────────────────────
    user-service       3001   const users = new Map()  YES
    product-service    3002   const products = new Map() YES
    order-service      3003   const orders = new Map() YES
    payment-service    3004   const payments = new Map() YES

  The K8s Secret (app-secret) already contains DB_USERNAME and DB_PASSWORD
  but no service reads them. They were created as placeholders.


================================================================================
  2. TARGET ARCHITECTURE
================================================================================

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                        KIND CLUSTER (cloudnative)                          │
  │                                                                             │
  │  ┌──────────────────────────────────────────────────────────────────────┐  │
  │  │                    NAMESPACE: microservices                          │  │
  │  │                                                                      │  │
  │  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐       │  │
  │  │  │   user       │  │   product    │  │     order-service    │       │  │
  │  │  │   service    │  │   service    │  │                      │       │  │
  │  │  │   :3001      │  │   :3002      │  │     :3003            │       │  │
  │  │  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘       │  │
  │  │         │                 │                      │                    │  │
  │  │         │     ┌───────────┴──────────┐           │                    │  │
  │  │         │     │   payment-service    │           │                    │  │
  │  │         │     │   :3004              │           │                    │  │
  │  │         │     └──────────┬───────────┘           │                    │  │
  │  │         │                │                       │                    │  │
  │  │         ▼                ▼                       ▼                    │  │
  │  │  ┌─────────────────────────────────────────────────────────────┐     │  │
  │  │  │                                                             │     │  │
  │  │  │              PostgreSQL (StatefulSet)                       │     │  │
  │  │  │              Service: postgres.microservices.svc            │     │  │
  │  │  │              Port: 5432                                     │     │  │
  │  │  │              Database: cloudnative_db                       │     │  │
  │  │  │              PVC: postgres-data-postgres-0 (5Gi)            │     │  │
  │  │  │                                                             │     │  │
  │  │  └─────────────────────────────────────────────────────────────┘     │  │
  │  │                                                                      │  │
  │  └──────────────────────────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────────────────────────┘


================================================================================
  3. DATABASE SCHEMA DESIGN
================================================================================

  One database: cloudnative_db
  Four tables, one per service, maintaining service data ownership.

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  TABLE: users                                                              │
  │  Owner: user-service                                                       │
  │  ───────────────────────────────────────────────────────────────────────   │
  │  Column        Type                    Constraints                        │
  │  ───────────── ──────────────────────  ──────────────────────────────     │
  │  id            SERIAL                  PRIMARY KEY                        │
  │  name          VARCHAR(255)            NOT NULL                           │
  │  email         VARCHAR(255)            NOT NULL UNIQUE                    │
  │  created_at    TIMESTAMP               DEFAULT NOW()                      │
  │  updated_at    TIMESTAMP               DEFAULT NOW()                      │
  └─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  TABLE: products                                                           │
  │  Owner: product-service                                                    │
  │  ───────────────────────────────────────────────────────────────────────   │
  │  Column        Type                    Constraints                        │
  │  ───────────── ──────────────────────  ──────────────────────────────     │
  │  id            SERIAL                  PRIMARY KEY                        │
  │  name          VARCHAR(255)            NOT NULL                           │
  │  description   TEXT                    DEFAULT ''                         │
  │  price         DECIMAL(10,2)           NOT NULL                           │
  │  stock         INTEGER                 DEFAULT 0                          │
  │  category      VARCHAR(100)            DEFAULT 'General'                  │
  │  created_at    TIMESTAMP               DEFAULT NOW()                      │
  │  updated_at    TIMESTAMP               DEFAULT NOW()                      │
  └─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  TABLE: orders                                                             │
  │  Owner: order-service                                                      │
  │  ───────────────────────────────────────────────────────────────────────   │
  │  Column        Type                    Constraints                        │
  │  ───────────── ──────────────────────  ──────────────────────────────     │
  │  id            SERIAL                  PRIMARY KEY                        │
  │  user_id       INTEGER                 NOT NULL (FK -> users.id)          │
  │  product_id    INTEGER                 NOT NULL (FK -> products.id)       │
  │  quantity      INTEGER                 NOT NULL                           │
  │  total         DECIMAL(10,2)           NOT NULL                           │
  │  status        VARCHAR(50)             DEFAULT 'pending'                  │
  │  payment_data  JSONB                   NULL                               │
  │  created_at    TIMESTAMP               DEFAULT NOW()                      │
  │  completed_at  TIMESTAMP               NULL                               │
  └─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  TABLE: payments                                                           │
  │  Owner: payment-service                                                    │
  │  ───────────────────────────────────────────────────────────────────────   │
  │  Column        Type                    Constraints                        │
  │  ───────────── ──────────────────────  ──────────────────────────────     │
  │  id            SERIAL                  PRIMARY KEY                        │
  │  order_id      INTEGER                 NOT NULL (FK -> orders.id)         │
  │  amount        DECIMAL(10,2)           NOT NULL                           │
  │  user_id       INTEGER                 NOT NULL (FK -> users.id)          │
  │  payment_method VARCHAR(50)            DEFAULT 'credit_card'              │
  │  status        VARCHAR(50)             NOT NULL                           │
  │  transaction_id VARCHAR(255)           NULL                               │
  │  processed_at  TIMESTAMP               DEFAULT NOW()                      │
  └─────────────────────────────────────────────────────────────────────────────┘


================================================================================
  4. NEW KUBERNETES RESOURCES NEEDED
================================================================================

  New files to create under kubernetes/base/postgres/

  postgres/
  ├── kustomization.yaml
  ├── statefulset.yaml
  ├── service-headless.yaml
  ├── service-clusterip.yaml
  ├── configmap.yaml          (init SQL script for table creation)
  └── secret.yaml             (DB credentials - or reuse app-secret)

  kubernetes/base/kustomization.yaml  (add postgres to resources list)


================================================================================
  5. KUBERNETES RESOURCE DETAILS
================================================================================

  ─────────────────────────────────────────────────────────────────────────────
  5A. StatefulSet (postgres/statefulset.yaml)
  ─────────────────────────────────────────────────────────────────────────────

    apiVersion: apps/v1
    kind: StatefulSet

    Name:       postgres
    Namespace:  microservices
    Replicas:   1

    Container:
      Image:    postgres:16-alpine
      Port:     5432
      Env:
        POSTGRES_DB:        cloudnative_db
        POSTGRES_USER:      admin          (from secret)
        POSTGRES_PASSWORD:  admin123       (from secret)
        PGDATA:             /var/lib/postgresql/data/pgdata

      Volume Mounts:
        - name: postgres-data  -> /var/lib/postgresql/data

      Resources:
        requests: cpu 100m, memory 256Mi
        limits:   cpu 500m, memory 512Mi

      Readiness Probe:
        exec: ["pg_isready", "-U", "admin", "-d", "cloudnative_db"]
        initialDelaySeconds: 5
        periodSeconds: 10

      Liveness Probe:
        exec: ["pg_isready", "-U", "admin", "-d", "cloudnative_db"]
        initialDelaySeconds: 15
        periodSeconds: 20

    Volume Claim Templates:
      - metadata: name: postgres-data
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 5Gi

    Init Container (optional but recommended):
      - name: init-db
        image: postgres:16-alpine
        command: ["psql"]
        args: ["-U", "admin", "-d", "cloudnative_db", "-f", "/docker-entrypoint-initdb.d/init.sql"]
        volumeMounts:
          - name: init-sql  -> /docker-entrypoint-initdb.d
          - name: postgres-data -> /var/lib/postgresql/data

    Wait - simpler approach: mount the init SQL ConfigMap directly.
    PostgreSQL image auto-runs .sql files from /docker-entrypoint-initdb.d/

    So the StatefulSet just needs:
      Volume Mounts:
        - name: init-sql -> /docker-entrypoint-initdb.d
        (from ConfigMap)


  ─────────────────────────────────────────────────────────────────────────────
  5B. Headless Service (postgres/service-headless.yaml)
  ─────────────────────────────────────────────────────────────────────────────

    Required by StatefulSet for stable network identity.

    Name:       postgres-headless
    Namespace:  microservices
    ClusterIP:  None
    Selector:   app: postgres
    Port:       5432/TCP


  ─────────────────────────────────────────────────────────────────────────────
  5C. ClusterIP Service (postgres/service-clusterip.yaml)
  ─────────────────────────────────────────────────────────────────────────────

    For microservices to connect to.

    Name:       postgres
    Namespace:  microservices
    Selector:   app: postgres
    Port:       5432/TCP

    Connection string for all services:
      postgresql://admin:admin123@postgres.microservices.svc:5432/cloudnative_db


  ─────────────────────────────────────────────────────────────────────────────
  5D. ConfigMap - Init SQL (postgres/configmap.yaml)
  ─────────────────────────────────────────────────────────────────────────────

    Contains init.sql that PostgreSQL auto-executes on first startup.

    init.sql:
    ─────────
    CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        email       VARCHAR(255) NOT NULL UNIQUE,
        created_at  TIMESTAMP DEFAULT NOW(),
        updated_at  TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        price       DECIMAL(10,2) NOT NULL,
        stock       INTEGER DEFAULT 0,
        category    VARCHAR(100) DEFAULT 'General',
        created_at  TIMESTAMP DEFAULT NOW(),
        updated_at  TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id),
        product_id  INTEGER NOT NULL REFERENCES products(id),
        quantity    INTEGER NOT NULL,
        total       DECIMAL(10,2) NOT NULL,
        status      VARCHAR(50) DEFAULT 'pending',
        payment_data JSONB,
        created_at  TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
        id              SERIAL PRIMARY KEY,
        order_id        INTEGER NOT NULL REFERENCES orders(id),
        amount          DECIMAL(10,2) NOT NULL,
        user_id         INTEGER NOT NULL REFERENCES users(id),
        payment_method  VARCHAR(50) DEFAULT 'credit_card',
        status          VARCHAR(50) NOT NULL,
        transaction_id  VARCHAR(255),
        processed_at    TIMESTAMP DEFAULT NOW()
    );

    -- Seed data: sample users
    INSERT INTO users (name, email) VALUES
        ('John Doe', 'john@example.com'),
        ('Jane Smith', 'jane@example.com'),
        ('Bob Wilson', 'bob@example.com');

    -- Seed data: sample products
    INSERT INTO products (name, description, price, stock, category) VALUES
        ('Laptop', 'High-performance laptop', 999.99, 50, 'Electronics'),
        ('Smartphone', 'Latest smartphone model', 699.99, 100, 'Electronics'),
        ('Headphones', 'Noise-cancelling headphones', 199.99, 200, 'Audio'),
        ('Keyboard', 'Mechanical keyboard', 129.99, 150, 'Accessories'),
        ('Monitor', '27-inch 4K monitor', 449.99, 75, 'Electronics');


  ─────────────────────────────────────────────────────────────────────────────
  5E. Secret (reuse existing app-secret)
  ─────────────────────────────────────────────────────────────────────────────

    The existing kubernetes/base/security/secrets/app-secret.yaml already has:

        DB_USERNAME: admin
        DB_PASSWORD: admin123

    These will be used by the PostgreSQL StatefulSet AND all microservices.


================================================================================
  6. SERVICE CODE CHANGES (per service)
================================================================================

  ─────────────────────────────────────────────────────────────────────────────
  6A. SHARED: Add pg package to each service
  ─────────────────────────────────────────────────────────────────────────────

    $ cd apps/user-service
    $ npm install pg

    Repeat for: product-service, order-service, payment-service

    No change needed for gateway or frontend (they don't touch the DB).

  ─────────────────────────────────────────────────────────────────────────────
  6B. SHARED: Database connection module
  ─────────────────────────────────────────────────────────────────────────────

    Create apps/shared/db.js (or copy into each service):

    ─── apps/shared/db.js ───

    import pg from 'pg'

    const pool = new pg.Pool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     process.env.DB_PORT     || 5432,
      database: process.env.DB_NAME     || 'cloudnative_db',
      user:     process.env.DB_USERNAME || 'admin',
      password: process.env.DB_PASSWORD || 'admin123',
      max:      10,
      idleTimeoutMillis: 30000,
    })

    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err)
    })

    export default pool

  ─────────────────────────────────────────────────────────────────────────────
  6C. user-service/server.js - BEFORE vs AFTER
  ─────────────────────────────────────────────────────────────────────────────

    BEFORE (in-memory):
    ────────────────────
      const users = new Map()
      let userIdCounter = 1

      function initUsers() { ... }
      initUsers()

      app.get('/users', (req, res) => {
        res.json(Array.from(users.values()))
      })

      app.get('/users/:id', (req, res) => {
        const user = users.get(parseInt(req.params.id))
        ...
      })

      app.post('/users', (req, res) => {
        const user = { id: userIdCounter++, name, email, ... }
        users.set(user.id, user)
        ...
      })

    AFTER (PostgreSQL):
    ───────────────────
      import pool from '../shared/db.js'

      // Health check now verifies DB connection too
      app.get('/health', async (req, res) => {
        try {
          await pool.query('SELECT 1')
          res.json({ status: 'healthy', service: 'user-service', database: 'connected' })
        } catch (err) {
          res.status(503).json({ status: 'unhealthy', database: 'disconnected' })
        }
      })

      // GET /users - all users
      app.get('/users', async (req, res) => {
        const result = await pool.query('SELECT * FROM users ORDER BY id')
        res.json(result.rows)
      })

      // GET /users/:id - single user
      app.get('/users/:id', async (req, res) => {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id])
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' })
        }
        res.json(result.rows[0])
      })

      // POST /users - create user
      app.post('/users', async (req, res) => {
        const { name, email } = req.body
        if (!name || !email) {
          return res.status(400).json({ error: 'Name and email are required' })
        }
        const result = await pool.query(
          'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
          [name, email]
        )
        res.status(201).json(result.rows[0])
      })

      // PUT /users/:id - update user
      app.put('/users/:id', async (req, res) => {
        const { name, email } = req.body
        const result = await pool.query(
          'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), updated_at = NOW() WHERE id = $3 RETURNING *',
          [name, email, req.params.id]
        )
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' })
        }
        res.json(result.rows[0])
      })

      // DELETE /users/:id
      app.delete('/users/:id', async (req, res) => {
        const result = await pool.query('DELETE FROM users WHERE id = $1', [req.params.id])
        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'User not found' })
        }
        res.status(204).send()
      })

  ─────────────────────────────────────────────────────────────────────────────
  6D. product-service/server.js - SAME PATTERN
  ─────────────────────────────────────────────────────────────────────────────

    Replace Map operations with:
      SELECT * FROM products
      SELECT * FROM products WHERE id = $1
      INSERT INTO products (name, description, price, stock, category) VALUES (...) RETURNING *
      UPDATE products SET ... WHERE id = $1 RETURNING *
      DELETE FROM products WHERE id = $1

  ─────────────────────────────────────────────────────────────────────────────
  6E. order-service/server.js - SAME PATTERN + CROSS-SERVICE QUERIES
  ─────────────────────────────────────────────────────────────────────────────

    Replace Map operations with:
      SELECT * FROM orders
      SELECT * FROM orders WHERE id = $1
      INSERT INTO orders (user_id, product_id, quantity, total, status) VALUES (...) RETURNING *

    The cross-service HTTP calls to user-service and product-service
    can REMAIN AS-IS (they still call via K8s service DNS).

    The payment_data field in orders table stores the payment response as JSONB.

  ─────────────────────────────────────────────────────────────────────────────
  6F. payment-service/server.js - SAME PATTERN
  ─────────────────────────────────────────────────────────────────────────────

    Replace Map operations with:
      SELECT * FROM payments
      SELECT * FROM payments WHERE id = $1
      INSERT INTO payments (order_id, amount, user_id, payment_method, status, transaction_id) VALUES (...) RETURNING *


================================================================================
  7. K8s CONFIGMAP/SECRET CHANGES FOR SERVICES
================================================================================

  Each service deployment needs 2 new env vars to connect to PostgreSQL:

  Add to each service's deployment.yaml:

    env:
      - name: DB_HOST
        value: "postgres.microservices.svc"
      - name: DB_PORT
        value: "5432"
      - name: DB_NAME
        value: "cloudnative_db"
      - name: DB_USERNAME
        valueFrom:
          secretKeyRef:
            name: app-secret
            key: DB_USERNAME
      - name: DB_PASSWORD
        valueFrom:
          secretKeyRef:
            name: app-secret
            key: DB_PASSWORD

  Can also be added to each service's configmap.yaml:

    data:
      DB_HOST: "postgres.microservices.svc"
      DB_PORT: "5432"
      DB_NAME: "cloudnative_db"


================================================================================
  8. STEP-BY-STEP IMPLEMENTATION ORDER
================================================================================

  Follow this exact order. Each step depends on the previous one.

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  STEP 1: Create PostgreSQL K8s Manifests                                   │
  │  ─────────────────────────────────────────                                │
  │  File: kubernetes/base/postgres/statefulset.yaml                           │
  │  File: kubernetes/base/postgres/service-headless.yaml                      │
  │  File: kubernetes/base/postgres/service-clusterip.yaml                     │
  │  File: kubernetes/base/postgres/configmap.yaml (init SQL)                  │
  │  File: kubernetes/base/postgres/kustomization.yaml                         │
  │                                                                            │
  │  Action: Create all 5 files under kubernetes/base/postgres/                │
  └─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  STEP 2: Register PostgreSQL in Base Kustomization                         │
  │  ────────────────────────────────────────────────                          │
  │  File: kubernetes/base/kustomization.yaml                                  │
  │                                                                            │
  │  Add to resources list:                                                    │
  │    - postgres                                                              │
  │                                                                            │
  │  This makes kustomize build include all postgres resources.                │
  └─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  STEP 3: Deploy PostgreSQL to Cluster                                      │
  │  ─────────────────────────────────────                                     │
  │  Command:                                                                  │
  │    $ kubectl apply -k kubernetes/base/postgres                             │
  │                                                                            │
  │  Verify:                                                                   │
  │    $ kubectl get statefulset -n microservices                              │
  │    $ kubectl get pods -n microservices -l app=postgres                     │
  │    $ kubectl logs postgres-0 -n microservices                              │
  │                                                                            │
  │  Wait for: postgres-0 pod Running with 1/1 Ready                          │
  └─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  STEP 4: Verify Database & Tables                                          │
  │  ─────────────────────────────────                                         │
  │  Command:                                                                  │
  │    $ kubectl exec -it postgres-0 -n microservices \                       │
  │        -- psql -U admin -d cloudnative_db -c "\dt"                        │
  │                                                                            │
  │  Expected output: 4 tables (users, products, orders, payments)            │
  │  + seed data already inserted.                                             │
  │                                                                            │
  │  Verify seed data:                                                         │
  │    $ kubectl exec -it postgres-0 -n microservices \                       │
  │        -- psql -U admin -d cloudnative_db -c "SELECT * FROM users"        │
  │    $ kubectl exec -it postgres-0 -n microservices \                       │
  │        -- psql -U admin -d cloudnative_db -c "SELECT * FROM products"     │
  └─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  STEP 5: Update Service ConfigMaps with DB Connection Info                 │
  │  ─────────────────────────────────────────────────────────                 │
  │  Files to modify:                                                          │
  │    kubernetes/base/user-service/configmap.yaml                             │
  │    kubernetes/base/product-service/configmap.yaml                          │
  │    kubernetes/base/order-service/configmap.yaml                            │
  │    kubernetes/base/payment-service/configmap.yaml                          │
  │                                                                            │
  │  Add DB_HOST, DB_PORT, DB_NAME to each configmap.                          │
  │  DB_USERNAME and DB_PASSWORD already come from app-secret.                 │
  └─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  STEP 6: Update Service Deployments with DB env vars                       │
  │  ───────────────────────────────────────────────────                       │
  │  Files to modify:                                                          │
  │    kubernetes/base/user-service/deployment.yaml                            │
  │    kubernetes/base/product-service/deployment.yaml                         │
  │    kubernetes/base/order-service/deployment.yaml                           │
  │    kubernetes/base/payment-service/deployment.yaml                         │
  │                                                                            │
  │  Ensure envFrom configMapRef includes the service config.                  │
  │  (Most deployments already have envFrom for their configmap.)              │
  └─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  STEP 7: Update Microservice Code (server.js files)                        │
  │  ─────────────────────────────────────────────────────                     │
  │  Files to modify:                                                          │
  │    apps/user-service/server.js                                             │
  │    apps/product-service/server.js                                          │
  │    apps/order-service/server.js                                            │
  │    apps/payment-service/server.js                                          │
  │                                                                            │
  │  For each service:                                                         │
  │    a) Install pg:  npm install pg                                          │
  │    b) Import pool from shared db module                                    │
  │    c) Replace Map operations with SQL queries                              │
  │    d) Make route handlers async                                            │
  │    e) Add try/catch for database errors                                    │
  │    f) Update /health endpoint to check DB connectivity                     │
  └─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  STEP 8: Rebuild Docker Images with Updated Code                           │
  │  ───────────────────────────────────────────────────                       │
  │  Commands (repeat for each service):                                       │
  │                                                                            │
  │    $ docker build -t user-service:latest ./apps/user-service              │
  │    $ docker build -t product-service:latest ./apps/product-service        │
  │    $ docker build -t order-service:latest ./apps/order-service            │
  │    $ docker build -t payment-service:latest ./apps/payment-service        │
  │                                                                            │
  │  Then load into Kind:                                                      │
  │    $ kind load docker-image user-service:latest --name cloudnative        │
  │    $ kind load docker-image product-service:latest --name cloudnative     │
  │    $ kind load docker-image order-service:latest --name cloudnative       │
  │    $ kind load docker-image payment-service:latest --name cloudnative     │
  │                                                                            │
  │  Update deployment.yaml image tags to :latest (or use local registry).    │
  └─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  STEP 9: Deploy Updated Microservices                                      │
  │  ────────────────────────────────────                                      │
  │  Command:                                                                  │
  │    $ kubectl apply -k kubernetes/overlays/local                            │
  │                                                                            │
  │  Or apply just the changed deployments:                                    │
  │    $ kubectl rollout restart deployment user-service -n microservices     │
  │    $ kubectl rollout restart deployment product-service -n microservices  │
  │    $ kubectl rollout restart deployment order-service -n microservices    │
  │    $ kubectl rollout restart deployment payment-service -n microservices  │
  │                                                                            │
  │  Verify all pods are 2/2 Running:                                          │
  │    $ kubectl get pods -n microservices                                     │
  └─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  STEP 10: End-to-End Testing                                               │
  │  ────────────────────────────                                              │
  │                                                                            │
  │  Test 1 - Health checks:                                                   │
  │    $ kubectl port-forward svc/gateway 8000:8000 -n microservices           │
  │    $ curl http://localhost:8000/health                                     │
  │                                                                            │
  │  Test 2 - Users (should return DB-seeded data):                           │
  │    $ curl http://localhost:8000/api/users                                  │
  │    $ curl http://localhost:8000/api/users/1                                │
  │                                                                            │
  │  Test 3 - Products (should return DB-seeded data):                        │
  │    $ curl http://localhost:8000/api/products                               │
  │    $ curl http://localhost:8000/api/products/1                             │
  │                                                                            │
  │  Test 4 - Create user:                                                     │
  │    $ curl -X POST http://localhost:8000/api/users \                       │
  │        -H "Content-Type: application/json" \                              │
  │        -d '{"name":"Test User","email":"test@example.com"}'               │
  │                                                                            │
  │  Test 5 - Create order:                                                    │
  │    $ curl -X POST http://localhost:8000/api/orders \                      │
  │        -H "Content-Type: application/json" \                              │
  │        -d '{"userId":1,"productId":1,"quantity":2}'                       │
  │                                                                            │
  │  Test 6 - Verify persistence (restart pod, data survives):                │
  │    $ kubectl delete pod user-service-xxx -n microservices                 │
  │    $ curl http://localhost:8000/api/users                                  │
  │    (Should still return all users including the one created above)        │
  │                                                                            │
  │  Test 7 - Verify data in PostgreSQL directly:                             │
  │    $ kubectl exec -it postgres-0 -n microservices \                       │
  │        -- psql -U admin -d cloudnative_db -c "SELECT * FROM users"        │
  │    $ kubectl exec -it postgres-0 -n microservices \                       │
  │        -- psql -U admin -d cloudnative_db -c "SELECT * FROM orders"       │
  └─────────────────────────────────────────────────────────────────────────────┘


================================================================================
  9. DIRECTORY STRUCTURE AFTER IMPLEMENTATION
================================================================================

  kubernetes/base/
  ├── kustomization.yaml          (MODIFIED - added postgres)
  ├── postgres/                   (NEW)
  │   ├── kustomization.yaml
  │   ├── statefulset.yaml
  │   ├── service-headless.yaml
  │   ├── service-clusterip.yaml
  │   └── configmap.yaml
  ├── namespace/
  ├── security/
  ├── frontend/
  ├── gateway/
  ├── user-service/               (MODIFIED configmap + deployment)
  ├── product-service/            (MODIFIED configmap + deployment)
  ├── order-service/              (MODIFIED configmap + deployment)
  ├── payment-service/            (MODIFIED configmap + deployment)
  └── istio/

  apps/
  ├── shared/                     (NEW)
  │   └── db.js
  ├── user-service/               (MODIFIED server.js, package.json)
  ├── product-service/            (MODIFIED server.js, package.json)
  ├── order-service/              (MODIFIED server.js, package.json)
  └── payment-service/            (MODIFIED server.js, package.json)


================================================================================
  10. IMPORTANT NOTES
================================================================================

  A. DATA PERSISTENCE:
     PostgreSQL data is stored in the PVC (postgres-data-postgres-0).
     Data survives pod restarts but NOT StatefulSet deletion.

     To preserve data across full cluster rebuilds:
       - Export data before cluster delete
       - Or use a StorageClass backed by hostPath (Kind default)

  B. SEED DATA:
     The init.sql ConfigMap runs ONLY on first startup (when PVC is empty).
     If you delete the PVC and recreate the StatefulSet, seed data re-inserts.
     If the PVC already has data, PostgreSQL skips init.sql.

  C. CONNECTION POOL:
     The pg.Pool with max:10 connections per service is sufficient for
     development. In production, tune this based on load.

  D. ORDER-SERVICE CROSS-CALLS:
     Order-service still calls user-service and product-service via HTTP.
     This is intentional - it validates data through the service API layer,
     not by querying the database directly. This maintains service boundaries.

  E. PAYMENT-SERVICE:
     Payment-service adds helmet, cors, morgan middleware. Keep these.
     The 90% success rate simulation is preserved in the DB version.

  F. GATEWAY AND FRONTEND:
     No changes needed. They proxy requests and serve static files.
     They don't touch the database.

  G. ISTIO / SERVICE MESH:
     No changes needed. PostgreSQL is just another K8s service.

  H. GITHUB ACTIONS CI:
     The existing CI pipeline builds Docker images from apps/*.
     After adding pg to package.json, npm ci in Dockerfiles handles it.
     No CI changes needed for the database integration.

================================================================================
