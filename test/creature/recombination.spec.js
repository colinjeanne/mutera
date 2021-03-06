const expect = require('chai').expect;
const { makeCreature } = require('./../helpers.js');

const defaultAnatomy = {
    body: 0,
    eyes: 0,
    legs: 0,
    mouth: 0
};

describe('Creature recombination', function() {
    it('defaults the speed', function() {
        const selector = {
            chooseAnatomy() {
                return defaultAnatomy;
            },

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

        const child = first.recombine(second, 3000);
        expect(child.health).to.equal(3000);
        expect(child.speed).to.equal(0);
    });

    it('randomizes the starting angle', function() {
        const selector = {
            chooseAnatomy() {
                return defaultAnatomy;
            },

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

        const child = first.recombine(second, 3000);
        expect(child.angle).to.equal(Math.PI);
    });

    it('places the new creature at the parent', function() {
        const selector = {
            chooseAnatomy() {
                return defaultAnatomy;
            },

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

        const child = first.recombine(second, 3000);
        expect(child.x).to.equal(192);
        expect(child.y).to.equal(192);
    });

    it('generates a new ID', function() {
        const selector = {
            chooseAnatomy() {
                return defaultAnatomy;
            },

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

        const child = first.recombine(second, 3000);
        expect(child.id).to.equal('10000');
    });

    it('uses the type of the initiator', function() {
        const selector = {
            chooseAnatomy() {
                return defaultAnatomy;
            },

            chooseBetween() {
                return 0;
            },

            generateUniqueId() {
                return '10000';
            }
        };

        const first = makeCreature(
            {
                id: '12345',
                isCarnivore: '1'
            },
            selector);

        const second = makeCreature(
            {
                id: '54321',
                isCarnivore: '0'
            },
            selector);

        const child = first.recombine(second, 3000);
        expect(child.isCarnivore).to.be.true;
    });

    it('generates a new anatomy', function() {
        const selector = {
            chooseAnatomy() {
                return {
                    body: 1,
                    eyes: 2,
                    legs: 3,
                    mouth: 4
                };
            },

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

        const child = first.recombine(second, 3000);
        expect(child.body).to.equal(1);
        expect(child.eyes).to.equal(2);
        expect(child.legs).to.equal(3);
        expect(child.mouth).to.equal(4);
    });

    it('recombines the parent DNA', function() {
        const selector = {
            chooseAnatomy() {
                return defaultAnatomy;
            },

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
                return new DNA('16R01TC0');
            }

            toString() {
                return this.encoded;
            }
        }

        const makeDNA = encoded => new DNA(encoded);

        const first = makeCreature({}, selector, makeDNA);

        const second = makeCreature({}, selector, makeDNA);

        const child = first.recombine(second, 3000);
        expect(child.dna.toString()).to.equal('16R01TC0');
    });
});
