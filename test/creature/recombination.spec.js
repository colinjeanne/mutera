const expect = require('chai').expect;
const { makeCreature } = require('./../helpers.js');

describe('Creature recombination', function() {
    it('defaults the health and speed', function() {
        const selector = {
            chooseBetween(min) {
                return min;
            },

            generateUniqueId() {
                return '00000';
            }
        };

        const first = makeCreature(
            {
                health: 'A0',
                velocity: 'AA'
            },
            selector);

        const second = makeCreature(
            {
                health: 'B0',
                velocity: 'BB'
            },
            selector);

        const child = first.recombine(second);
        expect(child.health).to.equal(3000);
        expect(child.speed).to.equal(0);
    });

    it('randomizes the starting angle', function() {
        const selector = {
            chooseBetween() {
                return 256;
            },

            generateUniqueId() {
                return '00000';
            }
        };

        const first = makeCreature(
            {
                velocity: 'AA'
            },
            selector);

        const second = makeCreature(
            {
                velocity: 'BB'
            },
            selector);

        const child = first.recombine(second);
        expect(child.angle).to.equal(Math.PI);
    });

    it('places the new creature at the parent', function() {
        const selector = {
            chooseBetween() {
                return 0;
            },

            generateUniqueId() {
                return '00000';
            }
        };

        const first = makeCreature(
            {
                x: '0030',
                y: '0030'
            },
            selector);

        const second = makeCreature(
            {
                x: '00A0',
                y: '00A0'
            },
            selector);

        const child = first.recombine(second);
        expect(child.x).to.equal(192);
        expect(child.y).to.equal(192);
    });

    it('generates a new ID', function() {
        const selector = {
            chooseBetween() {
                return 0;
            },

            generateUniqueId() {
                return '10000';
            }
        };

        const first = makeCreature(
            {
                id: '12345'
            },
            selector);

        const second = makeCreature(
            {
                id: '54321'
            },
            selector);

        const child = first.recombine(second);
        expect(child.id).to.equal('10000');
    });

    it('recombines the parent DNA', function() {
        const selector = {
            chooseBetween() {
                return 0;
            },

            generateUniqueId() {
                return '10000';
            }
        };

        class DNA {
            constructor(encoded) {
                this.encoded = encoded;
            }

            recombine() {
                return new DNA('16V01TC0');
            }

            toString() {
                return this.encoded;
            }
        }

        const makeDNA = encoded => new DNA(encoded);

        const first = makeCreature({}, selector, makeDNA);

        const second = makeCreature({}, selector, makeDNA);

        const child = first.recombine(second);
        expect(child.dna.toString()).to.equal('16V01TC0');
    });
});
