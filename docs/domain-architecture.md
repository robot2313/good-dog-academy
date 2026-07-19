# Domain architecture

The domain layer is independent of React Native UI and navigation. Screens continue to use the existing presentation state until a reviewed milestone explicitly connects them to domain repositories.

## Dependency flow

```text
App startup
  -> Initialization service
       -> Migration manager
            -> StorageAdapter -> AsyncStorage

Domain models
  -> validators
  -> repository interfaces
       -> AsyncStorageRepository
            -> StorageAdapter

Domain transaction and ownership services
  -> StorageTransactionManager
       -> transactional StorageAdapter overlay
            -> domain repository factory
```

## Schema versions

`CURRENT_SCHEMA_VERSION` identifies the storage layout understood by the installed application. At startup, `MigrationManager` reads the stored version. A new database is stamped with the current version. An older database must have a contiguous migration path registered in `src/storage/migrations/index.ts`; migrations run in order and the stored version is updated after each successful step. A newer or invalid version is rejected safely. Version 1 is current, so there are no migrations yet.

## Transactions

`StorageTransactionManager` serializes application-level transactions. Each transaction declares its storage keys in advance and writes into an isolated in-memory overlay. Repository reads within the transaction see staged changes. Nothing reaches AsyncStorage until the operation succeeds. Commit failures trigger best-effort restoration from snapshots. This provides atomic behavior inside a running app, but cannot provide the crash guarantees of a transactional database if the process is terminated during the final commit.

## Ownership and deletion

```text
Owner
├── NotificationSettings
└── Dog
    ├── BehaviourProfile
    ├── Progress
    ├── TrainingSession
    ├── DailyPlan
    └── Achievement
```

Deleting a Dog deletes all records keyed by that dog before deleting the Dog. Deleting an Owner applies the dog cascade to every Dog belonging to the Owner, deletes the Owner's NotificationSettings, and then deletes the Owner. Lessons are global catalogue records and are never cascade-deleted. All cascades execute through one application-level transaction.

## Development data

Demo fixtures live under `src/development/seed`. Production startup never imports or executes them. `seedDevelopmentData` additionally checks `__DEV__` and refuses to run in a production build. The function is opt-in and is not called by the application entry point.
