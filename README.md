# The Absurdity Feed

A dependency-free, full-screen question display for an office monitor.

## Run it

This version uses a hosted open-weight model through OpenRouter. It does not run
a model on your computer. Node.js 22.18 or newer is required for the small
TypeScript server that protects the API key.

1. Create an OpenRouter key. Never paste it into `index.html` or commit it.
2. Copy `.env.example` to `.env` and replace the placeholder with the key.
3. Start the site:

```sh
cp .env.example .env
npm start
```

Then visit <http://127.0.0.1:8080> and move that browser window to the spare monitor.
The `.env` file is ignored by Git.

## Controls

- Press Space: approve the current question and show the next one
- Click anywhere, press Enter, or press Right Arrow: skip without approving
- Press G: request an AI-generated question immediately
- Press X or click Reject: blacklist the current question and remove it immediately
- Press A: toggle automatic advance every 3 minutes
- Press F: toggle fullscreen

The reviewed local bank is shown first. After that, OpenRouter generates batches
of original candidates using its free-model router. AI questions are labeled
**Unreviewed AI** until approved. Prompts and responses are processed by the
selected OpenRouter provider; the API key remains only in the TypeScript server.

Approvals, rejections, and queued candidates are kept in this browser's
`localStorage`. Rejected questions cannot return on that browser. If OpenRouter
is unavailable or unconfigured, the site continues using reviewed local questions.
