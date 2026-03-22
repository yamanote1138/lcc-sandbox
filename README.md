# LCC Sandbox

Web UI for discovering and interacting with LCC (Layout Command Control) devices connected to a JMRI server.

## Features

- **Device Discovery** — Automatically lists all sensors and lights from JMRI
- **Real-time State** — Push button and LED states update live via WebSocket
- **Sensor Control** — Toggle sensor states from the UI
- **LED Indicators** — Read-only LED state display driven by LCC events
- **Demo Mode** — Test without hardware using mock data
- **Extensible** — Built on [jmri-client](https://github.com/yamanote1138/jmri-client) v4 with a subclass pattern for sensor/light support

## Architecture

JMRI acts as a bridge between the LCC bus and this web app:

```
LCC Bus  →  JMRI (maps events to sensors/lights)  →  WebSocket JSON API  →  LCC Sandbox
```

LCC push buttons are mapped to JMRI **sensors**, and LEDs are mapped to JMRI **lights**. The `ExtendedJmriClient` subclass in `src/jmri-ext/` adds sensor and light manager support on top of jmri-client's base functionality.

## Setup

### Prerequisites

- Node.js 20+
- JMRI with an OpenLCB/LCC connection and WebSocket server enabled
- LCC sensors and lights configured in JMRI with appropriate event IDs

### Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 and connect to your JMRI server, or enable Demo Mode to test without hardware.

## Tech Stack

- Vue 3 + TypeScript
- Vite
- @nuxt/ui + Tailwind CSS
- [jmri-client](https://www.npmjs.com/package/jmri-client) v4

## License

MIT
