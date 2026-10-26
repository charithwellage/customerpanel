#!/bin/sh
set -e

# When CUSTOMER_API_PROXY_TARGET points to localhost (or is unset), start the embedded in-memory Mock API
if [ -z "$CUSTOMER_API_PROXY_TARGET" ] || [ "$CUSTOMER_API_PROXY_TARGET" = "http://127.0.0.1:4000" ] || [ "$CUSTOMER_API_PROXY_TARGET" = "http://localhost:4000" ]; then
  echo "Starting embedded in-memory Mock API on port 4000..."
  MOCK_API_PORT=4000 node apps/mock-api/dist/server.js &
fi

exec pnpm --filter @carchief/customer-app preview
