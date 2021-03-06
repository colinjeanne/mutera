const { Creature } = require('./../umd/world.js').Creature;

exports.makeCreature = (encodingData, selector, makeDNA) => {
    const data = Object.assign(
        {
            header: '1',
            id: '00000',
            age: '00000',
            x: '0000',
            y: '0000',
            velocity: '00',
            health: '00',
            color: '0',
            isCarnivore: '0',
            anatomy: '00',
            dna: '16Ra1TC0'
        },
        encodingData);

    return new Creature(
        data.header +
        data.id +
        data.age +
        data.x +
        data.y +
        data.velocity +
        data.health +
        data.color +
        data.isCarnivore +
        data.anatomy +
        data.dna,
        {
            selector,
            makeDNA
        });
};
