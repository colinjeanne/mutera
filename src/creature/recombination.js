import { chooseBetween } from './../random';
import DNA from './../dna/index';
import { ensureValidProperties, randomValueInPropertyRange } from './state';
import { intToBase64 } from './../base64';

const randomId = random =>
    intToBase64(Math.floor(chooseBetween(0, Math.pow(64, 5), random)), 5);

const randomLocation = (x, y, random) => {
    const distance = chooseBetween(10, 20, random);
    const angle = chooseBetween(-Math.PI, Math.PI, random);
    return {
        x: distance * Math.cos(angle) + x,
        y: distance * Math.sin(angle) + y
    };
};

export const createRandom = (mutationRates, random) => {
    const state = ensureValidProperties({
        health: 3000,
        speed: 0
    });

    const id = randomId(random);

    return {
        dna: DNA.createRandom({ mutationRates, random }),
        header: {
            version: '1'
        },
        health: state.health,
        id,
        velocity: {
            angle: randomValueInPropertyRange('angle', random),
            speed: state.speed
        },
        x: randomValueInPropertyRange('x', random),
        y: randomValueInPropertyRange('y', random)
    };
};

export const recombine = (initiator, other, mutationRates, random) => {
    const location = randomLocation(initiator.x, initiator.y, random);

    const state = ensureValidProperties({
        health: 3000,
        speed: 0,
        x: location.x,
        y: location.y
    });

    const angle = randomValueInPropertyRange('angle', random);
    const id = randomId(random);

    return {
        dna: initiator.dna.recombine(other.dna, { mutationRates, random }),
        header: {
            version: '1'
        },
        health: state.health,
        id,
        velocity: {
            angle,
            speed: state.speed
        },
        x: state.x,
        y: state.y
    };
};
