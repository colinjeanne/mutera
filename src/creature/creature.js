import * as Angle from './../types/angle';
import { DNA } from './../dna/index';
import GenericSelector from './genericSelector';
import { deserializeCreature, serializeCreature } from './serialization';
import { StateProcessor, stateToDNAInput } from './state';
import { createRandom, recombine } from './recombination';

const areClockwise = (u, v) => -u.x * v.y + u.y * v.x > 0;

const vectorLengthSquared = point => point.x * point.x + point.y * point.y;

const frustrumLength = 300;
const frustrumLengthSquared = frustrumLength * frustrumLength;
const fieldOfView = Angle.rangeMax / 4;

const calculateFrustrum = creature => {
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
        this.state = {};
        ({
            age: this.state.age,
            dna: this.dna,
            header: this.header,
            health: this.state.health,
            id: this.id,
            velocity: {
                angle: this.state.angle,
                speed: this.state.speed
            },
            x: this.state.x,
            y: this.state.y
        } = deserializeCreature(encodedCreature, this.makeDNA));

        this.frustrum = calculateFrustrum(this);
    }

    isDead() {
        return this.health === 0;
    }

    get age() {
        return this.state.age;
    }

    get angle() {
        return this.state.angle;
    }

    get health() {
        return this.state.health;
    }

    get speed() {
        return this.state.speed;
    }

    get x() {
        return this.state.x;
    }

    get y() {
        return this.state.y;
    }

    feed(amount) {
        this.state = this.stateProcessor.setStateProperty(
            this.state,
            'health',
            this.health + amount);
    }

    harm(amount) {
        this.state = this.stateProcessor.setStateProperty(
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

        return areClockwise(this.frustrum.left, relativePoint) &&
            !areClockwise(this.frustrum.right, relativePoint) &&
            (vectorLengthSquared(relativePoint) <= frustrumLengthSquared);
    }

    canReproduce() {
        return this.selector.canReproduce(this, this.stateProcessor);
    }

    toString() {
        const data = {
            age: this.state.age,
            dna: this.dna,
            header: {
                version: 1
            },
            health: this.state.health,
            id: this.id,
            velocity: {
                angle: this.state.angle,
                speed: this.state.speed
            },
            x: this.state.x,
            y: this.state.y
        };

        return serializeCreature(data, this.makeDNA);
    }

    process(input, elapsedTime) {
        const dnaInput = Object.assign(
            {},
            stateToDNAInput(this.state),
            input);

        const next = this.dna.process(dnaInput);
        this.state = this.stateProcessor.processStateChange(
            dnaInput,
            next,
            elapsedTime);
        this.frustrum = calculateFrustrum(this);
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
