# CarChief Azure Deployment Guide

This guide explains how to deploy the current CarChief demonstration application to Microsoft Azure:

- Public Website (`apps/public-web`)
- Customer App (`apps/customer-app`)
- Mock API (`apps/mock-api`)
- Mock PostgreSQL database

The deployment uses Azure Container Apps for the containers, Azure Container Registry (ACR) for images, and Azure Database for PostgreSQL Flexible Server for the mock database. The primary workflow below uses the Azure web portal; the previous command-line workflow is retained only as an appendix.

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

## 2. Azure Portal deployment — primary guide

### Before you begin

You need:

1. An Azure subscription where you can create resources.
2. An Azure Portal account with at least **Contributor** access to that subscription.
3. The repository source code available locally and preferably pushed to GitHub or Azure DevOps.
4. Three container images in Azure Container Registry:
   - `carchief/mock-api:<tag>`
   - `carchief/public-web:<tag>`
   - `carchief/customer-app:<tag>`
5. Strong values prepared for the PostgreSQL administrator password and mock API JWT secret.

Choose one Azure region for every resource, for example **East US** or the region closest to your users. Keep a short note of these names before starting:

| Item | Example | Your value |
|---|---|---|
| Resource group | `carchief-demo-rg` | |
| Container registry | `carchiefdemo12345` | |
| Container Apps environment | `carchief-demo-env` | |
| PostgreSQL server | `carchief-demo-pg12345` | |
| Database | `carchief_mock` | |
| Mock API app | `mock-api` | |
| Public Web app | `public-web` | |
| Customer App | `customer-app` | |
| Image tag | `20260824-1` | |

Resource group, Container Apps environment, and container app names are scoped to your subscription or resource group. The PostgreSQL server name and ACR registry name must be globally unique in Azure.

### Step 1: Sign in and create a resource group

