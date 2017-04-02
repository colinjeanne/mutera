export const createRandom = (stateProcessor, selector) => {
    const state = stateProcessor.ensureValidProperties({
        age: 0,
        health: 3000
    });

    const id = selector.generateUniqueId();

    return {
        age: state.age,
        color: stateProcessor.chooseValueInPropertyRange('color', selector),
        dna: selector.createRandomDNA(),
        header: {
            version: '1'
        },
        health: state.health,
        id,
        velocity: {
            angle: stateProcessor.chooseValueInPropertyRange('angle', selector),
            isMoving: false,
            isFast: false
        },
        x: stateProcessor.chooseValueInPropertyRange('x', selector),
        y: stateProcessor.chooseValueInPropertyRange('y', selector)
    };
};

export const recombine = (initiator, other, stateProcessor, selector) => {
    const location = selector.chooseLocation(initiator.x, initiator.y);

    const state = stateProcessor.ensureValidProperties({
        age: 0,
        health: 3000,
        x: location.x,
        y: location.y
    });

    const angle = stateProcessor.chooseValueInPropertyRange('angle', selector);
    const color = stateProcessor.chooseValueInPropertyRange('color', selector);
    const id = selector.generateUniqueId();

    return {
        age: state.age,
        color,
        dna: initiator.dna.recombine(other.dna),
        header: {
            version: '1'
        },
        health: state.health,
        id,
        velocity: {
            angle,
            isMoving: false,
            isFast: false
        },
        x: state.x,
        y: state.y
    };
};
