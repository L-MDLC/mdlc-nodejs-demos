# MongoDB Change Stream Worker

## Prerequisites
- Node.js installed (v18+ recommended) - https://nodejs.org/en
- PNPM - https://pnpm.io/fr/ - You can install it using `npm install -g pnpm@latest-10`
- NX - https://nx.dev - You can install it using `npm install -g nx`
- Docker & Docker-Compose (To run the project locally) - https://www.docker.com
- _OR MongoDB Atlas cluster (If you don't want to use Docker)_

## Project Structure

The application is structured like this :

```
apps/01-mongodb-stream-worker/
├── src/
│   ├── main.ts                     # Application entry point
│   ├── config/
│   │   └── config.ts               # Configuration management
│   ├── services/
│   │   ├── mongodb.service.ts      # MongoDB connection management
│   │   └── change-stream.service.ts # Change stream handling
│   ├── handlers/
│   │   ├── change-handler.ts       # Change event handling logic
│   │   └── error-handler.ts        # Error handling logic
│   └── utils/
│       ├── logger.ts               # Logging utility
│       └── cleanup.ts              # Resource cleanup utilities
├── test/          
│   ├── config/    # Config tests
│   ├── services/  # Service tests
│   ├── handlers/  # Handler tests
│   ├── utils/     # Utility tests
└   └── helpers/   # Test helpers
```

## Components

### 1. Configuration

The `config.ts` file centralizes all configuration, loading values from environment variables with sensible defaults.

### 2. Services

- **MongoDbService**: Handles MongoDB connection lifecycle
- **ChangeStreamService**: Manages the change stream setup, event handling, and reconnection logic

### 3. Handlers

- **ChangeHandler**: Processes different types of change events (insert, update, delete)
- **ErrorHandler**: Manages error tracking and reconnection

### 4. Utilities

- **Logger**: Provides structured logging with configurable log levels
- **CleanupUtil**: Manages graceful shutdown

## Running the Application

If you want to start the application using a full local environment,\
You can run the docker-compose file available in `/docker/mongodb-rs/docker-compose` using `docker-compose up`.

When MongoDB replicaset is ready,

1. Ensure your `.env` file is set up (you can check the `.env.example` file) with appropriate MongoDB connection details.\
_Note: By default the `.env.example` file contain all settings for the docker environment._
2. Build and run using NX:
   ```bash
   nx serve 01-mongodb-stream-worker
   ```

## Try the Change Stream

When application is launched, the worker will wait for MongoDB changes.\
To try the change stream you must insert/update or remove documents from the database/collection defined in your `.env`.

To do it you have multiple choices :
- Use the repository `mongo-infinite-insert` very simple batch, see [README.md](./apps/01-mongodb-stream-worker/README.md) here.
- Use MongoCli (https://www.mongodb.com/docs/mongocli/current/)
- Use Mongo Compass (https://www.mongodb.com/fr-fr/products/tools/compass)

## Extending the Application

To extend the functionality:

1. **You can set a filter using `PIPELINE_FILTER` env. variable
2. **You can add new operation type support**: Extend the `ChangeHandler` to process additional operation types
