import { deserializeCreature, serializeCreature } from './serialization';
import {
    processStateChange,
    setStateProperty,
    stateToDNAInput } from './state';
import { createRandom, recombine } from './recombination';

const angleToRadians = angle => (2 * Math.PI * angle) / 512;

const areClockwise = (u, v) => -u.x * v.y + u.y * v.x > 0;

const vectorLengthSquared = point => point.x * point.x + point.y * point.y;

const frustrumLength = 300;
const frustrumLengthSquared = frustrumLength * frustrumLength;
const fieldOfView = 128;

const calculateFrustrum = creature => {
    const radiansLeft = angleToRadians(creature.angle + fieldOfView / 2);
    const radiansRight = angleToRadians(creature.angle - fieldOfView / 2);

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

export default class Creature {
    constructor(encodedCreature) {
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
        } = deserializeCreature(encodedCreature));

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
        this.state = setStateProperty(
            this.state,
            'health',
            this.health + amount);
    }

    harm(amount) {
        this.state = setStateProperty(
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

        return serializeCreature(data);
    }

    process(input, elapsedTime) {
        const dnaInput = Object.assign(
            {},
            input,
            stateToDNAInput(this.state));

        const next = this.dna.process(dnaInput);
        this.state = processStateChange(dnaInput, next, elapsedTime);
        this.frustrum = calculateFrustrum(this);
    }

    recombine(other, { mutationRates = {}, random = Math.random }) {
        const data = recombine(this, other, mutationRates, random);
        return new Creature(serializeCreature(data));
    }

    static createRandom({ mutationRates = {}, random = Math.random }) {
        const data = createRandom(mutationRates, random);
        return new Creature(serializeCreature(data));
    }
}
