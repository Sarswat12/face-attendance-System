
  # Face Recognition Attendance System

  This is a code bundle for Face Recognition Attendance System. The original project is available at https://www.figma.com/design/c3o6QLxaA2Il7h1Rair6dr/Face-Recognition-Attendance-System.

## Development

Install dependencies:

```powershell
cd frontend
npm install
```

Start dev server:

```powershell
cd frontend
# optionally copy .env.example to .env and edit VITE_API_BASE
npm run dev
```

Build for production:

```powershell
npm run build
```

Notes:
- Configure `VITE_API_BASE` in `.env` if your backend runs on a different host/port.
- The frontend uses `frontend/src/api.js` to centralize API calls and automatically attach the `Authorization` header from `localStorage` when present.
  