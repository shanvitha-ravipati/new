# Smart Bag Monitoring System

A beginner-friendly React dashboard prototype for an ESP32 smart bag. In this version, the dashboard saves sensor readings and alerts in the browser's `localStorage`, so the demo works without MongoDB or a running backend.

> **Important:** Browser `localStorage` belongs to one browser on one device. An ESP32 cannot send data directly to it. To receive real ESP32 readings, a server/API is required. The `backend/` folder remains as an optional, separate MongoDB-backed ESP32 API; it is not used by this local-storage dashboard.

## Features

- Responsive dashboard with weight, temperature, battery, bag open/closed, and motion status
- Readings persist in browser storage across page reloads
- Demo mode generates readings every five seconds; dashboard refreshes every four seconds
- Automatically generated and deduplicated alerts for low battery, excessive weight, high temperature, motion, and opening the bag
- Resolve alerts in the dashboard
- GPS coordinates and OpenStreetMap view
- Temperature, weight, and battery history chart
- Connection is marked offline when the last saved reading is older than 15 seconds
- Keeps the latest 500 readings and 100 alerts in browser storage

## Technologies and architecture

The dashboard uses React, Vite, JavaScript, Recharts, React Leaflet, Leaflet, and lucide-react.

```text
Demo generator -> React dashboard <-> browser localStorage
                                     ├── sensor readings
                                     ├── sensor history
                                     └── alerts
```

The optional ESP32 API uses Node.js, Express, Mongoose, and MongoDB, but the dashboard does not call that API in local-storage mode.

## Folder structure

```text
smartbackpack/
├── backend/                  # Optional MongoDB API for ESP32 HTTP posts
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/localStorage.js # Browser localStorage data service
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
├── esp32/SmartBagDemo/       # Optional ESP32 example for the API
└── README.md
```

## Run the dashboard (no MongoDB or backend required)

Install Node.js 18 or newer. From the project root (`smartbackpack`), run:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`, and press **Run live demo**. Sensor readings and alerts will be saved in that browser's local storage. Stop the demo to stop generating readings.

The root `package.json` is an npm workspace for `frontend`, so these commands work directly from the project root. Alternatively, you can run them from `frontend/`. No `.env` file is required in local-storage mode. To clear the saved demo data, clear site data/local storage for the Vite site in the browser's developer tools.

## Local-storage behavior

The service stores data under the key `smartbag-dashboard-data`. It retains up to 500 readings and 100 alerts. Default alert limits are 15 kg, 45°C, and 20% battery. These defaults are in `frontend/src/services/localStorage.js`.

Because storage is local to the browser, opening the dashboard in another browser/device will show a separate dashboard history. Clearing site data also removes these saved readings and alerts.

## Optional: connect a physical ESP32

The ESP32 sends HTTP POST requests to the Express API in `backend/`. That API requires Node.js and MongoDB and stores its data in MongoDB; **its readings do not appear in this local-storage dashboard**. Connecting real hardware to this dashboard requires a bridge that transfers API readings to the browser or changing the frontend data service to call the API.

To run the optional API:

1. Start MongoDB locally or create a MongoDB Atlas database.
2. In `backend/`, run `npm install`.
3. Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI`.
4. In `backend/`, run `npm run dev`.
5. In `esp32/SmartBagDemo/SmartBagDemo.ino`, set the Wi-Fi name/password and `BACKEND_URL` to the computer's LAN IP, e.g. `http://192.168.1.20:5000/api/sensors`.
6. Install the ArduinoJson library, upload the sketch, and open Serial Monitor at 115200 baud.

Do not use `localhost` as the ESP32 backend address. The ESP32 and computer must be on the same network, and the computer firewall must permit port 5000.

## Optional backend API

- `GET /api/health` — backend and MongoDB health
- `POST /api/sensors` — store an ESP32 reading and create automatic alerts
- `POST /api/sensors/mock` — store one mock sensor reading
- `GET /api/sensors/latest?bagId=BAG001` — most recent reading
- `GET /api/sensors/history?bagId=BAG001&limit=100` — history
- `GET /api/alerts?bagId=BAG001&resolved=false` — alerts
- `POST /api/alerts` — create an alert
- `PATCH /api/alerts/:id/resolve` — resolve an alert

See the backend source for request validation and the supported sensor JSON fields.

## Troubleshooting

- **`npm install` reports a missing root `package.json`:** Confirm you are in the project root containing `package.json`, then run `npm install` there. You can also run `npm install` and `npm run dev` from `frontend/`.
- **Dashboard does not open:** Run `npm run dev` from the project root; use the URL Vite prints.
- **Storage error:** Enable site storage in the browser, or clear this site's local storage if it is full or corrupted.
- **No readings:** Press **Run live demo**. Reloading preserves previous readings, but the demo generator starts only after you click its button.
- **Offline status:** A reading older than 15 seconds is marked offline. New demo readings arrive every five seconds.
- **Map tiles do not load:** OpenStreetMap tiles need internet access. Coordinates are also shown as text.
- **ESP32/API data not on dashboard:** This version intentionally reads localStorage only. The optional MongoDB backend and browser local storage are separate data stores.
