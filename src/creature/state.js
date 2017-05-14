import * as Angle from './angle';
import * as KnownVariables from './../knownVariables';
import { mod } from './../utilities';

const timeVaryingValue = (current, next, change, elapsedTime) =>
    current + change * elapsedTime;

const maxRotation = Angle.rangeMax / 8;

const partialStateDefinition = {
    age: {
        dependencies: [],
        isBoolean: false,
        transfer: (current, next, elapsedTime) => current + elapsedTime,
        variable: KnownVariables.age
    },
    angle: {
        dependencies: [
            'angularVelocity'
        ],
        isBoolean: false,
        rangeMax: Angle.rangeMax,
        transfer: timeVaryingValue,
        variable: KnownVariables.angle
    },
    angularVelocity: {
        default: 0,
        dependencies: [],
        isBoolean: false,
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
            'changeInHealth',
            'isAggressive',
            'isMoving',
            'isFast'
        ],
        isBoolean: false,
        min: 0,
        max: 4095,
        transfer: (current, next, baseChangeRate, isAggressive, isMoving, isFast, elapsedTime) => {
            let changeRate = baseChangeRate;
            if (isAggressive) {
                changeRate *= 2;
            }

            if (isFast && isMoving) {
                changeRate *= 2;
            }

            return current + changeRate * elapsedTime;
        },
        variable: KnownVariables.health
    },
    isAggressive: {
        default: false,
        dependencies: [],
        isBoolean: true,
        transfer: (current, next) => next,
        variable: KnownVariables.isAggressive
    },
    isMoving: {
        default: false,
        dependencies: [],
        isBoolean: true,
        transfer: (current, next) => next,
        variable: KnownVariables.isMoving
    },
    isFast: {
        default: false,
        dependencies: [],
        isBoolean: true,
        transfer: (current, next) => next,
        variable: KnownVariables.isFast
    },
    speed: {
        default: 0,
        dependencies: [
            'isMoving',
            'isFast'
        ],
        isBoolean: false,
        transfer: (current, next, isMoving, isFast) => {
            if (!isMoving) {
                return 0;
            }

            if (!isFast) {
                return 7;
            }

            return 16;
        },
        variable: KnownVariables.speed
    },
    x: {
        dependencies: [
            'angle',
            'speed'
        ],
        isBoolean: false,
        transfer: (current, next, angle, speed, elapsedTime) =>
            current + speed * Math.cos(Angle.toRadians(angle)) * elapsedTime,
        variable: KnownVariables.x
    },
    y: {
        dependencies: [
            'angle',
            'speed'
        ],
        isBoolean: false,
        transfer: (current, next, angle, speed, elapsedTime) =>
            current + speed * Math.sin(Angle.toRadians(angle)) * elapsedTime,
        variable: KnownVariables.y
    }
};

const knownBooleans = Object.keys(partialStateDefinition).
    filter(property =>
        partialStateDefinition[property].isBoolean &&
        partialStateDefinition[property].variable).
    map(property => partialStateDefinition[property].variable);

const knownReals = Object.keys(partialStateDefinition).
    filter(property =>
        !partialStateDefinition[property].isBoolean &&
        partialStateDefinition[property].variable).
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
        return mod(value, definition.rangeMax);
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
        ...definition.dependencies.map(dependency => {
            const definition = partialStateDefinition[dependency];
            if (definition.variable) {
                const type = typeFromDefinition(definition);
                return state[type][definition.variable];
            }

            return state[dependency];
        }),
        elapsedTime
    ];

    const value = definition.transfer(...args);
    return ensureWithinRange(value, definition);
};

const typeFromDefinition = definition =>
    definition.isBoolean ? 'booleans' : 'reals';

export class StateProcessor {
    constructor(changeInHealthPerTime, mapWidth, mapHeight) {
        this.stateDefinition = makeStateDefinition(
            changeInHealthPerTime,
            mapWidth,
            mapHeight);
    }

    ensureValidProperties(properties) {
        return Object.keys(properties).reduce(
            (aggregate, property) => {
                const definition = this.stateDefinition[property];
                aggregate[property] =
                    ensureWithinRange(properties[property], definition);
                return aggregate;
            },
            {});
    }

    setStateProperty(state, property, value) {
        const definition = this.stateDefinition[property];
        const type = typeFromDefinition(definition);
        state[type][definition.variable] = ensureWithinRange(value, definition);
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
        const unknownBooleans = Object.keys(next.booleans).reduce(
            (aggregate, variable) => {
                if (knownBooleans.indexOf(variable) === -1) {
                    aggregate[variable] = next.booleans[variable];
                }

                return aggregate;
            },
            {});

        const unknownReals = Object.keys(next.reals).reduce(
            (aggregate, variable) => {
                if (knownReals.indexOf(variable) === -1) {
                    aggregate[variable] = next.reals[variable];
                }

                return aggregate;
            },
            {});

        return stateUpdatePlan.reduce(
            (state, property) => {
                const definition = this.stateDefinition[property];
                if (definition.variable) {
                    const type = typeFromDefinition(definition);
                    state[type][definition.variable] = applyStateChange(
                        state,
                        current[type][definition.variable],
                        next[type][definition.variable],
                        definition,
                        elapsedTime);
                } else {
                    state[property] = applyStateChange(
                        state,
                        0,
                        0,
                        definition,
                        elapsedTime);
                }
                return state;
            },
            {
                booleans: unknownBooleans,
                reals: unknownReals
            });
    }
}
