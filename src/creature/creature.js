import * as Angle from './angle';
import { DNA } from './../dna/index';
import GenericSelector from './genericSelector';
import { Sector, squareDistance } from './../geometry';
import { deserializeCreature, serializeCreature } from './serialization';
import * as KnownVariables from './../knownVariables';
import { StateProcessor } from './state';
import { createRandom, recombine } from './recombination';

const deserializedCreatureToDNAInput = deserialized => ({
    booleans: {
        [KnownVariables.isAggressive]: deserialized.velocity.isAggressive,
        [KnownVariables.isRed]: deserialized.color.isRed,
        [KnownVariables.isGreen]: deserialized.color.isGreen,
        [KnownVariables.isBlue]: deserialized.color.isBlue,
        [KnownVariables.isFast]: deserialized.velocity.isFast,
        [KnownVariables.isMoving]: deserialized.velocity.isMoving
    },
    reals: {
        [KnownVariables.age]: deserialized.age,
        [KnownVariables.angle]: deserialized.velocity.angle,
        [KnownVariables.health]: deserialized.health,
        [KnownVariables.x]: deserialized.x,
        [KnownVariables.y]: deserialized.y
    }
});

const baseVisualRange = 300;
const basePeripheryFieldOfView = Math.PI / 2;

const eyeDistanceFactors = [
    0.51,
    0.75,
    1,
    1.5,
    2,
    3
];

const auditoryRange = 600;
const volumeAtTen = 25600;

const calculateSector = (angle, range, arcLength) =>
    new Sector(range, angle - arcLength / 2, angle + arcLength / 2);

const calculateVisualField = (angle, eyes) => {
    const factor = eyeDistanceFactors[eyes];
    const visualRange = baseVisualRange * factor;
    const peripheryFieldOfView = basePeripheryFieldOfView / (factor * factor);
    const focusFieldOfView = peripheryFieldOfView / 3;

    return {
        periphery: calculateSector(angle, visualRange, peripheryFieldOfView),
        focus: calculateSector(angle, visualRange, focusFieldOfView)
    };
};

const calculateAuditoryField = angle => ({
    front: calculateSector(angle, auditoryRange, Math.PI / 2),
    left: calculateSector(angle + Math.PI / 2, auditoryRange, Math.PI / 2),
    back: calculateSector(angle + Math.PI, auditoryRange, Math.PI / 2),
    right: calculateSector(angle - Math.PI / 2, auditoryRange, Math.PI / 2)
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
        this.isCarnivore = deserialized.isCarnivore;
        this.anatomy = deserialized.anatomy;

        this.radians = Angle.toRadians(
            this.state.reals[KnownVariables.angle]);
        this.visualField = calculateVisualField(this.angle, this.eyes);
        this.auditoryField = calculateAuditoryField(this.angle);
    }

    isDead() {
        return this.health === 0;
    }

    get age() {
        return this.state.reals[KnownVariables.age];
    }

    get angle() {
        return this.radians;
    }

    get body() {
        return this.anatomy.body;
    }

    get eyes() {
        return this.anatomy.eyes;
    }

    get isAggressive() {
        return this.state.booleans[KnownVariables.isAggressive];
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
        return this.state.reals[KnownVariables.health];
    }

    get isMoving() {
        return this.state.booleans[KnownVariables.isMoving];
    }

    get isFast() {
        return this.state.booleans[KnownVariables.isFast];
    }

    get legs() {
        return this.anatomy.legs;
    }

    get mouth() {
        return this.anatomy.mouth;
    }

    get shouldReproduceAsexually() {
        return this.state.booleans[KnownVariables.shouldReproduceAsexually] ||
            false;
    }

    get shouldReproduceSexually() {
        return this.state.booleans[KnownVariables.shouldReproduceSexually] ||
            false;
    }

    get speed() {
        return this.state.reals[KnownVariables.speed] || 0;
    }

    get x() {
        return this.state.reals[KnownVariables.x];
    }

    get y() {
        return this.state.reals[KnownVariables.y];
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

        if (!this.visualField.periphery.contains(relativePoint)) {
            return {
                leftPeriphery: false,
                rightPeriphery: false,
                focus: false
            };
        } else if (this.visualField.focus.contains(relativePoint)) {
            return {
                leftPeriphery: false,
                rightPeriphery: false,
                focus: true
            };
        } else if (this.visualField.focus.isClockwiseToCenter(relativePoint)) {
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

    hear(point) {
        const relativePoint = {
            x: point.x - this.x,
            y: point.y - this.y
        };

        const effect = {
            front: 0,
            left: 0,
            back: 0,
            right: 0
        };

        const d = squareDistance(this, point);
        if (d > auditoryRange * auditoryRange) {
            return effect;
        }

        const volume = volumeAtTen / d;

        if (this.auditoryField.front.contains(relativePoint)) {
            effect.front = volume;
        } else if (this.auditoryField.left.contains(relativePoint)) {
            effect.left = volume;
        } else if (this.auditoryField.back.contains(relativePoint)) {
            effect.back = volume;
        } else {
            effect.right = volume;
        }

        return effect;
    }

    toString() {
        const data = {
            age: this.age,
            anatomy: this.anatomy,
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
            isCarnivore: this.isCarnivore,
            velocity: {
                angle: this.state.reals[KnownVariables.angle],
                isAggressive: this.isAggressive,
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
            reals: Object.assign(
                {},
                this.state.reals,
                input ? input.reals : {})
        };

        const next = this.dna.process(dnaInput);
        this.state = this.stateProcessor.processStateChange(
            dnaInput,
            next,
            elapsedTime);
        this.radians = Angle.toRadians(
            this.state.reals[KnownVariables.angle]);
        this.visualField = calculateVisualField(this.angle, this.eyes);
        this.auditoryField = calculateAuditoryField(this.angle);
    }

    recombine(other, startingHealth) {
        const data = recombine(
            this,
            other,
            startingHealth,
            this.stateProcessor,
            this.selector);
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
            isCarnivore = false,
            stateProcessor = genericStateProcessor,
            selector = genericSelector,
            makeDNA = makeRealDNA
        } = {}) {
        const data = createRandom(isCarnivore, stateProcessor, selector);
        return new Creature(
            serializeCreature(data, makeDNA),
            {
                stateProcessor,
                selector,
                makeDNA
            });
    }
}
