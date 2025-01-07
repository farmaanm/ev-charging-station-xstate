# EV Charging Station State Machine

This project implements an **EV Charging Station State Machine** using [XState](https://xstate.js.org/). The state machine simulates the various states of an EV charging process, allowing users to trigger state transitions via keyboard inputs.

## Features
- Simulates the states of an EV Charging Station:
  - `Idle`: Default state when the station is not in use.
  - `Authorized`: User successfully authenticated.
  - `AuthorizationFailed`: Authentication failed.
  - `Starting`: Preparing the charging process.
  - `Charging`: Actively charging the vehicle.
  - `Stopped`: Charging process has stopped.
- Interactive terminal-based transitions:
  - Trigger transitions using keyboard inputs.
  - Real-time logging of state changes and transitions.

## Run the project
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the project:
   ```bash
   node index.js