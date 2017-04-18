import * as Angle from './angle';
import { DNA } from './../dna/index';
import GenericSelector from './genericSelector';
import { Sector } from './../geometry';
import { deserializeCreature, serializeCreature } from './serialization';
import * as KnownVariables from './../knownVariables';
import { StateProcessor } from './state';
import { createRandom, recombine } from './recombination';

const deserializedCreatureToDNAInput = deserialized => ({
    booleans: {
        [KnownVariables.isRed]: deserialized.color.isRed,
        [KnownVariables.isGreen]: deserialized.color.isGreen,
        [KnownVariables.isBlue]: deserialized.color.isBlue,
        [KnownVariables.isFast]: deserialized.velocity.isFast,
        [KnownVariables.isMoving]: deserialized.velocity.isMoving
    },
    variables: {
        [KnownVariables.age]: deserialized.age,
        [KnownVariables.angle]: deserialized.velocity.angle,
        [KnownVariables.health]: deserialized.health,
        [KnownVariables.x]: deserialized.x,
        [KnownVariables.y]: deserialized.y
    }
});

const frustrumLength = 300;
const peripheryFieldOfView = Math.PI / 2;
const focusFieldOfView = peripheryFieldOfView / 3;

const calculateFrustrum = (creature, fieldOfView) => {
    const radiansLeft = creature.angle + fieldOfView / 2;
    const radiansRight = creature.angle - fieldOfView / 2;

    return new Sector(frustrumLength, radiansRight, radiansLeft);
};

const calculateVisualField = creature => ({
    periphery: calculateFrustrum(creature, peripheryFieldOfView),
    focus: calculateFrustrum(creature, focusFieldOfView)
});

const makeRealDNA = encodedDNA => new DNA(encodedDNA);

const genericStateProcessor = new StateProcessor(-100, 1000, 1000);
const genericSelector = new GenericSelector();

export default class Creature {
    constructor(
        encodedCreature,
        {
            stateProcessor = genericStateProcessor,
            selector = genericSelector,
            makeDNA = makeRealDNA
        } = {}) {
        this.stateProcessor = stateProcessor;
        this.selector = selector;
        this.makeDNA = makeDNA;

        const deserialized = deserializeCreature(encodedCreature, this.makeDNA);
        this.state = deserializedCreatureToDNAInput(deserialized);

        this.dna = deserialized.dna;
        this.header = deserialized.header;
        this.id = deserialized.id;

        this.radians = Angle.toRadians(
            this.state.variables[KnownVariables.angle]);
        this.frustrum = calculateVisualField(this);
    }

    isDead() {
        return this.health === 0;
    }

    get age() {
        return this.state.variables[KnownVariables.age];
    }

    get angle() {
        return this.radians;
    }

    get isRed() {
        return this.state.booleans[KnownVariables.isRed];
    }

    get isGreen() {
        return this.state.booleans[KnownVariables.isGreen];
    }

    get isBlue() {
        return this.state.booleans[KnownVariables.isBlue];
    }

    get health() {
        return this.state.variables[KnownVariables.health];
    }

    get isMoving() {
        return this.state.booleans[KnownVariables.isMoving];
    }

    get isFast() {
        return this.state.booleans[KnownVariables.isFast];
    }

    get speed() {
        return this.state.variables[KnownVariables.speed] || 0;
    }

    get x() {
        return this.state.variables[KnownVariables.x];
    }

    get y() {
        return this.state.variables[KnownVariables.y];
    }

    feed(amount) {
        this.stateProcessor.setStateProperty(
            this.state,
            'health',
            this.health + amount);
    }

    harm(amount) {
        this.stateProcessor.setStateProperty(
            this.state,
            'health',
            this.health - amount);
    }

    canSee(point) {
        const relativePoint = {
            x: point.x - this.x,
            y: point.y - this.y
        };

        if (!this.frustrum.periphery.contains(relativePoint)) {
            return {
                leftPeriphery: false,
                rightPeriphery: false,
                focus: false
            };
        } else if (this.frustrum.focus.contains(relativePoint)) {
            return {
                leftPeriphery: false,
                rightPeriphery: false,
                focus: true
            };
        } else if (this.frustrum.focus.isClockwiseToCenter(relativePoint)) {
            return {
                leftPeriphery: false,
                rightPeriphery: true,
                focus: false
            };
        }

        return {
            leftPeriphery: true,
            rightPeriphery: false,
            focus: false
        };
    }

    canReproduce() {
        return this.selector.canReproduce(this, this.stateProcessor);
    }

    toString() {
        const data = {
            age: this.age,
            color: {
                isRed: this.isRed,
                isGreen: this.isGreen,
                isBlue: this.isBlue
            },
            dna: this.dna,
            header: {
                version: 1
            },
            health: this.health,
            id: this.id,
            velocity: {
                angle: this.state.variables[KnownVariables.angle],
                isMoving: this.isMoving,
                isFast: this.isFast
            },
            x: this.x,
            y: this.y
        };

        return serializeCreature(data, this.makeDNA);
    }

    process(input, elapsedTime) {
        const dnaInput = {
            booleans: Object.assign(
                {},
                this.state.booleans,
                input ? input.booleans : {}),
            variables: Object.assign(
                {},
                this.state.variables,
                input ? input.variables : {})
        };

        const next = this.dna.process(dnaInput);
        this.state = this.stateProcessor.processStateChange(
            dnaInput,
            next,
            elapsedTime);
        this.radians = Angle.toRadians(
            this.state.variables[KnownVariables.angle]);
        this.frustrum = calculateVisualField(this);
    }

    recombine(other) {
        const data = recombine(this, other, this.stateProcessor, this.selector);
        return new Creature(
            serializeCreature(data, this.makeDNA),
            {
                stateProcessor: this.stateProcessor,
                selector: this.selector,
                makeDNA: this.makeDNA
            });
    }

    static createRandom(
        {
            stateProcessor = genericStateProcessor,
            selector = genericSelector,
            makeDNA = makeRealDNA
        } = {}) {
        const data = createRandom(stateProcessor, selector);
        return new Creature(
            serializeCreature(data, makeDNA),
            {
                stateProcessor,
                selector,
                makeDNA
            });
    }
}
