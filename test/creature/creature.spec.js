const expect = require('chai').expect;
const { Creature } = require('./../../umd/world.js').Creature;
const { DNA } = require('./../../umd/world.js').DNA;

const { makeCreature } = require('./../helpers.js');

describe('Creature', function() {
    it('must be base64 encoded', function() {
        expect(() => makeCreature({ header: '+' })).
            to.throw('Encoded creature is not a base64 string');
    });

    it('must have a header', function() {
        expect(() => new Creature('')).
            to.throw('Creature missing header');
    });

    it('must be version 1', function() {
        expect(() => makeCreature({ header: '2' })).
            to.throw('Unexpected version');
    });

    it('must have an id', function() {
        expect(() => new Creature('1')).
            to.throw('Creature missing id');
    });

    it('must have an age', function() {
        expect(() => new Creature('100000')).
            to.throw('Creature missing age');
    });

    it('must have an x coordinate', function() {
        expect(() => new Creature('10000000000')).
            to.throw('Creature missing x');
    });

    it('must have a y coordinate', function() {
        expect(() => new Creature('100000000000000')).
            to.throw('Creature missing y');
    });

    it('must have a velocity', function() {
        expect(() => new Creature('1000000000000000000')).
            to.throw('Creature missing velocity');
    });

    it('must have a health', function() {
        expect(() => new Creature('100000000000000000000')).
            to.throw('Creature missing health');
    });

    it('must have a color', function() {
        expect(() => new Creature('10000000000000000000000')).
            to.throw('Creature missing color');
    });

    it('must have a DNA', function() {
        expect(() => new Creature('100000000000000000000000')).
            to.throw('Creature missing dna');
    });

    it('must have a valid DNA', function() {
        expect(() => new Creature('1000000000000000000000001')).
            to.throw('DNA missing genes');
    });

    it('fails on partial fields', function() {
        expect(() => new Creature('10000')).
            to.throw('Creature missing id');
    });

    it('deserializes all fields', function() {
        const creature = makeCreature({
            header: '1',
            id: '12345',
            age: '000A0',
            x: '1234',
            y: '4321',
            velocity: 'AB',
            health: '21',
            color: '7',
            dna: '16Va1TC1'
        });

        expect(creature.header).to.deep.equal({ version: '1' });
        expect(creature.id).to.equal('12345');
        expect(creature.age).to.equal(640);
        expect(creature.angle).to.closeTo(1.706, 0.001);
        expect(creature.isAggressive).to.be.false;
        expect(creature.isMoving).to.be.true;
        expect(creature.isFast).to.be.false;
        expect(creature.speed).to.equal(0);
        expect(creature.x).to.equal(270532);
        expect(creature.y).to.equal(1060993);
        expect(creature.health).to.equal(129);
        expect(creature.isRed).to.equal(true);
        expect(creature.isGreen).to.equal(true);
        expect(creature.isBlue).to.equal(true);
        expect(creature.dna.toString()).to.equal('16Va1TC1');
    });

    it('can convert to a string', function() {
        const creature = makeCreature({});
        expect('' + creature).to.equal('10000000000000000000000016Va1TC0');
    });

    it('converts fields to integers before serialization', function() {
        const creature = makeCreature({
            velocity: '80',
            x: '00A0',
            y: '00A0',
            dna: '16Vs1TCa'
        });

        expect(creature.isMoving).to.be.true;
        expect(creature.isFast).to.be.false;

        creature.process({}, 0.25);
        expect(creature.x).to.equal(641.75);
        expect(creature.y).to.equal(640);

        expect(creature.toString()).
            to.equal('1000000000000A100A08000016Vs1TCa');
    });

    it('ignores changes made to relevant state variables', function() {
        const creature = makeCreature({
            health: '20',
            dna: '16VQ1TC0'
        });

        creature.process(
            {
                variables: { Q: 0.5 }
            },
            1);
        expect(creature.angle).to.equal(0);
        expect(creature.x).to.equal(0);
        expect(creature.y).to.equal(0);
        expect(creature.health).to.equal(28);
    });

    it('ignores attempts to set dependent variables directly', function() {
        const creature = makeCreature({
            health: '20',
            dna: '16Vs1TC_'
        });

        creature.process({}, 1);
        expect(creature.speed).to.equal(0);
    });

    it('ages with each process', function() {
        const creature = makeCreature({
            age: '000A0',
            dna: '16VQ1TC0'
        });

        creature.process({}, 1);
        expect(creature.age).to.equal(641);

        creature.process({}, 0.5);
        expect(creature.age).to.equal(641.5);
    });

    it('loses health over time', function() {
        const creature = makeCreature({
            health: '40',
            dna: '16VQ1TC0'
        });

        creature.process({}, 1);
        expect(creature.health).to.equal(156);

        creature.process({}, 0.5);
        expect(creature.health).to.equal(106);
    });

    it('loses health twice as fast when aggresive', function() {
        const creature = makeCreature({
            health: '40',
            dna: '15Ba1TT'
        });

        creature.process({}, 1);
        expect(creature.health).to.equal(56);
    });

    it('caps maximum health', function() {
        const creature = makeCreature({
            health: '_w',
            dna: '16VQ1TC0'
        });

        expect(creature.health).to.equal(4090);

        creature.feed(10);
        expect(creature.health).to.equal(4095);
    });

    it('caps minimum health', function() {
        const creature = makeCreature({
            health: '0A',
            dna: '16VQ1TC0'
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
            dna: '16VQ1TC0'
        });

        expect(creature.health).to.equal(32);

        creature.harm(10);
        expect(creature.health).to.equal(22);
    });

    it('can be fed', function() {
        const creature = makeCreature({
            health: '0A',
            dna: '16VQ1TC0'
        });

        expect(creature.health).to.equal(10);

        creature.feed(10);
        expect(creature.health).to.equal(20);
    });

    it('can move', function() {
        const creature = makeCreature({
            velocity: '80',
            x: '00A0',
            y: '00A0',
            dna: '16Vs1TCe'
        });

        expect(creature.isMoving).be.true;
        expect(creature.isFast).be.false;
        expect(creature.speed).to.equal(0);

        creature.process({}, 0.5);
        expect(creature.speed).to.equal(7);
        expect(creature.x).to.equal(643.5);
        expect(creature.y).to.equal(640);

        creature.process({}, 0.5);
        expect(creature.speed).to.equal(7);
        expect(creature.x).to.equal(647);
        expect(creature.y).to.equal(640);
    });

    it('can rotate', function() {
        const creature = makeCreature({
            velocity: '24',
            dna: '1CVA1TC_C_MC_M'
        });

        expect(creature.angle).to.closeTo(1.620, 0.001);

        creature.process({}, 1);
        expect(creature.angle).to.closeTo(2.405, 0.001);
    });

    it('defaults to no rotation if the variable is NaN', function() {
        const creature = makeCreature({
            velocity: '00',
            x: '00A0',
            y: '00A0',
            dna: '1FVA1TC0CWDC0CWDS'
        });

        expect(creature.angle).to.equal(0);

        creature.process({}, 1);
        expect(creature.angle).to.equal(0);
    });

    it('can rotate all the way around clockwise', function() {
        const creature = makeCreature({
            velocity: '04',
            dna: '1CVA1TC0C0MC0M'
        });

        expect(creature.angle).to.closeTo(0.049, 0.001);

        creature.process({}, 1);
        expect(creature.angle).to.closeTo(5.547, 0.001);
    });

    it('can rotate all the way around counterclockwise', function() {
        const creature = makeCreature({
            velocity: '74',
            dna: '1CVA1TC_C_MC_M'
        });

        expect(creature.angle).to.closeTo(5.547, 0.001);

        creature.process({}, 1);
        expect(creature.angle).to.closeTo(0.049, 0.001);
    });

    it('wraps x-coordinate when going beyond the maximum range', function() {
        const creature = makeCreature({
            velocity: '80',
            x: '00FY',
            dna: '16VQ1TC0'
        });

        expect(creature.speed).to.equal(0);
        expect(creature.angle).to.equal(0);
        expect(creature.x).to.equal(994);

        creature.process({}, 1);
        expect(creature.speed).to.equal(7);
        expect(creature.angle).to.equal(0);
        expect(creature.x).to.be.closeTo(1, 0.001);
    });

    it('wraps x-coordinate when going below 0', function() {
        const creature = makeCreature({
            velocity: 'C0',
            x: '0006',
            dna: '16VQ1TC0'
        });

        expect(creature.speed).to.equal(0);
        expect(creature.angle).to.closeTo(Math.PI, 0.001);
        expect(creature.x).to.equal(6);

        creature.process({}, 1);
        expect(creature.speed).to.equal(7);
        expect(creature.angle).to.closeTo(Math.PI, 0.001);
        expect(creature.x).to.be.closeTo(999, 0.001);
    });

    it('wraps y-coordinate when going beyond the maximum range', function() {
        const creature = makeCreature({
            velocity: 'A0',
            y: '00FY',
            dna: '16VQ1TC0'
        });

        expect(creature.speed).to.equal(0);
        expect(creature.angle).to.closeTo(Math.PI / 2, 0.001);
        expect(creature.y).to.equal(994);

        creature.process({}, 1);
        expect(creature.speed).to.equal(7);
        expect(creature.angle).to.closeTo(Math.PI / 2, 0.001);
        expect(creature.y).to.be.closeTo(1, 0.001);
    });

    it('wraps y-coordinate when going below 0', function() {
        const creature = makeCreature({
            velocity: 'E0',
            y: '0006',
            dna: '16VQ1TC0'
        });

        expect(creature.speed).to.equal(0);
        expect(creature.angle).to.closeTo(3 * Math.PI / 2, 0.001);
        expect(creature.y).to.equal(6);

        creature.process({}, 1);
        expect(creature.speed).to.equal(7);
        expect(creature.angle).to.closeTo(3 * Math.PI / 2, 0.001);
        expect(creature.y).to.be.closeTo(999, 0.001);
    });

    it('can generate a random creature', function() {
        const selector = {
            chooseBetween(min) {
                return min;
            },

            createRandomDNA() {
                return new DNA('16V01TV0');
            },

            generateUniqueId() {
                return '00000';
            }
        };

        const creature = Creature.createRandom({ selector });
        expect(creature.toString()).to.equal('100000000000000000000ku016V01TV0');
    });

    it('cannot see more than pi/4 radians to the left', function() {
        const creature = makeCreature({
            velocity: '70',
            x: '0000',
            y: '0020'
        });

        expect(creature.canSee({ x: 100, y: 127.99 })).to.deep.equal(
            {
                leftPeriphery: true,
                rightPeriphery: false,
                focus: false
            }
        );
        expect(creature.canSee({ x: 100, y: 128.01 })).to.deep.equal(
            {
                leftPeriphery: false,
                rightPeriphery: false,
                focus: false
            }
        );
    });

    it('cannot see more than pi/4 radians to the right', function() {
        const creature = makeCreature({
            velocity: '70',
            x: '0000',
            y: '0020'
        });

        expect(creature.canSee({ x: 0.01, y: 100 })).to.deep.equal(
            {
                leftPeriphery: false,
                rightPeriphery: true,
                focus: false
            }
        );
        expect(creature.canSee({ x: -0.01, y: 100 })).to.deep.equal(
            {
                leftPeriphery: false,
                rightPeriphery: false,
                focus: false
            }
        );
    });

    it('cannot see more than 300 units away', function() {
        const creature = makeCreature({});

        expect(creature.canSee({ x: 300, y: 0 })).to.deep.equal(
            {
                leftPeriphery: false,
                rightPeriphery: false,
                focus: true
            }
        );
        expect(creature.canSee({ x: 300.01, y: 0 })).to.deep.equal(
            {
                leftPeriphery: false,
                rightPeriphery: false,
                focus: false
            }
        );
    });

    it('can hear creatures in the front', function() {
        const creature = makeCreature({
            x: '0010',
            y: '0010'
        });

        expect(creature.hear({ x: 74, y: 64 }).front).to.be.greaterThan(0);
    });

    it('can hear creatures in the back', function() {
        const creature = makeCreature({
            x: '0010',
            y: '0010'
        });

        expect(creature.hear({ x: 54, y: 64 }).back).to.be.greaterThan(0);
    });

    it('can hear creatures to the left', function() {
        const creature = makeCreature({
            x: '0010',
            y: '0010'
        });

        expect(creature.hear({ x: 64, y: 74 }).left).to.be.greaterThan(0);
    });

    it('can hear creatures to the right', function() {
        const creature = makeCreature({
            x: '0010',
            y: '0010'
        });

        expect(creature.hear({ x: 64, y: 54 }).right).to.be.greaterThan(0);
    });

    it('cannot hear creatures more than 600 units away', function() {
        const creature = makeCreature({});

        expect(creature.hear({ x: 600, y: 0 }).front).to.be.greaterThan(0);
        expect(creature.hear({ x: 600.01, y: 0 }).front).to.equal(0);
    });

    it('keeps state variables that are not part of the standard set', function() {
        const creature = makeCreature({
            dna: '1AVA5VQC0GCm'
        });

        expect(creature.state.Q).to.be.undefined;

        creature.process(
            {
                booleans: { Z: true },
                variables: { Q: 1 }
            },
            1);

        expect(creature.state.booleans.Z).to.equal(true);
        expect(creature.state.variables.Q).to.equal(1);
    });
});
