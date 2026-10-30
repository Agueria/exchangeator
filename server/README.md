# Web service

Node.js + Express with a SQLite database file (`better-sqlite3`).
The database schema is ready in `src/db/schema.sql` (same model as the ERD in
`docs/diagrams/erd.drawio`). The service itself is implemented from Lab 05.
The database file is created on first start and is not committed;
`.env.example` will document the configuration.
