# Iteration Log - 2026-07-09 12:22 (Domain Fallback & Bandwidth Discrepancy Resolution)

- **Requested Issues**:
  - Explain why download/upload numbers differ between the Top Apps tab (Overview) and the Application Details Modal.
  - Explain how the application details data is retrieved.
  - Explain and resolve why the Domain column displayed dashes (`"-"`).

- **Steps Taken**:
  - Identified that the bandwidth difference was due to the dashboard's active **Time Range Filter**:
    - The **Top Apps tab** displayed cumulative, historical metrics for the selected agent over all time (e.g. **372.29 GB**).
    - The **YouTube Details Modal** queries the `/app-details` backend route, which enforces the selected overview time filter (e.g., **1 hour**, yielding **29.83 GB**).
  - Clarified the **Data Retrieval Source**:
    - IP list, upload, and download volumes are retrieved from the MongoDB `DeviceAppStat` collection, which is updated every 5 minutes by the Proxy collector pulling from Netify's `/data/stats/top/local_ip/...` APIs.
  - Resolved the **Domain dashes (`"-"`)** issue:
    - Found that since active flow records are pruned (older than 1 hour), resolving domains purely by matching IP flows often returned null if flows were already cleared.
    - Updated [`backend/routes/appDetailsHandler.js`](file:///d:/FILE/Magang/Deep%20Package%20Inspection/backend/routes/appDetailsHandler.js) to pre-load application metadata from Netify Lookup APIs.
    - If active flow matching doesn't resolve a domain, the handler now falls back to the application's default homepage domain (e.g., `youtube.com` for YouTube) instead of returning `null`.
  - Verified compilation via `npx tsc --noEmit`.

- **Outcome**:
  - Dashboard details display clean, valid homepage domains instead of empty dashes.
  - Provided a clear architectural description of metrics calculations.
