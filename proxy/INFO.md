# BackOne DPI Proxy — Deployment Reference

Standalone proxy service for collecting BackOne DPI data and writing to MongoDB.

---

## Environment Variables

### Required

| Variable | Description |
|---|---|
| `BACKONE_SITE_UUIDS` | Comma-separated BackOne site UUIDs |
| `BACKONE_TOKEN` | BackOne API Token / Key |

### MongoDB

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/backone_inspect_0` | MongoDB connection string |

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
| `PROXY_CRON_SCHEDULE` | `*/10 * * * *` | Cron expression for collection interval |
| `PROXY_CAPACITY_LOG_INTERVAL_MS` | `86400000` | How often to log DB capacity usage (default: 24h) |

### Limits

| Variable | Default | Description |
|---|---|---|
| `PROXY_FLOW_LIMIT` | `1000000` | Max flows to fetch per agent per cycle |
| `PROXY_PORT` | `4010` | REST API listen port |

### BackOne API

| Variable | Default | Description |
|---|---|---|
| `BACKONE_INFORMATICS_BASE_URL` | `https://api0.dev.backone.cloud/api/v1` | BackOne API base URL |

---

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
