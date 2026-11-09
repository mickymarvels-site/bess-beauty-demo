# Bess Beauty — isolated website demo

A standalone salon and braiding academy demo, with customer pages and an admin studio. This folder is its own Git repository. Its dedicated remote is https://github.com/mickymarvels-site/bess-beauty-demo. It is not connected to any other project.

## Preview in VS Code

Open this folder in VS Code. In its terminal run:

```sh
python3 -m http.server 4173 --directory public
```

Visit http://localhost:4173. Open **Admin studio** to edit classes, video sample links, prices, promotions, contact email and gallery photos. Publish changes, then return to the customer website. Locally, data stays in this browser only. Drafts do not change the published customer view. Export content downloads a backup; there is no import flow yet.

## Deploy a separate test site with Git and Netlify

1. This project uses the dedicated GitHub repository https://github.com/mickymarvels-site/bess-beauty-demo. Open this folder in VS Code to manage its files and commits.
2. In Netlify, add a **new project**, import that repository, and choose a distinct site name such as `bess-beauty-demo`. Do not link this folder to any existing Netlify site.
3. Netlify reads `netlify.toml`. Publish directory: `public`. Functions directory: `netlify/functions`. No build command is needed; Netlify installs the package.json dependency.
4. Add a site-specific environment variable `ADMIN_PASSWORD` with a unique password of at least 16 characters, available to Functions. Redeploy after setting it. Never commit the password.
5. Open the deployed site’s Admin studio, enter that password, update the content and publish. Netlify Blobs stores published content for everyone visiting this test site. Opening the admin form does not grant permission to publish; writes are checked by the server.

Only connect this demo repository and its own Netlify site. No custom domain is needed. Node 22 is configured for Netlify. For local server-function testing, install Node 22, run `npm install`, then use Netlify CLI (`netlify dev`); the Python preview serves only the frontend.

## What works

- Responsive customer website using the supplied logo and class information.
- Buy buttons, a persistent browser cart, quantity updates, removal and subtotal. Unpriced items cannot be added. Cart items resolve against the currently published catalog; hidden/deleted items are removed and prices refresh on page load. Checkout is a preview only; no orders or payments are created.
- Class/video add, edit, hide and delete; editable prices and schedules.
- Admin MPEG-4 (.mp4/.m4v) and WebM video uploads, up to 15 MB per preview. Choose a file, then click Upload selected video. Selected filenames and inline errors remain visible across retries; publish waits until selected videos finish uploading. Selected files are held in memory until upload and must be selected again after reloading the page. Chunked into 3 MB requests to Netlify Blobs, validated and attached to a draft. Published visible uploads play inline with seeking support. The media route serves only currently published, visible uploads. Hiding/removing one and publishing revokes that route on subsequent requests.
- Promotion banner and contact email.
- Gallery uploads (JPEG, PNG, WebP, max 1 MB each; max 4 MB total published data).
- Browser-local drafts, explicit publishing and JSON export. A sticky footer publish bar shows pending changes and publishes all draft edits together. Both publish buttons wait for photo/video uploads and show progress/success/errors. Edits made while publishing remain in the draft for the next publish.
- Shared published data on Netlify, with server-checked admin password.

## Demo boundaries

- No payments, appointment scheduling, customer accounts, private video hosting or purchase access. Video links and uploads are public samples, never paid lesson URLs. Larger/longer video hosting needs a separate video service; direct HTTPS MP4/M4V/WebM URLs also play inline. Unattached/replaced upload blobs are retained; automatic storage cleanup is not implemented.
- Publicly published photos and sample links are visible to anyone with the site URL. The demo is not a private site gate.
- Admin studio has no user management, password reset, login sessions, rate limiting or edit conflict detection. Before a business launch, add managed authentication with admin roles and protect paid lessons with server-side purchase checks.
- Gallery contains labeled placeholders until real photos are uploaded. No fabricated reviews, locations or service prices.
- The second recorded course price is unconfirmed; its price field is intentionally blank.
- Google Fonts loads remotely; system fonts are the fallback.

## Verification

Frontend and server code require JavaScript runtime/browser checks. This machine did not have Node/npm on the initial environment PATH; deployment and Netlify Blobs integration must be verified on the new Netlify site. No Netlify deployment has been performed.
