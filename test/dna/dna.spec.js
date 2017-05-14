const expect = require('chai').expect;
const DNA = require('./../../umd/world.js').DNA;
const MockSelector = require('./mockSelector.js').default;

describe('DNA', function() {
    it('must be base64 encoded', function() {
        expect(() => new DNA.DNA('1+')).
            to.throw('Encoded DNA is not a base64 string');
    });

    it('must have a header', function() {
        expect(() => new DNA.DNA('')).to.throw('DNA missing header');
    });

    it('must be version 1', function() {
        expect(() => new DNA.DNA('2XCA')).to.throw('Unexpected version');
    });

    it('must have at least one gene', function() {
        expect(() => new DNA.DNA('1')).to.throw('DNA missing genes');
    });

    it('can process constants', function() {
        const dna = new DNA.DNA('16Ra1TCV');
        const output = dna.process({});
        expect(output).to.deep.equal({
            booleans: {},
            reals: { a: -0.125 }
        });
    });

    it('can process reals', function() {
        const dna = new DNA.DNA('16Ra1TRb');
        const output = dna.process({
            reals: { b: 1 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            reals: { a: 1, b: 1 }
        });
    });

    it('default real values to 0', function() {
        const dna = new DNA.DNA('16Ra1TRb');
        const output = dna.process({});
        expect(output).to.deep.equal({
            booleans: {},
            reals: { a: 0 }
        });
    });

    it('does not return unset reals', function() {
        const dna = new DNA.DNA('1ARa5C0CzGC0');
        const output = dna.process();
        expect(output).to.deep.equal({
            booleans: {},
            reals: {}
        });
    });

    it('can process booleans', function() {
        const dna = new DNA.DNA('16Ba1TBb');
        const output = dna.process({
            booleans: { b: true }
        });
        expect(output).to.deep.equal({
            booleans: { a: true, b: true },
            reals: {}
        });
    });

    it('default boolean values to false', function() {
        const dna = new DNA.DNA('16Ba1TBb');
        const output = dna.process({});
        expect(output).to.deep.equal({
            booleans: { a: false },
            reals: {}
        });
    });

    it('does not return unset booleans', function() {
        const dna = new DNA.DNA('1ABa5C0CzGB0');
        const output = dna.process();
        expect(output).to.deep.equal({
            booleans: {},
            reals: {}
        });
    });

    it('overwrite outputs', function() {
        const dna = new DNA.DNA('16Ra1TC06Ra1TCX');
        const output = dna.process();
        expect(output).to.deep.equal({
            booleans: {},
            reals: { a: 0.125 }
        });
    });

    it('return multiple outputs', function() {
        const dna = new DNA.DNA('16Ra1TC06Rb1TCY');
        const output = dna.process();
        expect(output).to.deep.equal({
            booleans: {},
            reals: { a: -4, b: 0.25 }
        });
    });

    it('can add', function() {
        const dna = new DNA.DNA('19Ra1TRbRcP');
        const output = dna.process({
            reals: { b: 0.125, c: 0.25 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            reals: { a: 0.375, b: 0.125, c: 0.25 }
        });
    });

    it('can subtract', function() {
        const dna = new DNA.DNA('19Ra1TRbRcS');
        const output = dna.process({
            reals: { b: 0.125, c: 0.25 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            reals: { a: -0.125, b: 0.125, c: 0.25 }
        });
    });

    it('can multiply', function() {
        const dna = new DNA.DNA('19Ra1TRbRcM');
        const output = dna.process({
            reals: { b: 0.125, c: 0.25 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            reals: { a: 0.03125, b: 0.125, c: 0.25 }
        });
    });

    it('can divide', function() {
        const dna = new DNA.DNA('19Ra1TRbRcD');
        const output = dna.process({
            reals: { b: 0.125, c: 0.25 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            reals: { a: 0.5, b: 0.125, c: 0.25 }
        });
    });

    it('can measure greater than', function() {
        const dna = new DNA.DNA('1ARa5RbRcGC0');
        const output = dna.process({
            reals: { b: 0.5, c: 0.25 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            reals: { a: -4, b: 0.5, c: 0.25 }
        });
    });

    it('can measure less than', function() {
        const dna = new DNA.DNA('1ARa5RbRcLC0');
        const output = dna.process({
            reals: { b: 0.125, c: 0.25 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            reals: { a: -4, b: 0.125, c: 0.25 }
        });
    });

    it('can combine conditions with and', function() {
        const dna = new DNA.DNA('1GRaBRbRcGRcRbLAC0');
        const output = dna.process({
            reals: { b: 0.5, c: 0.25 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            reals: { a: -4, b: 0.5, c: 0.25 }
        });
    });

    it('can combine conditions with or', function() {
        let dna = new DNA.DNA('1GRaBRbRcGRcRbGOC0');
        let output = dna.process({
            reals: { b: 0.5, c: 0.25 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            reals: { a: -4, b: 0.5, c: 0.25 }
        });

        dna = new DNA.DNA('1GRaBRbRcGRcRbGOC0');
        output = dna.process({
            reals: { b: 0.25, c: 0.5 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            reals: { a: -4, b: 0.25, c: 0.5 }
        });
    });

    it('can negate conditions with not', function() {
        const dna = new DNA.DNA('1BRa6RbRcGNC0');
        const output = dna.process({
            reals: { b: 0.25, c: 0.5 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            reals: { a: -4, b: 0.25, c: 0.5 }
        });
    });

    it('can explicitly set conditions to true', function() {
        const dna = new DNA.DNA('16Ra1TC0');
        const output = dna.process({});
        expect(output).to.deep.equal({
            booleans: {},
            reals: { a: -4 }
        });
    });

    it('can convert to a string', function() {
        const dna = new DNA.DNA('16Ra1TCV');
        expect('' + dna).to.equal('16Ra1TCV');
    });

    it('can generate a random DNA', function() {
        const dna = DNA.DNA.createRandom(new MockSelector());
        expect(dna.toString()).to.equal('16R01TR0');
    });
});
