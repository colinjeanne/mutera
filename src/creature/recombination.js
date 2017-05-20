import * as Anatomy from './anatomy';

const createRandomAnatomy = selector => ({
    body: selector.chooseIntBetween(0, Anatomy.bodyCount),
    eyes: selector.chooseIntBetween(0, Anatomy.eyeCount),
    legs: selector.chooseIntBetween(0, Anatomy.legCount),
    mouth: selector.chooseIntBetween(0, Anatomy.mouthCount)
});

export const createRandom = (isCarnivore, stateProcessor, selector) => {
    const state = stateProcessor.ensureValidProperties({
        age: 0,
        health: 3000
    });

    const id = selector.generateUniqueId();

    return {
        age: state.age,
        anatomy: createRandomAnatomy(selector),
        color: {
            isRed: false,
            isGreen: false,
            isBlue: false
        },
        dna: selector.createRandomDNA(),
        header: {
            version: '1'
        },
        health: state.health,
        id,
        isCarnivore,
        velocity: {
            angle: stateProcessor.chooseValueInPropertyRange('angle', selector),
            isAggressive: false,
            isMoving: false,
            isFast: false
        },
        x: stateProcessor.chooseValueInPropertyRange('x', selector),
        y: stateProcessor.chooseValueInPropertyRange('y', selector)
    };
};

export const recombine = (initiator, other, startingHealth, stateProcessor, selector) => {
    const state = stateProcessor.ensureValidProperties({
        age: 0,
        health: startingHealth,
        x: initiator.x,
        y: initiator.y
    });

    const angle = stateProcessor.chooseValueInPropertyRange('angle', selector);
    const id = selector.generateUniqueId();

    return {
        age: state.age,
        anatomy: selector.chooseAnatomy(initiator.anatomy, other.anatomy),
        color: {
            isRed: false,
            isGreen: false,
            isBlue: false
        },
        dna: initiator.dna.recombine(other.dna),
        header: {
            version: '1'
        },
        health: state.health,
        id,
        isCarnivore: initiator.isCarnivore,
        velocity: {
            angle,
            isAggressive: false,
            isMoving: false,
            isFast: false
        },
        x: state.x,
        y: state.y
    };
};
