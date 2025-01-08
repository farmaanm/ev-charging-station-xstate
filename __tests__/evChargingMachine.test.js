const { createMachine, createActor, assign } = require('xstate');

// Import the EV Charging Station state machine
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
                        console.log('[ERROR] Cannot start charging without authorization.');
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
                a: {
                    target: 'Authorized',
                    actions: assign({
                        is_authorized: true,
                        prev_state: 'AuthorizationFailed',
                        station_state: 'Authorized',
                        type: 'a',
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

// Unit Tests
describe('EV Charging State Machine', () => {
    let service;

    beforeEach(() => {
        service = createActor(evChargingMachine).start();
    });

    test('Initial state should be Idle', () => {
        expect(service.getSnapshot().value).toBe('Idle');
    });

    test('Transition from Idle to Authorized', () => {
        service.send({ type: 'a' });
        const state = service.getSnapshot();
        expect(state.value).toBe('Authorized');
        expect(state.context.station_state).toBe('Authorized');
    });

    test('Transition from Idle to AuthorizationFailed', () => {
        service.send({ type: 'f' });
        const state = service.getSnapshot();
        expect(state.value).toBe('AuthorizationFailed');
        expect(state.context.station_state).toBe('AuthorizationFailed');
    });

    test('Cannot start charging from Idle without authorization', () => {
        const consoleSpy = jest.spyOn(console, 'log');
        service.send({ type: 's' });
        expect(consoleSpy).toHaveBeenCalledWith('[ERROR] Cannot start charging without authorization.');
        consoleSpy.mockRestore();
    });

    test('Transition from Authorized to Starting', () => {
        service.send({ type: 'a' }); // Move to Authorized
        service.send({ type: 's' }); // Start charging
        const state = service.getSnapshot();
        expect(state.value).toBe('Starting');
        expect(state.context.station_state).toBe('Starting');
    });

    test('Transition from Starting to Charging', () => {
        service.send({ type: 'a' }); // Move to Authorized
        service.send({ type: 's' }); // Start charging
        service.send({ type: 'c' }); // Begin charging
        const state = service.getSnapshot();
        expect(state.value).toBe('Charging');
        expect(state.context.station_state).toBe('Charging');
    });

    test('Reset to Idle from any state', () => {
        service.send({ type: 'a' }); // Move to Authorized
        service.send({ type: 's' }); // Start charging
        service.send({ type: 'r' }); // Reset
        const state = service.getSnapshot();
        expect(state.value).toBe('Idle');
        expect(state.context.station_state).toBe('Idle');
    });

    test('Stop charging and move to Stopped', () => {
        service.send({ type: 'a' }); // Move to Authorized
        service.send({ type: 's' }); // Start charging
        service.send({ type: 'c' }); // Begin charging
        service.send({ type: 't' }); // Stop charging
        const state = service.getSnapshot();
        expect(state.value).toBe('Stopped');
        expect(state.context.station_state).toBe('Stopped');
    });
});
