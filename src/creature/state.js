import * as Angle from './../types/angle';
import * as KnownVariables from './../knownVariables';

const timeVaryingValue = (current, next, change, elapsedTime) =>
    current + change * elapsedTime;

const maxRotation = Angle.rangeMax / 8;

const partialStateDefinition = {
    age: {
        dependencies: [],
        transfer: (current, next, elapsedTime) => current + elapsedTime,
        variable: KnownVariables.age
    },
    angle: {
        dependencies: [
            'angularVelocity'
        ],
        rangeMax: Angle.rangeMax,
        transfer: timeVaryingValue,
        variable: KnownVariables.angle
    },
    angularVelocity: {
        default: 0,
        dependencies: [],
        min: -maxRotation,
        max: maxRotation,
        transfer: (current, next) => maxRotation * Math.tanh(next),
        variable: KnownVariables.angularVelocity
    },
    changeInHealth: {
        dependencies: []
    },
    health: {
        dependencies: [
            'changeInHealth'
        ],
        min: 0,
        max: 4095,
        transfer: timeVaryingValue,
        variable: KnownVariables.health
    },
    isMoving: {
        default: false,
        dependencies: [],
        transfer: (current, next) => next,
        variable: KnownVariables.isMoving
    },
    isFast: {
        default: false,
        dependencies: [],
        transfer: (current, next) => next,
        variable: KnownVariables.isFast
    },
    speed: {
        default: 0,
        dependencies: [
            'isMoving',
            'isFast'
        ],
        transfer: (current, next, isMoving, isFast) => {
            if (isMoving <= 0) {
                return 0;
            }

            if (isFast <= 0) {
                return 3;
            }

            return 7;
        },
        variable: KnownVariables.speed
    },
    vx: {
        dependencies: [
            'angle',
            'speed'
        ],
        transfer: (current, next, angle, speed) =>
            speed * Math.cos(Angle.toRadians(angle))
    },
    vy: {
        dependencies: [
            'angle',
            'speed'
        ],
        transfer: (current, next, angle, speed) =>
            speed * Math.sin(Angle.toRadians(angle))
    },
    x: {
        dependencies: [
            'vx'
        ],
        transfer: timeVaryingValue,
        variable: KnownVariables.x
    },
    y: {
        dependencies: [
            'vy'
        ],
        transfer: timeVaryingValue,
        variable: KnownVariables.y
    }
};

const knownProperties = Object.keys(partialStateDefinition).
    filter(property => partialStateDefinition[property].variable).
    map(property => partialStateDefinition[property].variable);

const makeStateDefinition = (changeInHealthPerTime, mapWidth, mapHeight) => {
    const stateDefinition = Object.assign(
        {},
        partialStateDefinition);
    stateDefinition.changeInHealth.transfer = () => changeInHealthPerTime;
    stateDefinition.x.rangeMax = mapWidth;
    stateDefinition.y.rangeMax = mapHeight;

    return stateDefinition;
};

const stateUpdatePlan = (() => {
    let unplannedProperties = Object.keys(partialStateDefinition);
    const plan = [];

    const areDependenciesSatisfied = dependencies =>
        dependencies.every(dependency => plan.indexOf(dependency) !== -1);

    while (unplannedProperties.length > 0) {
        const satisfiedProperties = unplannedProperties.filter(property =>
            areDependenciesSatisfied(
                partialStateDefinition[property].dependencies));

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
            const definition = partialStateDefinition[property];
            if (!definition) {
                aggregate[property] = state[property];
            } else {
                const variable = partialStateDefinition[property].variable;
                if (variable) {
                    aggregate[variable] = state[property];
                }
            }
            return aggregate;
        },
        {});

export class StateProcessor {
    constructor(changeInHealthPerTime, mapWidth, mapHeight) {
        this.stateDefinition = makeStateDefinition(
            changeInHealthPerTime,
            mapWidth,
            mapHeight);
    }

    ensureValidProperties(state) {
        return Object.keys(state).reduce(
            (aggregate, property) => {
                const definition = this.stateDefinition[property];
                aggregate[property] =
                    ensureWithinRange(state[property], definition);
                return aggregate;
            },
            {});
    }

    setStateProperty(state, property, value) {
        const definition = this.stateDefinition[property];
        return Object.assign(
            {},
            state,
            {
                [property]: ensureWithinRange(value, definition)
            });
    }

    chooseValueInPropertyRange(property, selector) {
        const definition = this.stateDefinition[property];
        if (('min' in definition) && ('max' in definition)) {
            return selector.chooseBetween(definition.min, definition.max);
        }

        if ('rangeMax' in definition) {
            return selector.chooseBetween(0, definition.rangeMax);
        }

        throw new Error('State property does not have a defined range');
    }

    getMaximumPropertyValue(property) {
        return this.stateDefinition[property].max ||
            this.stateDefinition[property].rangeMax;
    }

    processStateChange(current, next, elapsedTime) {
        const known = stateUpdatePlan.reduce(
            (state, property) => {
                const definition = this.stateDefinition[property];
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
    }
}
