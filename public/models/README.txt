Add custom models here.

Dog (optional, local override):
- Place a rigged dachshund GLB at: public/models/dachshund.glb
  The app will auto-detect it and use it instead of the fallback Fox model.

Notes:
- If the file is missing, the app falls back to a remote sample (Fox.glb).
- Ensure the server serves the file (no HTML fallback). In Vite, files under /public are served at the root: /models/dachshund.glb
