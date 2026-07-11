# AI Image Editor

A web application that lets users upload a photo, run it through OpenCV
image filters, preview and download the result, and keep a history of past
edits. Built with a Python Flask backend for image processing and a plain
HTML/CSS/JS frontend.

## What it does

- Upload an image (drag & drop or click to browse)
- Apply one of several OpenCV filters: **Grayscale, Cartoon, Sketch, Blur,
  Edge Detection, Sharpen, Rotate, Flip**
- Adjust **Brightness** and **Contrast** on top of any filter
- Preview the original and edited image side by side
- Download the result
- Browse a history of past edits, with delete

## Project versions

This project exists in a few variants depending on where and how you want
to run it:

| Version | Auth & Database | History storage | Best for |
|---|---|---|---|
| **Full** | Firebase Authentication + Firestore + Storage | Cloud (Firebase) | A real multi-user app with accounts, deployed properly (Firebase Hosting + Render/Railway backend) |
| **Simple** | None — open to anyone who loads the page | Local JSON file + saved PNGs on the server's disk | Running on your own machine or a host with persistent storage (e.g. Render) |
| **Vercel** | None | Browser `localStorage`, per device | Deploying specifically to Vercel, whose serverless functions can't write files to disk |

All three share the same core: `filters.py` (the OpenCV logic) and the same
visual design.

## Tech stack

| Component | Technology |
|---|---|
| Frontend | HTML5, CSS3, vanilla JavaScript |
| Backend | Python, Flask |
| Computer vision | OpenCV (`opencv-python-headless`) |
| Auth (Full version only) | Firebase Authentication |
| Database (Full version only) | Firebase Firestore |
| Image storage (Full version only) | Firebase Storage |
| Hosting | Firebase Hosting / Render / Railway / Vercel, depending on version |

## Design

The interface uses a "darkroom / filmstrip" visual theme — a charcoal
background, an amber "safelight" accent, and image previews framed with
filmstrip sprocket holes — since the product's whole job is showing frames
of an image. Typography pairs a condensed display face for headings with a
monospace face for technical labels (filter names, timestamps), evoking
exposure/EXIF readouts on a contact sheet.

## Filters (OpenCV logic, in `filters.py`)

- `to_grayscale` — standard BGR→grayscale conversion
- `apply_blur` — Gaussian blur
- `edge_detect` — Canny edge detection
- `pencil_sketch` — grayscale + inverted Gaussian blur dodge blend
- `cartoonify` — bilateral filtering for flat color regions + adaptive
  threshold edges, combined
- `sharpen` — 3×3 sharpening convolution kernel
- `rotate` — rotation with automatic canvas resizing so nothing gets cropped
- `flip` — horizontal or vertical flip
- `adjust_brightness_contrast` — linear brightness/contrast adjustment

All filters were tested end-to-end against the actual Flask routes before
being handed over — not just unit-tested in isolation.

## Running it

Pick the version that matches where you're deploying:

- **Local machine, quick demo** → Simple version: `pip install -r
  requirements.txt` then `python app.py`, open `http://localhost:5000`
- **Deploying on Render/Railway** → Simple version works as-is (uses local
  disk for history, which persists on those hosts)
- **Deploying on Vercel** → use the Vercel version (`vercel.json` +
  browser-based history, since Vercel has no persistent filesystem)
- **Real multi-user app with logins** → Full version, requires setting up a
  Firebase project first (Authentication, Firestore, Storage)

Each version's own README has the exact setup steps for that variant.

## Folder structure (Full version)

```
AI-Image-Editor/
├── frontend/
│   ├── index.html, login.html, register.html, dashboard.html,
│   │   history.html, about.html, contact.html
│   ├── css/  (style, login, dashboard, history, responsive)
│   └── js/   (firebase-config, auth, upload, history, app)
├── backend/
│   ├── app.py         Flask routes
│   ├── filters.py      OpenCV filter functions
│   ├── firebase.py     Firebase Admin SDK helpers
│   └── requirements.txt
├── uploads/, output/    scratch folders
└── README.md
```

## Future enhancement ideas

- AI background removal
- Face detection / face blur
- OCR text extraction
- Image compression and watermarking
- Batch processing
- AI image upscaling
