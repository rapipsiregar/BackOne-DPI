# BackOne DPI Proxy — Deployment Reference

Standalone Docker image for collecting Netify DPI data and writing to MongoDB.

---

## Environment Variables

### Required

| Variable | Description |
|---|---|
| `NETIFY_SITE_UUIDS` | Comma-separated Netify site UUIDs (or single `NETIFY_SITE_UUID`) |
| `NETIFY_TOKEN` | Netify JWT token (or `NETIFY_JWT_TOKEN` / `NETIFY_API_KEY`) |

### MongoDB

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/backone_dpi` | MongoDB connection string |

### Collection Mode

| Variable | Default | Description |
|---|---|---|
| `PROXY_COLLECT_MODE` | `all` | `all` = all agents, `agent` = single agent, `agents` = list of agents |
| `PROXY_AGENT_UUID` | _(none)_ | Single agent UUID (required if `mode=agent`) |
| `PROXY_AGENT_UUIDS` | _(none)_ | Comma-separated agent UUIDs (required if `mode=agents`) |
| `PROXY_AGENT_DELAY_MS` | `5000` | Delay (ms) between each agent collection to avoid rate-limiting |

### Scheduling

| Variable | Default | Description |
|---|---|---|
| `PROXY_CRON_SCHEDULE` | `*/5 * * * *` | Cron expression for collection interval |
| `PROXY_CAPACITY_LOG_INTERVAL_MS` | `86400000` | How often to log DB capacity usage (default: 24h) |

### Limits

| Variable | Default | Description |
|---|---|---|
| `PROXY_FLOW_LIMIT` | `1000000` | Max flows to fetch per agent per cycle |
| `PROXY_PORT` | `4000` | REST API listen port |

### Netify API

| Variable | Default | Description |
|---|---|---|
| `NETIFY_INFORMATICS_BASE_URL` | `https://informatics.netify.ai/api/v1` | Netify API base URL |

---

## Docker Run Example

```bash
docker run -d \
  --name backone_proxy \
  -p 4000:4000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/backone_dpi \
  -e NETIFY_SITE_UUIDS=site-uuid-1,site-uuid-2 \
  -e NETIFY_TOKEN=your-jwt-token \
  -e PROXY_COLLECT_MODE=agents \
  -e PROXY_AGENT_UUIDS=agent-uuid-1,agent-uuid-2,agent-uuid-3 \
  backone-proxy
```

## Docker Compose Example

```yaml
services:
  proxy:
    build: ./proxy
    container_name: backone_proxy
    restart: always
    ports:
      - "4000:4000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/backone_dpi
      - PROXY_PORT=4000
      - PROXY_COLLECT_MODE=all
      - PROXY_COLLECT_MODE=${PROXY_COLLECT_MODE:-all}
      - PROXY_AGENT_UUID=${PROXY_AGENT_UUID:-}
      - PROXY_AGENT_UUIDS=${PROXY_AGENT_UUIDS:-}
      - PROXY_AGENT_DELAY_MS=${PROXY_AGENT_DELAY_MS:-5000}
      - PROXY_CRON_SCHEDULE=${PROXY_CRON_SCHEDULE:-*/5 * * * *}
      - NETIFY_SITE_UUIDS=${NETIFY_SITE_UUIDS}
      - NETIFY_TOKEN=${NETIFY_TOKEN}
      - NETIFY_INFORMATICS_BASE_URL=${NETIFY_INFORMATICS_BASE_URL:-https://informatics.netify.ai/api/v1}
```

## REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Liveness check (MongoDB status) |
| `GET` | `/status` | Scheduler status, mode, last run |
| `GET` | `/agents` | List agent UUIDs in MongoDB |
| `POST` | `/collect/all` | Manual trigger — all agents |
| `POST` | `/collect/:uuid` | Manual trigger — single agent |
| `POST` | `/collect/agents` | Manual trigger — multiple agents `{"uuids":[...], "delay_ms":5000}` |
| `GET` | `/latest` | Latest data from all collections (debug) |
| `GET` | `/domain-details?domain=...` | IP/MAC details for a domain |

## Health Check

```bash
curl http://localhost:4000/health
```
