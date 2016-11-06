const expect = require('chai').expect;
const world = require('./../umd/world.js');

const makeCreature = encodingData => {
    const data = Object.assign(
        {
            header: '1',
            id: '00000',
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
        data.x +
        data.y +
        data.velocity +
        data.health +
        data.dna);
};

describe('Creature', function() {
    it('must be base64 encoded', function() {
        expect(() => makeCreature({ header: '+' })).
            to.throw('Encoded creature is not a base64 string');
    });

    it('must have a header', function() {
        expect(() => new world.Creature('')).
            to.throw('Creature missing header');
    });

    it('must be version 1', function() {
        expect(() => makeCreature({ header: '2' })).
            to.throw('Unexpected version');
    });

    it('must have an id', function() {
        expect(() => new world.Creature('1')).
            to.throw('Creature missing id');
    });

    it('must have an x coordinate', function() {
        expect(() => new world.Creature('100000')).
            to.throw('Creature missing x');
    });

    it('must have a y coordinate', function() {
        expect(() => new world.Creature('1000000000')).
            to.throw('Creature missing y');
    });

    it('must have a velocity', function() {
        expect(() => new world.Creature('10000000000000')).
            to.throw('Creature missing velocity');
    });

    it('must have a health', function() {
        expect(() => new world.Creature('1000000000000000')).
            to.throw('Creature missing health');
    });

    it('must have a DNA', function() {
        expect(() => new world.Creature('100000000000000000')).
            to.throw('Creature missing dna');
    });

    it('must have a valid DNA', function() {
        expect(() => new world.Creature('1000000000000000001')).
            to.throw('DNA missing genes');
    });

    it('fails on partial fields', function() {
        expect(() => new world.Creature('10000')).
            to.throw('Creature missing id');
    });

    it('deserializes all fields', function() {
        const creature = makeCreature({
            header: '1',
            id: '12345',
            x: '1234',
            y: '4321',
            velocity: 'AB',
            health: '21',
            dna: '15a1TC1'
        });

        expect(creature.header).to.deep.equal({ version: '1' });
        expect(creature.id).to.equal('12345');
        expect(creature.angle).to.equal(139);
        expect(creature.speed).to.equal(1);
        expect(creature.x).to.equal(270532);
        expect(creature.y).to.equal(1060993);
        expect(creature.health).to.equal(129);
        expect(creature.dna.toString()).to.equal('15a1TC1');
    });

    it('can convert to a string', function() {
        const creature = makeCreature({});
        expect('' + creature).to.equal('10000000000000000015a1TC0');
    });

    it('converts fields to integers before serialization', function() {
        const creature = makeCreature({
            velocity: '00',
            x: '00A0',
            y: '00A0',
            dna: '1BS1TC_C_MC_M'
        });

        creature.process({}, 0.25);
        expect(creature.speed).to.equal(0.5);
        expect(creature.x).to.equal(640.125);
        expect(creature.y).to.equal(640);

        expect(creature.toString()).
            to.equal('10000000A000A000001BS1TC_C_MC_M');
    });

    it('ignores changes made to relevant state variables', function() {
        const creature = makeCreature({
            health: '20',
            dna: '15Q1TC0'
        });

        creature.process({ Q: 0.5 }, 1);
        expect(creature.angle).to.equal(0);
        expect(creature.speed).to.equal(0);
        expect(creature.x).to.equal(0);
        expect(creature.y).to.equal(0);
        expect(creature.health).to.equal(28);
    });

    it('ignores attempts to set dependent variables directly', function() {
        const creature = makeCreature({
            health: '20',
            dna: '15s1TC_'
        });

        creature.process({}, 1);
        expect(creature.speed).to.equal(0);
    });

    it('loses health over time', function() {
        const creature = makeCreature({
            health: '40',
            dna: '15Q1TC0'
        });

        creature.process({}, 1);
        expect(creature.health).to.equal(156);

        creature.process({}, 0.5);
        expect(creature.health).to.equal(106);
    });

    it('caps maximum health', function() {
        const creature = makeCreature({
            health: '_w',
            dna: '15Q1TC0'
        });

        expect(creature.health).to.equal(4090);

        creature.feed(10);
        expect(creature.health).to.equal(4095);
    });

    it('caps minimum health', function() {
        const creature = makeCreature({
            health: '0A',
            dna: '15Q1TC0'
        });

        creature.process({}, 1);
        expect(creature.health).to.equal(0);
    });

    it('knows if it is dead', function() {
        const creature = makeCreature({
            health: '0A'
        });

        expect(creature.isDead()).to.equal(false);

        creature.process({}, 1);
        expect(creature.isDead()).to.equal(true);
    });

    it('can be harmed', function() {
        const creature = makeCreature({
            health: '0W',
            dna: '15Q1TC0'
        });

        expect(creature.health).to.equal(32);

        creature.harm(10);
        expect(creature.health).to.equal(22);
    });

    it('can be fed', function() {
        const creature = makeCreature({
            health: '0A',
            dna: '15Q1TC0'
        });

        expect(creature.health).to.equal(10);

        creature.feed(10);
        expect(creature.health).to.equal(20);
    });

    it('can accelerate', function() {
        const creature = makeCreature({
            velocity: '00',
            x: '00A0',
            y: '00A0',
            dna: '1BS1TC_C_MC_M'
        });

        expect(creature.speed).to.equal(0);

        creature.process({}, 0.5);
        expect(creature.speed).to.equal(1);
        expect(creature.x).to.equal(640.5);
        expect(creature.y).to.equal(640);

        creature.process({}, 0.5);
        expect(creature.speed).to.equal(2);
        expect(creature.x).to.equal(641.5);
        expect(creature.y).to.equal(640);
    });

    it('defaults to no acceleration if the variable is NaN', function() {
        const creature = makeCreature({
            velocity: 'G0',
            x: '00A0',
            y: '00A0',
            dna: '1ES1TC0CWDC0CWDS'
        });

        expect(creature.speed).to.equal(2);

        creature.process({}, 1);
        expect(creature.speed).to.equal(2);
    });

    it('caps maximum speed', function() {
        const creature = makeCreature({
            velocity: 'W0',
            dna: '1BS1TC_C_MC_M'
        });

        expect(creature.speed).to.equal(4);

        creature.process({}, 1);
        expect(creature.speed).to.equal(6);

        creature.process({}, 1);
        expect(creature.speed).to.equal(7);
    });

    it('caps minimum speed', function() {
        const creature = makeCreature({
            velocity: 'O0',
            dna: '1BS1TC0C0MC0M'
        });

        expect(creature.speed).to.equal(3);

        creature.process({}, 1);
        expect(creature.speed).to.equal(1);

        creature.process({}, 1);
        expect(creature.speed).to.equal(0);
    });

    it('can rotate', function() {
        const creature = makeCreature({
            velocity: '24',
            dna: '1BA1TC_C_MC_M'
        });

        expect(creature.angle).to.equal(132);

        creature.process({}, 1);
        expect(creature.angle).to.equal(196);
    });

    it('defaults to no rotation if the variable is NaN', function() {
        const creature = makeCreature({
            velocity: '00',
            x: '00A0',
            y: '00A0',
            dna: '1EA1TC0CWDC0CWDS'
        });

        expect(creature.angle).to.equal(0);

        creature.process({}, 1);
        expect(creature.angle).to.equal(0);
    });

    it('can rotate all the way around clockwise', function() {
        const creature = makeCreature({
            velocity: '04',
            dna: '1BA1TC0C0MC0M'
        });

        expect(creature.angle).to.equal(4);

        creature.process({}, 1);
        expect(creature.angle).to.equal(452);
    });

    it('can rotate all the way around counterclockwise', function() {
        const creature = makeCreature({
            velocity: '74',
            dna: '1BA1TC_C_MC_M'
        });

        expect(creature.angle).to.equal(452);

        creature.process({}, 1);
        expect(creature.angle).to.equal(4);
    });

    it('caps maximum x-coordinate', function() {
        const creature = makeCreature({
            velocity: 'W0',
            x: '00Fb',
            dna: '15Q1TC0'
        });

        expect(creature.speed).to.equal(4);
        expect(creature.angle).to.equal(0);
        expect(creature.x).to.equal(997);

        creature.process({}, 1);
        expect(creature.speed).to.equal(4);
        expect(creature.angle).to.equal(0);
        expect(creature.x).to.equal(1000);
    });

    it('caps minimum x-coordinate', function() {
        const creature = makeCreature({
            velocity: 'a0',
            x: '0003',
            dna: '15Q1TC0'
        });

        expect(creature.speed).to.equal(4);
        expect(creature.angle).to.equal(256);
        expect(creature.x).to.equal(3);

        creature.process({}, 1);
        expect(creature.speed).to.equal(4);
        expect(creature.angle).to.equal(256);
        expect(creature.x).to.equal(0);
    });

    it('caps maximum y-coordinate', function() {
        const creature = makeCreature({
            velocity: 'Y0',
            y: '00Fb',
            dna: '15Q1TC0'
        });

        expect(creature.speed).to.equal(4);
        expect(creature.angle).to.equal(128);
        expect(creature.y).to.equal(997);

        creature.process({}, 1);
        expect(creature.speed).to.equal(4);
        expect(creature.angle).to.equal(128);
        expect(creature.y).to.equal(1000);
    });

    it('caps minimum y-coordinate', function() {
        const creature = makeCreature({
            velocity: 'c0',
            y: '0003',
            dna: '15Q1TC0'
        });

        expect(creature.speed).to.equal(4);
        expect(creature.angle).to.equal(384);
        expect(creature.y).to.equal(3);

        creature.process({}, 1);
        expect(creature.speed).to.equal(4);
        expect(creature.angle).to.equal(384);
        expect(creature.y).to.equal(0);
    });

    describe('recombination', function() {
        const makeSequence = (...seq) => () => seq.length ? seq.shift() : 0;

        it('defaults the health and speed', function() {
            const random = makeSequence();

            const first = makeCreature({
                health: 'A0',
                velocity: 'AA'
            });

            const second = makeCreature({
                health: 'B0',
                velocity: 'BB'
            });

            const child = first.recombine(second, { random });
            expect(child.health).to.equal(3000);
            expect(child.speed).to.equal(0);
        });

        it('randomizes the starting angle', function() {
            const random = makeSequence(0, 0, 0.5);

            const first = makeCreature({
                velocity: 'AA'
            });

            const second = makeCreature({
                velocity: 'BB'
            });

            const child = first.recombine(second, { random });
            expect(child.angle).to.equal(256);
        });

        it('places the new creature close to the parent', function() {
            const random = makeSequence();

            const first = makeCreature({
                x: '0030',
                y: '0030'
            });

            const second = makeCreature({
                x: '00A0',
                y: '00A0'
            });

            const child = first.recombine(second, { random });
            expect(child.x).to.equal(182);
            expect(child.y).to.equal(192);
        });

        it('generates a new ID', function() {
            const random = makeSequence(0, 0, 0, 0.015625);

            const first = makeCreature({
                id: '12345'
            });

            const second = makeCreature({
                id: '54321'
            });

            const child = first.recombine(second, { random });
            expect(child.id).to.equal('10000');
        });

        it('recombines the parent DNA', function() {
            const random = makeSequence(0, 0, 0, 0, 0, 0.3);

            const first = makeCreature({});

            const second = makeCreature({});

            const child = first.recombine(second, { random });
            expect(child.dna.toString()).to.equal('1501TC0');
        });
    });
});
