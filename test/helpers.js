const world = require('./../umd/world.js');

exports.makeSequence = (...seq) => () => seq.length ? seq.shift() : 0;

exports.makeCreature = encodingData => {
    const data = Object.assign(
        {
            header: '1',
            id: '00000',
            age: '00000',
            x: '0000',
            y: '0000',
            velocity: '00',
            health: '00',
            dna: '15a1TC0'
        },
        encodingData);

    return new world.Creature(
        data.header +
        data.id +
        data.age +
        data.x +
        data.y +
        data.velocity +
        data.health +
        data.dna);
};
