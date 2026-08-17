# CarChief

## Run and access the POC

The POC is a separate compiled demonstration site. It runs locally on port
8080 and does not use the Delivery 02 Customer App or its Mock API database.

Start the POC with:

```bash
docker compose --env-file docker/poc/.env.example \
  -f docker-compose.poc.yml up -d --build
```

Open the main POC at:

- [http://127.0.0.1:8080/](http://127.0.0.1:8080/)
- Customer portal: [http://127.0.0.1:8080/customer/](http://127.0.0.1:8080/customer/)
- Staff workspace: [http://127.0.0.1:8080/staff/](http://127.0.0.1:8080/staff/)
- POC reset page: [http://127.0.0.1:8080/__reset/](http://127.0.0.1:8080/__reset/)

The compiled POC customer portal provides these fixture-only demo credentials:

- Email: `charith3ny@gmail.com`
- Password: `password`

These credentials are for the POC only and must not be reused as production
credentials. The optional POC AI service is not required for the normal site;
start it only with a valid local `GEMINI_API_KEY`:

```bash
docker compose --env-file docker/poc/.env.example \
  -f docker-compose.poc.yml --profile ai up -d --build
```

Stop the POC with:

```bash
docker compose -f docker-compose.poc.yml down
```

## Run the implemented Customer App

The implemented Customer App is a separate application backed by the Mock API.
Start its local validation stack with:

```bash
docker compose -f docker-compose.frontend.yml up -d
```

Then open [http://127.0.0.1:3001/](http://127.0.0.1:3001/). The seeded Mock
API customer account is:

- Email: `demo.customer@carchief.com`
- Password: `CarChief#Fixture2026`

This account is a development fixture for local testing. It is separate from
the POC account above. The Public Web registration page is available at
[http://127.0.0.1:3000/register](http://127.0.0.1:3000/register).

## Inspect the Mock PostgreSQL database with pgAdmin

The frontend Compose stack includes a local-only pgAdmin container for browsing
the Mock API database. Start the stack with:

```bash
docker compose -f docker-compose.frontend.yml up -d
```

Open [http://127.0.0.1:5050](http://127.0.0.1:5050) and sign in with:

- Email: `admin@carchief.dev`
- Password: `carchief_pgadmin_dev_pass`

You can override the host port and login values in a local `.env` file using
`CARCHIEF_PGADMIN_PORT`, `PGADMIN_DEFAULT_EMAIL`, and
`PGADMIN_DEFAULT_PASSWORD`. Do not commit real credentials or local `.env`
files.

To register the Mock PostgreSQL server in pgAdmin, right-click **Servers** and
choose **Register > Server**. Use any display name, then enter these values on
the **Connection** tab:

- Host name/address: `postgres`
- Port: `5432`
- Maintenance database: `carchief_mock`
- Username: `carchief`
- Password: `carchief_dev_pass`

Save the server, expand **Databases > carchief_mock > Schemas > public >
Tables**, and select a table to view its columns and data. The hostname
`postgres` works because pgAdmin and PostgreSQL share the Compose network; do
not use `127.0.0.1` for this connection.

Stop the stack with:

```bash
docker compose -f docker-compose.frontend.yml down
```

The PostgreSQL and pgAdmin data volumes are retained by this command. Add
`--volumes` only when intentionally resetting local database and pgAdmin state.
