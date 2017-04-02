import * as Angle from './../types/angle';
import { DNA } from './../dna/index';
import GenericSelector from './genericSelector';
import { deserializeCreature, serializeCreature } from './serialization';
import * as KnownVariables from './../knownVariables';
import { StateProcessor } from './state';
import { createRandom, recombine } from './recombination';

const deserializedCreatureToDNAInput = deserialized => ({
    booleans: {
        [KnownVariables.isFast]: deserialized.velocity.isFast,
        [KnownVariables.isMoving]: deserialized.velocity.isMoving
    },
    variables: {
        [KnownVariables.age]: deserialized.age,
        [KnownVariables.angle]: deserialized.velocity.angle,
        [KnownVariables.color]: deserialized.color,
        [KnownVariables.health]: deserialized.health,
        [KnownVariables.x]: deserialized.x,
        [KnownVariables.y]: deserialized.y
    }
});

const areClockwise = (u, v) => -u.x * v.y + u.y * v.x > 0;

const vectorLengthSquared = point => point.x * point.x + point.y * point.y;

const frustrumLength = 300;
const frustrumLengthSquared = frustrumLength * frustrumLength;
const peripheryFieldOfView = Angle.rangeMax / 4;
const focusFieldOfView = peripheryFieldOfView / 3;

const calculateFrustrum = (creature, fieldOfView) => {
    const radiansLeft = Angle.toRadians(creature.angle + fieldOfView / 2);
    const radiansRight = Angle.toRadians(creature.angle - fieldOfView / 2);

    const left = {
        x: frustrumLength * Math.cos(radiansLeft),
        y: frustrumLength * Math.sin(radiansLeft)
    };

    const right = {
        x: frustrumLength * Math.cos(radiansRight),
        y: frustrumLength * Math.sin(radiansRight)
    };

    return {
        left,
        right
    };
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

        this.frustrum = calculateVisualField(this);
    }

    isDead() {
        return this.health === 0;
    }

    get age() {
        return this.state.variables[KnownVariables.age];
    }

    get angle() {
        return this.state.variables[KnownVariables.angle];
    }

    get color() {
        return this.state.variables[KnownVariables.color];
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
        // http://stackoverflow.com/questions/13652518/efficiently-find-points-inside-a-circle-sector
        const relativePoint = {
            x: point.x - this.x,
            y: point.y - this.y
        };

        if ((vectorLengthSquared(relativePoint) > frustrumLengthSquared) ||
            !areClockwise(this.frustrum.periphery.left, relativePoint) ||
            areClockwise(this.frustrum.periphery.right, relativePoint)) {
            return {
                leftPeriphery: false,
                rightPeriphery: false,
                focus: false
            };
        }

        const leftPeriphery = !areClockwise(
            this.frustrum.focus.left,
            relativePoint);
        const rightPeriphery = areClockwise(
            this.frustrum.focus.right,
            relativePoint);

        const focus = !leftPeriphery && !rightPeriphery;

        return {
            leftPeriphery,
            rightPeriphery,
            focus
        };
    }

    canReproduce() {
        return this.selector.canReproduce(this, this.stateProcessor);
    }

    toString() {
        const data = {
            age: this.age,
            color: this.color,
            dna: this.dna,
            header: {
                version: 1
            },
            health: this.health,
            id: this.id,
            velocity: {
                angle: this.angle,
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
