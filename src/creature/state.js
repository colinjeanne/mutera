const timeVaryingValue = (current, next, change, elapsedTime) =>
    current + change * elapsedTime;

const stateDefinition = {
    acceleration: {
        default: 0,
        dependencies: [],
        transfer: (current, next) => 2 * Math.tanh(next),
        variable: 'S'
    },
    age: {
        dependencies: [],
        transfer: (current, next, elapsedTime) => current + elapsedTime,
        variable: 'g'
    },
    angle: {
        dependencies: [
            'angularVelocity'
        ],
        rangeMax: 512,
        transfer: timeVaryingValue,
        variable: 'a'
    },
    angularVelocity: {
        default: 0,
        dependencies: [],
        transfer: (current, next) => 64 * Math.tanh(next),
        variable: 'A'
    },
    changeInHealth: {
        dependencies: [],
        transfer: () => -100
    },
    health: {
        dependencies: [
            'changeInHealth'
        ],
        min: 0,
        max: 4095,
        transfer: timeVaryingValue,
        variable: 'h'
    },
    speed: {
        dependencies: [
            'acceleration'
        ],
        min: 0,
        max: 7,
        transfer: timeVaryingValue,
        variable: 's'
    },
    vx: {
        dependencies: [
            'angle',
            'speed'
        ],
        transfer: (current, next, angle, speed) =>
            speed * Math.cos(2 * Math.PI * angle / 511)
    },
    vy: {
        dependencies: [
            'angle',
            'speed'
        ],
        transfer: (current, next, angle, speed) =>
            speed * Math.sin(2 * Math.PI * angle / 511)
    },
    x: {
        dependencies: [
            'vx'
        ],
        rangeMax: 1000,
        transfer: timeVaryingValue,
        variable: 'x'
    },
    y: {
        dependencies: [
            'vy'
        ],
        rangeMax: 1000,
        transfer: timeVaryingValue,
        variable: 'y'
    }
};

const stateUpdatePlan = (() => {
    let unplannedProperties = Object.keys(stateDefinition);
    const plan = [];

    const areDependenciesSatisfied = dependencies =>
        dependencies.every(dependency => plan.indexOf(dependency) !== -1);

    while (unplannedProperties.length > 0) {
        const satisfiedProperties = unplannedProperties.filter(property =>
            areDependenciesSatisfied(stateDefinition[property].dependencies));

        if (satisfiedProperties.length === 0) {
            throw new Error('Invalid state definition: circular dependency?');
        }

        plan.push(...satisfiedProperties);

        unplannedProperties = unplannedProperties.filter(property =>
            satisfiedProperties.indexOf(property) === -1);
    }

    return plan;
})();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const ensureWithinRange = (value, definition) => {
    if (('min' in definition) && ('max' in definition)) {
        value = clamp(value, definition.min, definition.max);
    }

    if ('rangeMax' in definition) {
        if (value < 0) {
            return value + definition.rangeMax;
        }

        return value % definition.rangeMax;
    }

    return value;
};

const applyStateChange = (state, current, next, definition, elapsedTime) => {
    if ('default' in definition) {
        if (Number.isNaN(current) || (current === undefined)) {
            current = definition.default;
        }

        if (Number.isNaN(next) || (next === undefined)) {
            next = definition.default;
        }
    }

    const args = [
        current,
        next,
        ...definition.dependencies.map(dependency => state[dependency]),
        elapsedTime
    ];

    const value = definition.transfer(...args);
    return ensureWithinRange(value, definition);
};

export const stateToDNAInput = state => Object.keys(state).
    reduce(
        (aggregate, property) => {
            const definition = stateDefinition[property];
            if (!definition) {
                aggregate[property] = state[property];
            } else {
                const variable = stateDefinition[property].variable;
                aggregate[variable] = state[property];
            }
            return aggregate;
        },
        {});

export const ensureValidProperties = state =>
    Object.keys(state).reduce(
        (aggregate, property) => {
            const definition = stateDefinition[property];
            aggregate[property] =
                ensureWithinRange(state[property], definition);
            return aggregate;
        },
        {});

export const setStateProperty = (state, property, value) => {
    const definition = stateDefinition[property];
    return Object.assign(
        {},
        state,
        {
            [property]: ensureWithinRange(value, definition)
        });
};

export const chooseValueInPropertyRange = (property, selector) => {
    const definition = stateDefinition[property];
    if (('min' in definition) && ('max' in definition)) {
        return selector.chooseBetween(definition.min, definition.max);
    }

    if ('rangeMax' in definition) {
        return selector.chooseBetween(0, definition.rangeMax);
    }

    throw new Error('State property does not have a defined range');
};

const knownProperties = Object.keys(stateDefinition).
    filter(property => stateDefinition[property].variable).
    map(property => stateDefinition[property].variable);

export const processStateChange = (current, next, elapsedTime) => {
    const known = stateUpdatePlan.reduce(
        (state, property) => {
            const definition = stateDefinition[property];
            state[property] = applyStateChange(
                state,
                current[definition.variable],
                next[definition.variable],
                definition,
                elapsedTime);
            return state;
        },
        {});

    const unknownProperties = Object.keys(next).reduce(
        (aggregate, property) => {
            if (knownProperties.indexOf(property) === -1) {
                aggregate[property] = next[property];
            }

            return aggregate;
        },
        {});

    return Object.assign(unknownProperties, known);
};
