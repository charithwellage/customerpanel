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

### Customer tier test accounts

The Mock API database also contains deterministic accounts for testing
customer-tier pricing and reservation limits. All of these development
accounts use the password `CarChief#Fixture2026`:

| Email | Customer ID | Tier | Discount | Active reservation limit |
|---|---|---:|---:|---:|
| `demo.customer@carchief.com` | `cust-123` | Standard | 0% | 1 |
| `other@example.com` | `user-other-456` | Silver | 5% | 2 |
| `silver@example.com` | `cust-silver-789` | Silver | 5% | 2 |
| `gold@example.com` | `cust-gold-012` | Gold | 10% | 3 |
| `platinum@example.com` | `cust-platinum-345` | Platinum | 15% | 5 |

Tier discounts apply to current vehicle list and detail pricing. The original
price remains available for comparison, while historical invoice, payment,
reservation, and purchased-vehicle amounts are not recalculated.
Reservation limits count simultaneous active holds; expired holds no longer
count, and duplicate holds for the same vehicle remain rejected.

Tier name, discount percentage, reservation limit, and description are stored
in the `customer_tier_rules` table. Each authenticated customer’s tier is
resolved from `customer_accounts`; a client-supplied tier cannot elevate the
account. The customer portal reads authenticated benefits from
`GET /api/v1/customer/tier-benefits`.

## Explore the Mock API with Swagger UI

The Mock API exposes an interactive Swagger UI for viewing and trying the
available API endpoints.

### Start the Mock API

Start the frontend Compose stack from the repository root:

```bash
docker compose -f docker-compose.frontend.yml up -d
```

The Mock API runs on port `4000` inside Docker and is bound to localhost on the
Docker host by default.

### Open Swagger UI

Open this URL in a browser on the Docker host:

[http://127.0.0.1:4000/swagger](http://127.0.0.1:4000/swagger)

The raw OpenAPI document is available at:

[http://127.0.0.1:4000/openapi.json](http://127.0.0.1:4000/openapi.json)

In Swagger UI, expand an endpoint, select **Try it out**, enter any required
parameters, and click **Execute** to send a request to the Mock API.

### Verify the Mock API

The health endpoint is:

[http://127.0.0.1:4000/healthz](http://127.0.0.1:4000/healthz)

You can also check the container status and logs:

```bash
docker compose -f docker-compose.frontend.yml ps mock-api
docker compose -f docker-compose.frontend.yml logs -f mock-api
```

The Mock API port can be changed with `CARCHIEF_MOCK_API_PORT` in a local
`.env` file. The Swagger URL must use the same host port. The API is bound to
`127.0.0.1` by default and is not directly available from other computers on
the LAN. Remote users should access the public website through its same-origin
API proxy instead of connecting directly to the Mock API.

### Share the web apps on a local network

The frontend Compose stack publishes the Public Web and Customer App on all
host interfaces by default. Find the computer's LAN IP address, for example
with `ipconfig getifaddr en0` on macOS, then share these URLs with devices on
the same network:

- Public Web: `http://<your-lan-ip>:3000`
- Customer App: `http://<your-lan-ip>:3001`

The Mock API, PostgreSQL, and pgAdmin remain restricted to this computer. If
you want the web apps bound to a specific interface, set
`CARCHIEF_BIND_ADDRESS` in a local `.env` file before starting Compose. Allow
TCP ports 3000 and 3001 through the computer's firewall only on a trusted
local network; this configuration is for development and is not a production
deployment.

## Connect to the Mock Database with pgAdmin

The frontend Compose stack includes a local-only pgAdmin container for browsing
the Mock API PostgreSQL database.

### 1. Start the database and pgAdmin

From the repository root, run:

```bash
docker compose -f docker-compose.frontend.yml up -d
```

Wait until the `postgres` and `pgadmin` services are healthy:

```bash
docker compose -f docker-compose.frontend.yml ps
```

### 2. Open pgAdmin in a browser

On the computer running Docker, open:

[http://127.0.0.1:5050](http://127.0.0.1:5050)

If `CARCHIEF_PGADMIN_PORT` was changed in the local `.env` file, replace
`5050` with that configured port.

### 3. Sign in to pgAdmin

Use the default development credentials:

- Email: `admin@carchief.dev`
- Password: `carchief_pgadmin_dev_pass`

These values can be overridden in a local `.env` file with
`PGADMIN_DEFAULT_EMAIL` and `PGADMIN_DEFAULT_PASSWORD`. The browser URL can be
changed with `CARCHIEF_PGADMIN_PORT`. Do not commit real credentials or local
`.env` files.

### 4. Register the PostgreSQL server

After signing in:

1. In the left sidebar, right-click **Servers**.
2. Select **Register > Server**.
3. On the **General** tab, enter any name, such as `CarChief Mock Database`.
4. Open the **Connection** tab and enter:

- Host name/address: `postgres`
- Port: `5432`
- Maintenance database: `carchief_mock`
- Username: `carchief`
- Password: `carchief_dev_pass`

5. Optionally enable **Save password**.
6. Click **Save**.

The hostname `postgres` is the Docker Compose service name. It works because
the pgAdmin and PostgreSQL containers share the same Docker network. Do not
use `127.0.0.1` in this pgAdmin connection field.

### 5. Browse tables and data

Expand:

`Servers > CarChief Mock Database > Databases > carchief_mock > Schemas > public > Tables`

Right-click a table and choose **View/Edit Data > All Rows** to inspect the
mock records. Use **Query Tool** from the database menu to run SQL queries.

The Compose file does not publish PostgreSQL to the host; therefore, an
external pgAdmin installation cannot connect to this database by using
`127.0.0.1:5432` unless you intentionally add a PostgreSQL port mapping. The
included pgAdmin container is the supported development connection. To confirm
the containers are ready, run:

```bash
docker compose -f docker-compose.frontend.yml ps
docker compose -f docker-compose.frontend.yml logs postgres pgadmin
```

The pgAdmin web interface is intentionally bound to `127.0.0.1`, so it is
available only on the Docker host. Do not expose pgAdmin or PostgreSQL to a
LAN in development unless you also configure authentication and firewall
rules appropriately.

### 6. Stop the stack

Stop the services while retaining the database data volumes:

```bash
docker compose -f docker-compose.frontend.yml down
```

The PostgreSQL and pgAdmin data volumes are retained by this command. Add
`--volumes` only when intentionally resetting local database and pgAdmin state.
