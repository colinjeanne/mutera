import { ensureValidProperties, chooseValueInPropertyRange } from './state';

export const createRandom = selector => {
    const state = ensureValidProperties({
        age: 0,
        health: 3000,
        speed: 0
    });

    const id = selector.generateUniqueId();

    return {
        age: state.age,
        dna: selector.createRandomDNA(),
        header: {
            version: '1'
        },
        health: state.health,
        id,
        velocity: {
            angle: chooseValueInPropertyRange('angle', selector),
            speed: state.speed
        },
        x: chooseValueInPropertyRange('x', selector),
        y: chooseValueInPropertyRange('y', selector)
    };
};

export const recombine = (initiator, other, selector) => {
    const location = selector.chooseLocation(initiator.x, initiator.y);

    const state = ensureValidProperties({
        age: 0,
        health: 3000,
        speed: 0,
        x: location.x,
        y: location.y
    });

    const angle = chooseValueInPropertyRange('angle', selector);
    const id = selector.generateUniqueId();

    return {
        age: state.age,
        dna: initiator.dna.recombine(other.dna),
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