1. Open [portal.azure.com](https://portal.azure.com) and sign in.
2. Use the top search bar to search for **Resource groups**.
3. Select **Create**.
4. Select your subscription.
5. Select **Create new** for Resource group and enter `carchief-demo-rg` or your chosen name.
6. Select your Azure region.
7. Select **Review + create**, then **Create**.
8. When deployment finishes, select **Go to resource**.

Keep every resource in this group for the first deployment. It makes cost tracking and eventual cleanup much simpler.

### Step 2: Create Azure Container Registry

Container Apps runs container images. Azure Container Registry is the private Azure location where the three application images are stored.

1. In the Portal search bar, search for **Container registries**.
2. Select **Create**.
3. Set Subscription and Resource group to the values created in Step 1.
4. Enter a globally unique Registry name, such as `carchiefdemo12345`. Use lowercase letters and numbers only.
5. Select the same Region as the resource group.
6. Choose **Basic** for a small demonstration. Use Standard or Premium only if you need their additional capacity or private networking features.
7. Select **Review + create**, then **Create**.
8. Select **Go to resource** when the deployment completes.
9. On the registry **Overview** page, copy the **Login server** value. It ends in `.azurecr.io`.

For a first portal deployment, open **Settings > Access keys** and enable **Admin user** only if the Container Apps creation screen cannot access the registry. This is a beginner-friendly bootstrap option, not the long-term security model. Later replace it with managed identity and the `AcrPull` role.

### Step 3: Put the three images in the registry

This is the only part that cannot be completed solely by clicking through the Azure Portal when the source code is only on your laptop. The Portal deploys existing images; it does not upload and build a local monorepo directory.

Use one of these options before continuing:

| Option | When to use it | What happens |
|---|---|---|
| GitHub/Azure DevOps build pipeline | Recommended for repeatable deployments | A pipeline builds each Dockerfile and pushes the images to ACR whenever code changes. |
| Azure Container Registry Task from a Git repository | Suitable when the repository is already remote | An ACR Task builds the repository from GitHub or Azure DevOps and pushes the resulting image. |
| One-time local build and push | Suitable for a first demonstration | Docker Desktop builds the images locally, then pushes them to ACR. The command appendix contains the exact commands. |

For an Azure Portal-led approach using a remote repository:

1. Push this repository to GitHub or Azure DevOps.
2. In the registry, open **Services > Tasks** and create a build task for each image.
3. Use the repository root as the build context, because this is a pnpm workspace monorepo.
4. Configure one task per Dockerfile:
   - `apps/mock-api/Dockerfile` → `carchief/mock-api:<tag>`
   - `apps/public-web/Dockerfile` → `carchief/public-web:<tag>`
   - `apps/customer-app/Dockerfile` → `carchief/customer-app:<tag>`
5. Connect the task to the Git repository and branch. A private repository requires the source-provider credentials requested by Azure.
6. Run each task once and open **Tasks > Runs** to wait for a successful result.
7. Open **Services > Repositories** and verify that all three repositories and the selected tags are visible.

Azure Container Registry Tasks require a remote Git context, not a folder sitting only on your laptop. See Microsoft’s [ACR Tasks overview](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-tasks-overview).

Do not proceed until these three images appear in **Repositories**. The rest of this guide uses only the Portal.

### Step 4: Create the managed PostgreSQL server

The mock API needs PostgreSQL. Use **Azure Database for PostgreSQL Flexible Server**, not an internet-exposed PostgreSQL container and not the local pgAdmin service from Docker Compose.

1. In the Portal search bar, search for **Azure Database for PostgreSQL flexible servers**.
2. Select **Create**.
3. On **Basics**:
   - Select your Subscription and Resource group.
   - Enter your globally unique PostgreSQL server name.
   - Select the same Region.
   - Choose PostgreSQL version **16**.
   - Select a development/burstable compute option for a demo environment, for example `Standard_B1ms`, if available in your region.
   - Set the administrator login, for example `carchiefadmin`.
   - Set and safely store a strong administrator password.
4. On **Networking**, select **Public access (allowed IP addresses)** for this first demo deployment.
5. Add your current client IP so you can inspect the database if needed.
6. Select **Allow public access from any Azure service within Azure to this server** only for this temporary demo deployment. This allows the Container Apps environment to reach the database, but it is broad: it allows Azure services beyond this application. A production deployment must use private networking.
7. Leave backup and other advanced options at suitable defaults for a demonstration, then select **Review + create** and **Create**.
8. Wait for deployment to complete and select **Go to resource**.

Microsoft documents these portal fields and the networking choices in its [PostgreSQL Flexible Server quickstart](https://learn.microsoft.com/en-us/azure/postgresql/configure-maintain/quickstart-create-server) and [firewall rules guidance](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/security-firewall-rules).

### Step 5: Create the `carchief_mock` database

The Flexible Server provides a default `postgres` database. Create the database used by the mock API:

1. Open the newly created PostgreSQL server in the Portal.
2. In the left menu, select **Databases**.
3. Select **Create**.
4. Enter `carchief_mock`.
5. Select **Save** or **Create**.
6. Return to **Overview** and copy the server endpoint, such as `carchief-demo-pg12345.postgres.database.azure.com`.

Write down the following values somewhere secure:

| Value | Example |
|---|---|
| PostgreSQL hostname | `carchief-demo-pg12345.postgres.database.azure.com` |
| Database name | `carchief_mock` |
| Administrator username | `carchiefadmin` |
| Administrator password | the value you created |

The mock API connection string format is:

```text
postgresql://<ADMIN_USER>:<PASSWORD>@<POSTGRES_HOST>:5432/carchief_mock?sslmode=require
```

If your password contains `@`, `:`, `/`, `?`, `#`, spaces, or other URL-reserved characters, it must be URL-encoded in this connection string. The simplest first deployment is to use a strong password that avoids those characters, then store the full connection string as a Container Apps secret.

### Step 6: Create the Container Apps environment

All three containers must be in one Container Apps environment so the two frontends can reach the internal mock API by the name `mock-api`.

1. In the Portal search bar, search for **Container Apps**.
2. Select **Create**, then **Container App**.
3. On **Basics**, select your Subscription, Resource group, and Region.
4. For Container Apps environment, select **Create new**.
5. Name it `carchief-demo-env` or your chosen name.
6. Continue to create the Mock API in the next step. Creating the first app also creates this shared environment.

### Step 7: Create the internal Mock API container app

The Mock API must be created first because the web applications depend on it. It will be internal-only; public users will never browse to it directly.

1. In the Container App creation wizard, set Container app name to `mock-api`.
2. Keep **Deployment source** as **Container image**.
3. On the **Container** tab:
   - Clear **Use quickstart image** if selected.
   - Select **Azure Container Registry** as the image source.
   - Select your subscription and registry.
   - Select image repository `carchief/mock-api` and the tag created in Step 3.
   - Set CPU to at least `0.5` and memory to at least `1 Gi` for the first run.
4. On the **Ingress** tab:
   - Enable ingress.
   - Choose **Limited to Container Apps Environment** (internal ingress).
   - Set Target port to `4000`.
   - Leave insecure connections disabled.
5. Select **Review + create**, then **Create**.

The first revision may fail until its database secret and environment variables are configured. That is expected; complete the next steps immediately.

#### Add Mock API secrets

1. Open the `mock-api` Container App.
2. In the left menu, select **Application > Secrets**.
3. Select **Add** and create these two secrets:

| Secret name | Value |
|---|---|
| `database-url` | The full PostgreSQL connection string from Step 5 |
| `jwt-secret` | A long random secret used to sign mock API tokens |

4. Select **Save**.

#### Add Mock API environment variables

1. In the left menu, select **Revisions and replicas**.
2. Select **Create new revision**.
3. Edit the container and open its **Environment variables** section.
4. Add the following values. For the last two rows, select **Secret** as the source and choose the matching secret.

| Name | Source | Value |
|---|---|---|
| `NODE_ENV` | Manual | `production` |
| `MOCK_API_PORT` | Manual | `4000` |
| `ENABLE_MOCK_RESET` | Manual | `false` |
| `DATABASE_URL` | Secret | `database-url` |
| `JWT_SECRET` | Secret | `jwt-secret` |

5. Select **Create** to start the new revision.
6. Return to **Overview** and wait until the running status is healthy.
7. Select **Monitoring > Log stream**. Confirm that the logs say the Mock API is listening on port `4000` and do not show a database initialization error.

Do not enable mock reset in Azure. It is intentionally disabled because it deletes/recreates demonstration data.

### Step 8: Create the external Customer App container

Create the customer portal next, so its public URL can be used in the Public Website configuration.

1. Return to **Container Apps** and select **Create > Container App**.
2. On **Basics**, select the existing resource group, region, and existing Container Apps environment.
3. Set Container app name to `customer-app`.
4. On **Container**:
   - Choose your ACR registry.
   - Choose repository `carchief/customer-app` and the intended tag.
   - Set CPU to `0.5` and memory to `1 Gi` as a starting point.
   - Add these environment variables:

| Name | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `CUSTOMER_API_PROXY_TARGET` | `http://mock-api:4000` |

5. On **Ingress**:
   - Enable ingress.
   - Choose **Accepting traffic from anywhere**.
   - Set Target port to `3001`.
   - Keep HTTPS-only behavior enabled.
6. Select **Review + create**, then **Create**.
7. When deployed, open the app **Overview** page and copy its **Application URL**. It will be the Customer App URL.
8. Open `<Customer App URL>/healthz` in a browser. It should return a small JSON health response.

Never set `VITE_API_BASE_URL` to `http://mock-api:4000`. `VITE_*` values are baked into browser JavaScript, and a user’s browser cannot resolve the internal Container Apps service name. The runtime proxy variable above is the correct configuration.

### Step 9: Create the external Public Website container

1. Return to **Container Apps** and select **Create > Container App**.
2. Select the same Subscription, resource group, region, and existing Container Apps environment.
3. Set Container app name to `public-web`.
4. On **Container**:
   - Choose your ACR registry.
   - Choose `carchief/public-web` and the intended tag.
   - Add these environment variables:

| Name | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `API_BASE_URL` | `http://mock-api:4000` |
| `NEXT_PUBLIC_CUSTOMER_APP_URL` | Build-time Docker/ACR argument containing the complete Customer App URL, including `https://` |

5. On **Ingress**, enable it, select **Accepting traffic from anywhere**, and set Target port to `3000`.
6. Select **Review + create**, then **Create**.
7. Copy the **Application URL** from Overview.
8. Open `<Public Website URL>/healthz` in a browser. It should return JSON.

The public web API proxy is server-side, so `API_BASE_URL=http://mock-api:4000` is safe. It is not delivered to visitors’ browsers as a public API URL.

### Step 10: Verify the application in the browser

Perform these checks before sharing the URLs:

1. Open the Public Website URL.
2. Open All Stock and confirm that vehicles load.
3. Open a vehicle detail page and confirm images and detail data load.
4. Open the Customer App URL and sign in with one of the documented demo accounts.
5. Confirm dashboard, inventory, vehicle details, enquiries, wishlist, payments, payment allocations, invoices, and statement pages load.
6. In the browser’s Developer Tools **Network** tab, confirm Customer App API calls use the same origin, for example `https://<customer-app-host>/api/v1/...`.
7. Confirm there is no browser call to `mock-api:4000` and no database password exposed in browser requests.
8. In the `mock-api` Container App, open **Monitoring > Log stream** and confirm there are no database connection errors.

The mock API creates/updates its own schema and loads its deterministic demo data during startup. This includes PostgreSQL-backed statement transactions. If statement pages are empty, inspect the Mock API log stream first.

### Step 11: View logs, restart, or roll back in the Portal

For any Container App:

1. Open the app in the Portal.
2. Use **Monitoring > Log stream** for live application logs.
3. Use **Revisions and replicas** to see the active revision and its status.
4. Select a failed revision to inspect its events and logs.
5. To restart after changing a secret, create a new revision or restart the active revision. Secret changes do not automatically change a running revision.
6. To roll back an image/configuration change, activate the previously healthy revision and direct traffic back to it from **Revisions and replicas**.

Microsoft’s [Container Apps revisions documentation](https://learn.microsoft.com/en-us/azure/container-apps/revisions) explains how revision changes and rollback work.

### Step 12: Deploy a later version manually through the Portal

When a new image tag has been pushed to ACR:

1. Open the relevant Container App.
2. Select **Revisions and replicas**.
3. Select **Create new revision**.
4. Edit the container image and select the new tag from your ACR repository.
5. Do not change environment variables unless the release requires it.
6. Create the revision and wait for it to become healthy.
7. Test the app URL.
8. Only then deactivate the previous revision if you do not need an immediate rollback option.

Update in this order when backend contracts change: Mock API first, then Public Web and Customer App.

### Step 13: Portal cleanup

When you no longer need the demonstration environment:

1. Open the resource group created in Step 1.
2. Review the resource list carefully.
3. Select **Delete resource group**.
4. Type the resource group name to confirm.
5. Select **Delete**.

This deletes the Container Apps, Container Apps environment, registry, PostgreSQL server, database, and all demo data in that resource group. Export or back up anything you need before deleting it.

## Appendix A. Azure CLI alternative

You need:

1. An Azure subscription with permission to create resource groups, Container Apps, ACR, and PostgreSQL Flexible Server resources.
2. Docker Desktop, if you want to build images locally. This guide uses Azure Container Registry Tasks instead, so local Docker is optional.
3. Azure CLI 2.x.
4. `psql` client tools for optional database verification.
5. A terminal running Bash, zsh, or Azure Cloud Shell Bash.
6. This repository checked out locally.

For a first deployment, choose one Azure region and use it for all resources. The commands below use `eastus`; change it if your subscription or users are closer to another region.

Azure resource names must be globally unique where noted. The examples use a suffix that you should replace.

### A.1 Install Azure CLI and sign in

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

### A.2 Create the Azure resource group and registry

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

### A.3 Create the managed PostgreSQL database

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

### A.4 Build and push the three images

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
  --build-arg "NEXT_PUBLIC_CUSTOMER_APP_URL=${CUSTOMER_APP_URL}" \
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

### A.5 Create the Container Apps environment

Create one shared Container Apps environment. Apps in this environment can discover one another by app name.

```bash
az containerapp env create \
  --name "$CONTAINER_ENV" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION"
```

For larger or security-sensitive deployments, create the environment with a custom VNet and private database access. Do not add a public IP or public ingress to the mock API just to make the frontends work; the same-environment service name is sufficient.

### A.6 Deploy the mock API first

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

### A.7 Deploy the Public Web container

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
    API_BASE_URL=http://mock-api:4000
```

The customer portal URL is a `NEXT_PUBLIC_*` value and is embedded during the public-web image build. Pass it with `--build-arg NEXT_PUBLIC_CUSTOMER_APP_URL=...` when building the image; do not rely on a Container App runtime variable for this value.

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

### A.8 Deploy the Customer App container

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

Rebuild the public-web image with the real customer URL after obtaining `CUSTOMER_APP_URL`, then deploy that new image. Updating only Container App runtime variables will not change the already-built browser bundle.

### A.9 Verify the complete deployment

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

### A.10 Database initialization, migrations, and demo data

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

### A.11 Store secrets safely

The simple commands above pass secrets as Container Apps secrets. They do not place `DATABASE_URL` or `JWT_SECRET` in the image, source code, or browser bundle.

For a long-lived environment, store secrets in Azure Key Vault and reference them from Container Apps using managed identity. Microsoft’s [Container Apps secrets documentation](https://learn.microsoft.com/en-us/azure/container-apps/manage-secrets) describes the Key Vault reference format and the required `Key Vault Secrets User` role.

At minimum, protect these values:

- `DATABASE_URL`
- `JWT_SECRET`
- ACR pull credentials, if admin credentials are used
- Any future AutoPulse API credentials

Never put `DATABASE_URL`, PostgreSQL passwords, JWT secrets, or ACR passwords in `VITE_*` variables. Anything prefixed with `VITE_` can be embedded into a browser bundle.

### A.12 Production hardening checklist

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

### A.13 Updating the application after code changes

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

### A.14 Troubleshooting

| Symptom | Check | Likely fix |
|---|---|---|
| Mock API revision fails | `az containerapp logs show -n mock-api -g "$RESOURCE_GROUP"` | Check `DATABASE_URL`, PostgreSQL firewall/networking, and `sslmode=require`. |
| Frontend loads but API calls fail | Browser Network tab and customer/public app logs | Confirm `API_BASE_URL=http://mock-api:4000` and `CUSTOMER_API_PROXY_TARGET=http://mock-api:4000`. |
| Customer browser tries `mock-api:4000` | Inspect the built browser request URL | Do not set `VITE_API_BASE_URL` to a Container Apps internal hostname; leave it unset. |
| PostgreSQL connection timeout | `az postgres flexible-server firewall-rule list -g "$RESOURCE_GROUP" -n "$POSTGRES_SERVER"` | Use private networking, or temporarily allow the required Azure service path. |
| Demo data is missing | Mock API startup logs and database row counts | Wait for initialization; verify the API is connected to the intended database, not a new/empty server with a typo in its URL. |
| ACR image pull fails | Container App revision events and registry settings | Verify image tag, registry server, username/password, or configure managed-identity ACR pull. |
| App returns 502/503 | `az containerapp show` running status and logs | Check whether the process listens on 0.0.0.0 and the configured target port: 4000, 3000, or 3001. |
| Public account links point to the wrong host | `NEXT_PUBLIC_CUSTOMER_APP_URL` in the public-web browser bundle | Rebuild with `--build-arg NEXT_PUBLIC_CUSTOMER_APP_URL=...` and deploy a new image tag. |

### A.15 Cleanup

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
