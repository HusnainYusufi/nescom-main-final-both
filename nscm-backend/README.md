# PMC Backend

## Admin seeding

For local or containerized deployments you can seed the privileged account with:

```bash
cd nscm-backend
SEED_ADMIN_EMAIL=classified@example.local \
SEED_ADMIN_USERNAME=classified-admin \
SEED_ADMIN_PASSWORD='ChangeMe123!' \
npm run seed:admin
```

Required environment variables:

| Variable              | Description                        |
| --------------------- | ---------------------------------- |
| `MONGO_URI`           | Mongo connection string            |
| `SEED_ADMIN_EMAIL`    | Email used for the admin login     |
| `SEED_ADMIN_USERNAME` | Username stored for the admin user |
| `SEED_ADMIN_PASSWORD` | Plain-text password to be hashed   |

The script ensures an `admin` role exists and creates or updates the specified account with a freshly hashed password. For Docker images, set these variables in your compose file or orchestrator and run `npm run seed:admin` during initialization.