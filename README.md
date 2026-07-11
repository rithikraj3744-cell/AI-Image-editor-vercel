# AI Image Editor — Vercel version

Same app, adapted to run on Vercel's serverless Python runtime.

## Key differences from the "Simple" version

- **No server-side history file.** Vercel serverless functions don't have a
  persistent filesystem, so `/apply` now just processes an image and returns
  it — nothing is written to disk.
- **History lives in the browser's `localStorage` instead** (see
  `static/js/app.js`). Each edit result is saved as a base64 image directly
  in the browser, per device — no shared/server database. Capped at the last
  20 edits to avoid hitting localStorage's ~5MB limit.
- **`vercel.json`** tells Vercel this is a Python/Flask app and routes every
  request to `app.py`.

## Deploy to Vercel

1. Push this folder to a GitHub repo (same as before).
2. Go to [vercel.com](https://vercel.com), sign up/log in with GitHub.
3. Click **Add New → Project**, import the repo.
4. Vercel should auto-detect the Python runtime from `vercel.json`. Leave
   build settings as default. Click **Deploy**.
5. You'll get a URL like `your-project.vercel.app` — works from any device.

## Run locally first (recommended before deploying)

```bash
pip install -r requirements.txt
python app.py
```

Open http://localhost:5000 — behaves identically to the deployed version,
since history was already moved to the browser rather than the server.

## Heads up on size

OpenCV is a fairly large dependency. If Vercel's build fails with a size or
timeout error, that's the most likely cause — `opencv-python-headless` (used
here, the lightweight build with no GUI bindings) is already the leanest
option, but Vercel's serverless function size limits can still be tight
depending on their current plan. If it doesn't fit, Render (no such size
limit) is the more reliable host for this specific stack.
