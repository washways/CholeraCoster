Cloudflare Worker proxy for World Bank API

This Worker forwards requests to `https://api.worldbank.org/v2/...` and adds CORS headers so browser clients (e.g., the CholeraCoster app) can fetch data from the World Bank.

Quick deploy using Wrangler (recommended)

1. Install Wrangler:

```bash
npm install -g wrangler
```

2. Login and configure:

```bash
wrangler login
# or follow instructions to authenticate via the dashboard and get account_id
```

3. Edit `wrangler.toml` and set your `account_id`. Optionally set `workers_dev = true` to get a dev subdomain.

4. Publish the worker:

```bash
cd cloudflare_worker
wrangler publish
```

5. Note the published worker URL (e.g., https://wb-proxy-worker.your-subdomain.workers.dev) and paste it into `calculator.js` at the `CLOUDFLARE_WB_PROXY` constant.

Alternative: Deploy via the Cloudflare dashboard

- Go to the Workers section in your Cloudflare dashboard.
- Create a new Worker, paste the contents of `worker.js`, save and deploy.
- Copy the Worker URL and update `calculator.js`.

Security note: this worker simply forwards public World Bank data. If you plan to add authentication or rate-limiting, implement those in the Worker.
