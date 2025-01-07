const { createMachine, createActor, assign } = require('xstate');
const readline = require('readline');

// Create a state machine for the EV Charging Station
const evChargingMachine = createMachine({
    id: 'evChargingStation',
    initial: 'Idle',
    context: {
        is_authorized: false,
        prev_state: 'Idle',
        station_state: 'Idle',
        type: '',
    },
    states: {
        Idle: {
            on: {
                a: {
                    target: 'Authorized',
                    actions: assign({
                        is_authorized: true,
                        prev_state: 'Idle',
                        station_state: 'Authorized',
                        type: 'a',
                    }),
                },
                f: {
                    target: 'AuthorizationFailed',
                    actions: assign({
                        prev_state: 'Idle',
                        station_state: 'AuthorizationFailed',
                        type: 'f',
                    }),
                },
                s: {
                    actions: () => {
                        console.log('Error: Cannot start charging without authorization.');
                    },
                },
            },
        },
        Authorized: {
            on: {
                s: {
                    target: 'Starting',
                    actions: assign({
                        prev_state: 'Authorized',
                        station_state: 'Starting',
                        type: 's',
                    }),
                },
                r: {
                    target: 'Idle',
                    actions: assign({
                        prev_state: 'Authorized',
                        station_state: 'Idle',
                        type: 'r',
                    }),
                },
            },
        },
        AuthorizationFailed: {
            on: {
                r: {
                    target: 'Idle',
                    actions: assign({
                        prev_state: 'AuthorizationFailed',
                        station_state: 'Idle',
                        type: 'r',
                    }),
                },
            },
        },
        Starting: {
            on: {
                c: {
                    target: 'Charging',
                    actions: assign({
                        prev_state: 'Starting',
                        station_state: 'Charging',
                        type: 'c',
                    }),
                },
                r: {
                    target: 'Idle',
                    actions: assign({
                        prev_state: 'Starting',
                        station_state: 'Idle',
                        type: 'r',
                    }),
                },
            },
        },
        Charging: {
            on: {
                t: {
                    target: 'Stopped',
                    actions: assign({
                        prev_state: 'Charging',
                        station_state: 'Stopped',
                        type: 't',
                    }),
                },
                r: {
                    target: 'Idle',
                    actions: assign({
                        prev_state: 'Charging',
                        station_state: 'Idle',
                        type: 'r',
                    }),
                },
            },
        },
        Stopped: {
            on: {
                r: {
                    target: 'Idle',
                    actions: assign({
                        prev_state: 'Stopped',
                        station_state: 'Idle',
                        type: 'r',
                    }),
                },
            },
        },
    },
});

// Service to interpret the state machine
const evChargingService = createActor(evChargingMachine).start();

evChargingService.subscribe((state) => {
    console.log('---------- STATION STATUS----------');
    console.log(`Entered ${state.context.station_state} state`);
    console.log(
        `Transitioned from ${state.context.prev_state} to ${state.context.station_state} on ${state.context.type}`
    );
    console.log('-----------------------------------');
});

// Utility to log the current state
function logInstructions() {
    console.log(`
  EV Charging Station State Machine:
  -----------------------------------
  Press the following keys:
  - a: Attempt authorization
  - f: Simulate failed authorization
  - s: Start charging
  - c: Begin charging
  - t: Stop charging
  - r: Reset to Idle
  - q: Quit
  `);
}

// Handle keyboard input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

console.clear();
logInstructions();

rl.on('line', (input) => {
    const validKeys = ['a', 'f', 's', 'c', 't', 'r', 'q'];
    if (!validKeys.includes(input)) {
        console.log('Invalid key pressed. Try again.');
        return;
    }

    if (input === 'q') {
        console.log('Exiting...');
        rl.close();
        process.exit(0);
    }

    evChargingService.send({ type: input });
});
