# CarChief Azure Deployment Guide

This guide explains how to deploy the current CarChief demonstration application to Microsoft Azure:

- Public Website (`apps/public-web`)
- Customer App (`apps/customer-app`)
- Mock API (`apps/mock-api`)
- Mock PostgreSQL database

The deployment uses Azure Container Apps for the containers, Azure Container Registry (ACR) for images, and Azure Database for PostgreSQL Flexible Server for the mock database.

> Important: this repository contains a mock/demo backend. It includes deterministic demo accounts, demo financial data, Swagger, and development-oriented behavior. Do not expose it as a production financial system without replacing the mock API with the real AutoPulse backend, reviewing authentication, and removing demo data.

## 1. What will be deployed

```text
Browser
  |                         |
  v                         v
Public Web (external)     Customer App (external)
  | Next same-origin         | Vite preview same-origin
  | /api/v1 proxy            | /api/v1 proxy
  +-------------+------------+
                |
                v
        Mock API (internal)
                |
                v
 Azure Database for PostgreSQL Flexible Server
```

The two frontends do not need a browser-visible database or API hostname:

- Public Web uses the Next.js `/api/v1/*` proxy.
- Customer App uses the Vite preview server’s `/api/v1/*` proxy.
- Both proxy targets use the Container Apps service name `http://mock-api:4000`.
- The mock API is internal to the Container Apps environment.

