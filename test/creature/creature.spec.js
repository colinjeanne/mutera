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

    it('must have a DNA', function() {
        expect(() => new Creature('10000000000000000000000')).
            to.throw('Creature missing dna');
    });

    it('must have a valid DNA', function() {
        expect(() => new Creature('100000000000000000000001')).
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
            dna: '15a1TC1'
        });

        expect(creature.header).to.deep.equal({ version: '1' });
        expect(creature.id).to.equal('12345');
        expect(creature.age).to.equal(640);
        expect(creature.angle).to.equal(139);
        expect(creature.speed).to.equal(1);
        expect(creature.x).to.equal(270532);
        expect(creature.y).to.equal(1060993);
        expect(creature.health).to.equal(129);
        expect(creature.dna.toString()).to.equal('15a1TC1');
    });

    it('can convert to a string', function() {
        const creature = makeCreature({});
        expect('' + creature).to.equal('1000000000000000000000015a1TC0');
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
            to.equal('1000000000000A000A000001BS1TC_C_MC_M');
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

    it('ages with each process', function() {
        const creature = makeCreature({
            age: '000A0',
            dna: '15Q1TC0'
        });

        creature.process({}, 1);
        expect(creature.age).to.equal(641);

        creature.process({}, 0.5);
        expect(creature.age).to.equal(641.5);
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

    it('can generate a random creature', function() {
        const selector = {
            chooseBetween(min) {
                return min;
            },

            createRandomDNA() {
                return new DNA('1501TV0');
            },

            generateUniqueId() {
                return '00000';
            }
        };

        const creature = Creature.createRandom(selector);
        expect(creature.toString()).to.equal('100000000000000000000ku1501TV0');
    });

    it('cannot see more than pi/4 radians to the left', function() {
        const creature = makeCreature({
            velocity: '70',
            x: '0000',
            y: '0020'
        });

        expect(creature.canSee({ x: 100, y: 127.99 })).to.be.true;
        expect(creature.canSee({ x: 100, y: 128.01 })).to.be.false;
    });

    it('cannot see more than pi/4 radians to the right', function() {
        const creature = makeCreature({
            velocity: '70',
            x: '0000',
            y: '0020'
        });

        expect(creature.canSee({ x: 0.01, y: 100 })).to.be.true;
        expect(creature.canSee({ x: -0.01, y: 100 })).to.be.false;
    });

    it('cannot see more than 300 units away', function() {
        const creature = makeCreature({});

        expect(creature.canSee({ x: 300, y: 0 })).to.be.true;
        expect(creature.canSee({ x: 300.01, y: 0 })).to.be.false;
    });

    it('keeps state variables that are not part of the standard set', function() {
        const creature = makeCreature({
            dna: '19S5VQC0GC_'
        });

        expect(creature.state.Q).to.be.undefined;

        creature.process({ Q: 1 }, 1);
        expect(creature.speed).to.closeTo(2, 0.1);
        expect(creature.state.Q).to.equal(1);
    });
});