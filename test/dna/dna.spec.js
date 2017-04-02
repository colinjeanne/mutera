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
        const dna = new DNA.DNA('16Va1TCV');
        const output = dna.process({});
        expect(output).to.deep.equal({
            booleans: {},
            variables: { a: -0.125 }
        });
    });

    it('can process variables', function() {
        const dna = new DNA.DNA('16Va1TVb');
        const output = dna.process({
            variables: { b: 1 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            variables: { a: 1, b: 1 }
        });
    });

    it('default variable values to 0', function() {
        const dna = new DNA.DNA('16Va1TVb');
        const output = dna.process({});
        expect(output).to.deep.equal({
            booleans: {},
            variables: { a: 0 }
        });
    });

    it('does not return unset variables', function() {
        const dna = new DNA.DNA('1AVa5C0CzGC0');
        const output = dna.process();
        expect(output).to.deep.equal({
            booleans: {},
            variables: {}
        });
    });

    it('can process booleans', function() {
        const dna = new DNA.DNA('16Ba1TBb');
        const output = dna.process({
            booleans: { b: true }
        });
        expect(output).to.deep.equal({
            booleans: { a: true, b: true },
            variables: {}
        });
    });

    it('default boolean values to false', function() {
        const dna = new DNA.DNA('16Ba1TBb');
        const output = dna.process({});
        expect(output).to.deep.equal({
            booleans: { a: false },
            variables: {}
        });
    });

    it('does not return unset booleans', function() {
        const dna = new DNA.DNA('1ABa5C0CzGB0');
        const output = dna.process();
        expect(output).to.deep.equal({
            booleans: {},
            variables: {}
        });
    });

    it('overwrite outputs', function() {
        const dna = new DNA.DNA('16Va1TC06Va1TCX');
        const output = dna.process();
        expect(output).to.deep.equal({
            booleans: {},
            variables: { a: 0.125 }
        });
    });

    it('return multiple outputs', function() {
        const dna = new DNA.DNA('16Va1TC06Vb1TCY');
        const output = dna.process();
        expect(output).to.deep.equal({
            booleans: {},
            variables: { a: -4, b: 0.25 }
        });
    });

    it('can add', function() {
        const dna = new DNA.DNA('19Va1TVbVcP');
        const output = dna.process({
            variables: { b: 0.125, c: 0.25 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            variables: { a: 0.375, b: 0.125, c: 0.25 }
        });
    });

    it('can subtract', function() {
        const dna = new DNA.DNA('19Va1TVbVcS');
        const output = dna.process({
            variables: { b: 0.125, c: 0.25 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            variables: { a: -0.125, b: 0.125, c: 0.25 }
        });
    });

    it('can multiply', function() {
        const dna = new DNA.DNA('19Va1TVbVcM');
        const output = dna.process({
            variables: { b: 0.125, c: 0.25 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            variables: { a: 0.03125, b: 0.125, c: 0.25 }
        });
    });

    it('can divide', function() {
        const dna = new DNA.DNA('19Va1TVbVcD');
        const output = dna.process({
            variables: { b: 0.125, c: 0.25 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            variables: { a: 0.5, b: 0.125, c: 0.25 }
        });
    });

    it('can measure greater than', function() {
        const dna = new DNA.DNA('1AVa5VbVcGC0');
        const output = dna.process({
            variables: { b: 0.5, c: 0.25 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            variables: { a: -4, b: 0.5, c: 0.25 }
        });
    });

    it('can measure less than', function() {
        const dna = new DNA.DNA('1AVa5VbVcLC0');
        const output = dna.process({
            variables: { b: 0.125, c: 0.25 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            variables: { a: -4, b: 0.125, c: 0.25 }
        });
    });

    it('can combine conditions with and', function() {
        const dna = new DNA.DNA('1GVaBVbVcGVcVbLAC0');
        const output = dna.process({
            variables: { b: 0.5, c: 0.25 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            variables: { a: -4, b: 0.5, c: 0.25 }
        });
    });

    it('can combine conditions with or', function() {
        let dna = new DNA.DNA('1GVaBVbVcGVcVbGOC0');
        let output = dna.process({
            variables: { b: 0.5, c: 0.25 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            variables: { a: -4, b: 0.5, c: 0.25 }
        });

        dna = new DNA.DNA('1GVaBVbVcGVcVbGOC0');
        output = dna.process({
            variables: { b: 0.25, c: 0.5 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            variables: { a: -4, b: 0.25, c: 0.5 }
        });
    });

    it('can negate conditions with not', function() {
        const dna = new DNA.DNA('1BVa6VbVcGNC0');
        const output = dna.process({
            variables: { b: 0.25, c: 0.5 }
        });
        expect(output).to.deep.equal({
            booleans: {},
            variables: { a: -4, b: 0.25, c: 0.5 }
        });
    });

    it('can explicitly set conditions to true', function() {
        const dna = new DNA.DNA('16Va1TC0');
        const output = dna.process({});
        expect(output).to.deep.equal({
            booleans: {},
            variables: { a: -4 }
        });
    });

    it('can convert to a string', function() {
        const dna = new DNA.DNA('16Va1TCV');
        expect('' + dna).to.equal('16Va1TCV');
    });

    it('can generate a random DNA', function() {
        const dna = DNA.DNA.createRandom(new MockSelector());
        expect(dna.toString()).to.equal('16V01TV0');
    });
});
