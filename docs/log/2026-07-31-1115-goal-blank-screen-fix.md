# Iteration Log — 2026-07-31 11:15 (Goal: Fix Blank White Screen via Symlink & TDD Verification)

## Trigger
`/goal dengan workflow TDD, fix error bug crash ini` — User provided a screenshot showing a blank white screen when opening `https://demoplace.my.id`.

## TDD Investigation & Root Cause Diagnosis
1. **Diagnosis Strategy**:
   - Analyzed why the browser rendered a completely blank white screen (#FFFFFF).
   - Created `scripts/test-static-assets.js` to extract and fetch all `<script>` and `<link rel="stylesheet">` URLs from the live HTML returned by `https://demoplace.my.id/login`.
2. **Root Cause Found**:
   - All static assets requested by the browser (`/_next/static/chunks/main-app-....js`, `/_next/static/chunks/app/login/page-....js`, `/_next/static/css/....css`) returned **HTTP 404 Not Found**.
   - Next.js in standalone mode places static files inside `.next/standalone/.next/static/`, but Apache & Nginx were requesting assets at path `/_next/static/...` on the public web root (`/home/adminbackend/web/demoplace.my.id/public_html/`).
   - Because `/_next/` did not exist on disk, Apache forwarded asset requests through `proxy.php`, which returned 404. Without JavaScript chunks and CSS loading, React failed to hydrate, rendering a blank white screen in the user's browser.

## Fix Applied (TDD Workflow)
1. **Created Permanent Symlink on Server**:
   - Executed SSH command:
     `ln -sfn /home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/.next /home/adminbackend/web/demoplace.my.id/public_html/_next`
     `ln -sfn /home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/.next/static /home/adminbackend/web/demoplace.my.id/public_html/.next/static`
2. **Automated Symlink Creation in Build & Deploy Pipelines**:
   - Updated [deploy-sftp.js](file:///c:/z_Siregar/Magang%20DBS/BackOne-DPI/DPI-Source%20API%20Netify/scripts/deploy-sftp.js) and [force-deploy-frontend.js](file:///c:/z_Siregar/Magang%20DBS/BackOne-DPI/DPI-Source%20API%20Netify/scripts/force-deploy-frontend.js) so every future deployment automatically creates and updates the `_next` symlink.

## Empirical TDD Verification
- Created `scripts/tdd-static-asset-test.js` to automatically fetch every JS script and CSS asset referenced by `https://demoplace.my.id/login`.
- **Test Result**:
  - `/_next/static/chunks/4bd1b696-8cf9698c92a95c96.js` -> **HTTP 200**
  - `/_next/static/chunks/517-57eddf9feee3c332.js` -> **HTTP 200**
  - `/_next/static/chunks/main-app-9fb0b043d9954a2a.js` -> **HTTP 200**
  - `/_next/static/chunks/app/login/page-51d08e50b1dbd4a0.js` -> **HTTP 200**
  - `/_next/static/chunks/poly-fills-c67ab51200d55988.js` -> **HTTP 200**
  - `/_next/static/css/e7a2b95bc8bf0aa2.css` -> **HTTP 200**
  - `/_next/static/css/ff51f7bb8f170f2f.css` -> **HTTP 200**
  - **[TDD TEST RESULT: PASS] 100% Success.**

## Outcome
- **RESOLVED 100%**. Static JS and CSS assets now load with HTTP 200 OK directly, enabling React hydration and fixing the blank white screen issue.
