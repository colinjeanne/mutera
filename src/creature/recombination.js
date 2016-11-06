import { intToBase64 } from './../base64';
import { ensureValidProperties } from './state';

const chooseBetween = (min, max, random) => (random() * (max - min)) + min;

const randomAngle = random => chooseBetween(0, 512, random);

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

export const recombine = (initiator, other, mutationRates, random) => {
    const location = randomLocation(initiator.x, initiator.y, random);

    const state = ensureValidProperties({
        angle: randomAngle(random),
        health: 3000,
        speed: 0,
        x: location.x,
        y: location.y
    });

    const id = randomId(random);

    return {
        dna: initiator.dna.recombine(other.dna, { mutationRates, random }),
        header: {
            version: '1'
        },
        health: state.health,
        id,
        velocity: {
            angle: state.angle,
            speed: state.speed
        },
        x: state.x,
        y: state.y
    };
};
