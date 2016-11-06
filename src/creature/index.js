import { deserializeCreature, serializeCreature } from './serialization';
import {
    processStateChange,
    setStateProperty,
    stateToDNAInput } from './state';
import { recombine } from './recombination';

export default class Creature {
    constructor(encodedCreature) {
        this.state = {};
        ({
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
    }

    isDead() {
        return this.health === 0;
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

    toString() {
        const data = {
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
    }

    recombine(other, { mutationRates, random = Math.random }) {
        const data = recombine(this, other, mutationRates, random);
        return new Creature(serializeCreature(data));
    }
}