Azure Container Apps provides service discovery by app name for apps in the same environment, so `http://mock-api` is resolvable from the frontend containers. An internal ingress endpoint is not reachable from the public internet. See Microsoft’s [Container Apps communication guidance](https://learn.microsoft.com/en-us/azure/container-apps/connect-apps).

The repository also contains `apps/salesperson-app`, but it is currently only a TypeScript package with no runnable web entry point or Vite/Next application. It is not part of the existing frontend Compose deployment and cannot be deployed as a working UI without a separate implementation.

## 2. Prerequisites

You need:

1. An Azure subscription with permission to create resource groups, Container Apps, ACR, and PostgreSQL Flexible Server resources.
2. Docker Desktop, if you want to build images locally. This guide uses Azure Container Registry Tasks instead, so local Docker is optional.
3. Azure CLI 2.x.
4. `psql` client tools for optional database verification.
5. A terminal running Bash, zsh, or Azure Cloud Shell Bash.
6. This repository checked out locally.

For a first deployment, choose one Azure region and use it for all resources. The commands below use `eastus`; change it if your subscription or users are closer to another region.

Azure resource names must be globally unique where noted. The examples use a suffix that you should replace.

## 3. Install Azure CLI and sign in

Install Azure CLI using Microsoft’s [installation guide](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli). Then sign in:

```bash
az login
az account list --output table
az account set --subscription "<YOUR_SUBSCRIPTION_ID_OR_NAME>"
az account show --output table
```

Install or update the Container Apps extension:

```bash
az extension add --name containerapp --upgrade
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights
```

Create a local shell variable set. Do not commit this file or paste the secrets into source control:

```bash
export LOCATION="eastus"
export RESOURCE_GROUP="carchief-demo-rg"
export ACR_NAME="carchiefdemo<unique-suffix>"
export CONTAINER_ENV="carchief-demo-env"
export POSTGRES_SERVER="carchief-demo-pg<unique-suffix>"
export POSTGRES_ADMIN="carchiefadmin"
export POSTGRES_DB="carchief_mock"
export IMAGE_TAG="$(date +%Y%m%d%H%M%S)"

# Use a strong value. Avoid @, :, /, ?, #, and spaces so it can safely be
# placed in a PostgreSQL URL without URL encoding.
export POSTGRES_PASSWORD="<strong-url-safe-password>"
export JWT_SECRET="<long-random-jwt-secret>"
```

Never use the local Compose values such as `carchief_dev_pass` or `mock_dev_jwt_secret_key_change_me` in Azure.

## 4. Create the Azure resource group and registry

Create a resource group:

```bash
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION"
```

Create an Azure Container Registry. `Basic` is sufficient for a small demonstration; choose a larger SKU if you need geo-replication, private endpoints, or higher build capacity.

```bash
az acr create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ACR_NAME" \
  --sku Basic \
  --admin-enabled true

export ACR_LOGIN_SERVER="$(az acr show \
  --name "$ACR_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query loginServer --output tsv)"

export ACR_USERNAME="$(az acr credential show \
  --name "$ACR_NAME" \
  --query username --output tsv)"

export ACR_PASSWORD="$(az acr credential show \
  --name "$ACR_NAME" \
  --query 'passwords[0].value' --output tsv)"

echo "$ACR_LOGIN_SERVER"
```

The registry admin account is used here to keep the first deployment simple. For a long-lived environment, use a managed identity with the `AcrPull` role instead of storing registry credentials. See [Container Apps security](https://learn.microsoft.com/en-us/azure/container-apps/security).

## 5. Create the managed PostgreSQL database

Create Azure Database for PostgreSQL Flexible Server. The mock store creates and updates its tables during API startup, so an empty database is sufficient for a fresh deployment.

```bash
az postgres flexible-server create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$POSTGRES_SERVER" \
  --location "$LOCATION" \
  --admin-user "$POSTGRES_ADMIN" \
  --admin-password "$POSTGRES_PASSWORD" \
  --database-name "$POSTGRES_DB" \
  --version 16 \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --public-access 0.0.0.0
```

The `0.0.0.0` setting is the Azure quickstart form that permits Azure services to connect. It is acceptable only for a temporary demonstration and is broader than a production network policy. Microsoft’s [PostgreSQL Flexible Server quickstart](https://learn.microsoft.com/en-us/azure/postgresql/configure-maintain/quickstart-create-server) documents both public firewall access and private VNet access.

Retrieve the server hostname and construct the connection string:

```bash
export POSTGRES_HOST="$(az postgres flexible-server show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$POSTGRES_SERVER" \
  --query fullyQualifiedDomainName --output tsv)"

export DATABASE_URL="postgresql://${POSTGRES_ADMIN}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB}?sslmode=require"
echo "$POSTGRES_HOST"
```

The `sslmode=require` query parameter is required for the managed PostgreSQL connection. If the database already exists and contains old demo data, do not reset it casually. Make a backup first and use a fresh database for a clean demonstration deployment.

### Optional database connection check

From a machine whose IP is allowed by the server firewall:

```bash
psql "$DATABASE_URL" -c 'select current_database(), version();'
```

If your IP is not allowed, add it temporarily:

```bash
export MY_IP="$(curl -s https://api.ipify.org)"
az postgres flexible-server firewall-rule create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$POSTGRES_SERVER" \
  --rule-name AllowDeploymentMachine \
  --start-ip-address "$MY_IP" \
  --end-ip-address "$MY_IP"
```

Remove that rule when it is no longer needed:

```bash
az postgres flexible-server firewall-rule delete \
  --resource-group "$RESOURCE_GROUP" \
  --name "$POSTGRES_SERVER" \
  --rule-name AllowDeploymentMachine \
  --yes
```

For a real environment, use private access/VNet integration rather than public database access. This guide keeps the first-time path understandable; the hardening section below lists the required follow-up.

## 6. Build and push the three images

Run these commands from the repository root. Azure Container Registry Tasks builds from the repository context and pushes the resulting images directly into ACR. Microsoft documents this flow in the [ACR build quickstart](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-quickstart-task-cli).

```bash
az acr build \
  --registry "$ACR_NAME" \
  --image "carchief/mock-api:${IMAGE_TAG}" \
  --file apps/mock-api/Dockerfile \
  .

az acr build \
  --registry "$ACR_NAME" \
  --image "carchief/public-web:${IMAGE_TAG}" \
  --file apps/public-web/Dockerfile \
  .

az acr build \
  --registry "$ACR_NAME" \
  --image "carchief/customer-app:${IMAGE_TAG}" \
  --file apps/customer-app/Dockerfile \
  .
```

Verify the images exist:

```bash
az acr repository list --name "$ACR_NAME" --output table
az acr repository show-tags --name "$ACR_NAME" --repository carchief/mock-api --output table
```

The build files intentionally use the repository root as context because workspace packages and the root `pnpm-lock.yaml` are required.

## 7. Create the Container Apps environment

Create one shared Container Apps environment. Apps in this environment can discover one another by app name.

```bash
az containerapp env create \
  --name "$CONTAINER_ENV" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION"
```

For larger or security-sensitive deployments, create the environment with a custom VNet and private database access. Do not add a public IP or public ingress to the mock API just to make the frontends work; the same-environment service name is sufficient.

## 8. Deploy the mock API first

The mock API is internal-only. It listens on port 4000, creates/migrates its schema on startup, and seeds the deterministic mock records through its normal PostgreSQL initialization path.

```bash
az containerapp create \
  --name mock-api \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$CONTAINER_ENV" \
  --image "${ACR_LOGIN_SERVER}/carchief/mock-api:${IMAGE_TAG}" \
  --target-port 4000 \
  --ingress internal \
  --registry-server "$ACR_LOGIN_SERVER" \
  --registry-username "$ACR_USERNAME" \
  --registry-password "$ACR_PASSWORD" \
  --secrets database-url="$DATABASE_URL" jwt-secret="$JWT_SECRET" \
  --env-vars \
    NODE_ENV=production \
    MOCK_API_PORT=4000 \
    ENABLE_MOCK_RESET=false \
    DATABASE_URL=secretref:database-url \
    JWT_SECRET=secretref:jwt-secret
```

Wait for the revision to become healthy:

```bash
az containerapp show \
  --name mock-api \
  --resource-group "$RESOURCE_GROUP" \
  --query "{provisioningState:properties.provisioningState,runningStatus:properties.runningStatus}" \
  --output table

az containerapp logs show \
  --name mock-api \
  --resource-group "$RESOURCE_GROUP" \
  --follow
```

You should see the application listening on port 4000. The internal health endpoint is not directly browser-accessible, so use the frontend health checks in the next section and inspect these logs when the frontends fail to start.

> Do not set `ENABLE_MOCK_RESET=true` in Azure. The reset route is destructive demo functionality and must not be exposed in an internet-facing environment.

## 9. Deploy the Public Web container

The public website’s server-side API proxy can reach `http://mock-api:4000` inside the shared Container Apps environment.

```bash
az containerapp create \
  --name public-web \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$CONTAINER_ENV" \
  --image "${ACR_LOGIN_SERVER}/carchief/public-web:${IMAGE_TAG}" \
  --target-port 3000 \
  --ingress external \
  --registry-server "$ACR_LOGIN_SERVER" \
  --registry-username "$ACR_USERNAME" \
  --registry-password "$ACR_PASSWORD" \
  --env-vars \
    NODE_ENV=production \
    PORT=3000 \
    API_BASE_URL=http://mock-api:4000 \
    NEXT_PUBLIC_CUSTOMER_APP_URL="https://<CUSTOMER_APP_FQDN>"
```

The `<CUSTOMER_APP_FQDN>` value is not known until the customer app is created. You can deploy with a temporary value, deploy the customer app, then update this variable and create a new revision.

Get the public website URL:

```bash
export PUBLIC_WEB_URL="https://$(az containerapp show \
  --name public-web \
  --resource-group "$RESOURCE_GROUP" \
  --query properties.configuration.ingress.fqdn --output tsv)"
echo "$PUBLIC_WEB_URL"
```

Verify:

```bash
curl -fsS "$PUBLIC_WEB_URL/healthz"
curl -fsS "$PUBLIC_WEB_URL/api/v1/vehicles?limit=1" | head
```

## 10. Deploy the Customer App container

The customer app is also externally accessible, but its browser bundle uses same-origin `/api/v1` calls. The Vite preview server proxies those calls at runtime to the internal mock API.

```bash
az containerapp create \
  --name customer-app \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$CONTAINER_ENV" \
  --image "${ACR_LOGIN_SERVER}/carchief/customer-app:${IMAGE_TAG}" \
  --target-port 3001 \
  --ingress external \
  --registry-server "$ACR_LOGIN_SERVER" \
  --registry-username "$ACR_USERNAME" \
  --registry-password "$ACR_PASSWORD" \
  --env-vars \
    NODE_ENV=production \
    PORT=3001 \
    CUSTOMER_API_PROXY_TARGET=http://mock-api:4000
```

Get the customer app URL:

```bash
export CUSTOMER_APP_URL="https://$(az containerapp show \
  --name customer-app \
  --resource-group "$RESOURCE_GROUP" \
  --query properties.configuration.ingress.fqdn --output tsv)"
echo "$CUSTOMER_APP_URL"
curl -fsS "$CUSTOMER_APP_URL/healthz"
```

Now update Public Web with the real customer URL:

```bash
az containerapp update \
  --name public-web \
  --resource-group "$RESOURCE_GROUP" \
  --set-env-vars "NEXT_PUBLIC_CUSTOMER_APP_URL=${CUSTOMER_APP_URL}"
```

`az containerapp update` creates a new revision. Wait until the new revision is running before testing the public account links.

## 11. Verify the complete deployment

### Basic health and proxy checks

```bash
curl -fsS "$PUBLIC_WEB_URL/healthz"
curl -fsS "$CUSTOMER_APP_URL/healthz"
curl -fsS "$PUBLIC_WEB_URL/api/v1/config/countries" | head
curl -fsS "$PUBLIC_WEB_URL/api/v1/vehicles?limit=1" | head
curl -fsS "$CUSTOMER_APP_URL/api/v1/config/countries" | head
```

The public website and customer app should return their HTML, and their same-origin `/api/v1` calls should return JSON rather than a proxy error.

### Browser checks

Open both URLs in a browser:

1. Public Web: verify home, vehicle listing, vehicle detail, freight, content, registration, and public enquiry flows.
2. Customer App: sign in with a current demo account, then verify dashboard, inventory, vehicle detail, enquiries, wishlist, payments, payment allocations, invoices, and statement.
3. Confirm the customer app’s browser network requests use its own origin, such as `https://<customer-app>/api/v1/...`; they must not contain `http://mock-api:4000`.
4. Confirm PostgreSQL-backed statement data appears with the default date range.
5. Open Swagger only if it is intentionally exposed through the mock API. For this deployment it is internal and should not be publicly reachable.

### Container and revision checks

```bash
az containerapp list \
  --resource-group "$RESOURCE_GROUP" \
  --query "[].{name:name,status:properties.runningStatus,url:properties.configuration.ingress.fqdn}" \
  --output table

az containerapp revision list \
  --name mock-api \
  --resource-group "$RESOURCE_GROUP" \
  --output table

az containerapp logs show --name public-web --resource-group "$RESOURCE_GROUP" --tail 100
az containerapp logs show --name customer-app --resource-group "$RESOURCE_GROUP" --tail 100
```

## 12. Database initialization, migrations, and demo data

The current mock API performs database initialization in `apps/mock-api/src/store.ts` during `store.ready()`. On a fresh Azure database it creates the required tables, indexes, constraints, lookup data, customer accounts, vehicles, financial records, and statement transactions.

The following table is particularly important for the current statement page:

```text
customer_statement_transactions
```

The API reads statement transactions from PostgreSQL; it does not use a runtime hardcoded statement fallback. PostgreSQL must therefore remain available for statement functionality.

For a clean demo environment:

1. Create a new empty PostgreSQL database.
2. Deploy/restart `mock-api`.
3. Wait for `store.ready()` to complete successfully in the mock API logs.
4. Verify the customer statement and payment data through the UI.

Do not use the destructive local reset script against an Azure-facing deployment. The script in `apps/mock-api/scripts/reset.mjs` calls `POST /api/v1/__reset`; the Azure container is intentionally configured with `ENABLE_MOCK_RESET=false`. If you need a clean demo dataset, create a new database/server or perform a reviewed database backup and reset procedure with an authorized operator.

## 13. Store secrets safely

The simple commands above pass secrets as Container Apps secrets. They do not place `DATABASE_URL` or `JWT_SECRET` in the image, source code, or browser bundle.

For a long-lived environment, store secrets in Azure Key Vault and reference them from Container Apps using managed identity. Microsoft’s [Container Apps secrets documentation](https://learn.microsoft.com/en-us/azure/container-apps/manage-secrets) describes the Key Vault reference format and the required `Key Vault Secrets User` role.

At minimum, protect these values:

- `DATABASE_URL`
- `JWT_SECRET`
- ACR pull credentials, if admin credentials are used
- Any future AutoPulse API credentials

Never put `DATABASE_URL`, PostgreSQL passwords, JWT secrets, or ACR passwords in `VITE_*` variables. Anything prefixed with `VITE_` can be embedded into a browser bundle.

## 14. Production hardening checklist

Before allowing real users or real financial data:

- Replace the mock API with the approved AutoPulse backend integration.
- Disable or remove demo accounts, demo passwords, seed data, Swagger exposure, and reset functionality.
- Use a PostgreSQL Flexible Server private network/VNet configuration and private DNS instead of public access.
- Use Key Vault references and managed identities.
- Use ACR managed-identity pulls instead of registry admin credentials.
- Add custom domains and managed HTTPS certificates. See [Container Apps custom domains](https://learn.microsoft.com/en-us/azure/container-apps/custom-domains-managed-certificates).
- Configure allowed origins/CORS and security headers for the actual domains.
- Add Azure Monitor alerts, log retention, backup verification, and cost budgets.
- Configure minimum replicas and health probes appropriate to traffic.
- Review customer authentication, token expiration, password recovery, authorization, and ownership rules with a security professional.
- Do not expose the mock API’s internal ingress, database, or pgAdmin to the public internet.

## 15. Updating the application after code changes

Use a new immutable image tag for every deployment:

```bash
export IMAGE_TAG="$(date +%Y%m%d%H%M%S)"

az acr build --registry "$ACR_NAME" --image "carchief/mock-api:${IMAGE_TAG}" --file apps/mock-api/Dockerfile .
az acr build --registry "$ACR_NAME" --image "carchief/public-web:${IMAGE_TAG}" --file apps/public-web/Dockerfile .
az acr build --registry "$ACR_NAME" --image "carchief/customer-app:${IMAGE_TAG}" --file apps/customer-app/Dockerfile .

az containerapp update \
  --name mock-api \
  --resource-group "$RESOURCE_GROUP" \
  --image "${ACR_LOGIN_SERVER}/carchief/mock-api:${IMAGE_TAG}"

az containerapp update \
  --name public-web \
  --resource-group "$RESOURCE_GROUP" \
  --image "${ACR_LOGIN_SERVER}/carchief/public-web:${IMAGE_TAG}"

az containerapp update \
  --name customer-app \
  --resource-group "$RESOURCE_GROUP" \
  --image "${ACR_LOGIN_SERVER}/carchief/customer-app:${IMAGE_TAG}"
```

Check the new revision before sending all traffic to it. Container Apps revisions allow you to keep an earlier image available for rollback. See the [Container Apps revisions documentation](https://learn.microsoft.com/en-us/azure/container-apps/revisions).

## 16. Troubleshooting

| Symptom | Check | Likely fix |
|---|---|---|
| Mock API revision fails | `az containerapp logs show -n mock-api -g "$RESOURCE_GROUP"` | Check `DATABASE_URL`, PostgreSQL firewall/networking, and `sslmode=require`. |
| Frontend loads but API calls fail | Browser Network tab and customer/public app logs | Confirm `API_BASE_URL=http://mock-api:4000` and `CUSTOMER_API_PROXY_TARGET=http://mock-api:4000`. |
| Customer browser tries `mock-api:4000` | Inspect the built browser request URL | Do not set `VITE_API_BASE_URL` to a Container Apps internal hostname; leave it unset. |
| PostgreSQL connection timeout | `az postgres flexible-server firewall-rule list -g "$RESOURCE_GROUP" -n "$POSTGRES_SERVER"` | Use private networking, or temporarily allow the required Azure service path. |
| Demo data is missing | Mock API startup logs and database row counts | Wait for initialization; verify the API is connected to the intended database, not a new/empty server with a typo in its URL. |
| ACR image pull fails | Container App revision events and registry settings | Verify image tag, registry server, username/password, or configure managed-identity ACR pull. |
| App returns 502/503 | `az containerapp show` running status and logs | Check whether the process listens on 0.0.0.0 and the configured target port: 4000, 3000, or 3001. |
| Public account links point to the wrong host | `NEXT_PUBLIC_CUSTOMER_APP_URL` on public-web | Update the environment variable and wait for the new revision. |

## 17. Cleanup

To remove everything created by this guide, first confirm the resource group contains no unrelated resources:

```bash
az resource list --resource-group "$RESOURCE_GROUP" --output table
```

Then delete the resource group. This deletes the Container Apps, registry, environment, and managed PostgreSQL server in that group:

```bash
az group delete --name "$RESOURCE_GROUP" --yes --no-wait
```

This is irreversible for resources without an independent backup. Microsoft’s [Container Apps tutorial](https://learn.microsoft.com/en-us/azure/container-apps/tutorial-deploy-first-app-cli) also uses resource-group deletion for cleanup.

## Official Microsoft references

- [Azure CLI installation](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
- [Azure Container Registry build tasks](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-quickstart-task-cli)
- [Deploy a first Azure Container App](https://learn.microsoft.com/en-us/azure/container-apps/tutorial-deploy-first-app-cli)
- [Container Apps ingress](https://learn.microsoft.com/en-us/azure/container-apps/ingress-how-to)
- [Container Apps communication and service discovery](https://learn.microsoft.com/en-us/azure/container-apps/connect-apps)
- [Container Apps environment variables](https://learn.microsoft.com/en-us/azure/container-apps/environment-variables)
- [Container Apps secrets and Key Vault](https://learn.microsoft.com/en-us/azure/container-apps/manage-secrets)
- [Azure Database for PostgreSQL Flexible Server quickstart](https://learn.microsoft.com/en-us/azure/postgresql/configure-maintain/quickstart-create-server)
- [Azure Container Apps custom domains and managed certificates](https://learn.microsoft.com/en-us/azure/container-apps/custom-domains-managed-certificates)
- [Azure Container Apps revisions](https://learn.microsoft.com/en-us/azure/container-apps/revisions)
