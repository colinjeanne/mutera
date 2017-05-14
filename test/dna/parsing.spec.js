const expect = require('chai').expect;
const DNA = require('./../../umd/world.js').DNA;

describe('Expression trees', function() {
    it('cannot have boolean operators below arithmetic operators', function() {
        // Left child
        expect(() => new DNA.DNA('1CRd1TC0C0GC0P')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('1CRd1TC0C0LC0P')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('1IRd1TC0C0LC0C0GAC0P')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('1IRd1TC0C0LC0C0GOC0P')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('1DRd1TC0C0LNC0P')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('18Rd1TTC0P')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('19Rd1TB0C0P')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');

        // Right child
        expect(() => new DNA.DNA('1CRd1TC0C0C0GP')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('1CRd1TC0C0C0LP')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('1IRd1TC0C0C0LC0C0GAP')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('1IRd1TC0C0C0LC0C0GOP')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('1DRd1TC0C0C0LNP')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('18Rd1TC0TP')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('19Rd1TC0B0P')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
    });

    it('cannot have boolean connectives operate on non-boolean trees', function() {
        // Left child
        expect(() => new DNA.DNA('1CRd1TC0C0C0GA')).
            to.throw(
                'Boolean connectives must operate on boolean trees');
        expect(() => new DNA.DNA('1CRd1TC0C0C0GO')).
            to.throw(
                'Boolean connectives must operate on boolean trees');
        expect(() => new DNA.DNA('17Rd1TC0N')).
            to.throw(
                'Boolean connectives must operate on boolean trees');

        // Right child
        expect(() => new DNA.DNA('1CRd1TC0C0GC0A')).
            to.throw(
                'Boolean connectives must operate on boolean trees');
        expect(() => new DNA.DNA('1CRd1TC0C0GC0O')).
            to.throw(
                'Boolean connectives must operate on boolean trees');
    });
});

describe('Unary operators', function() {
    it('must take one argument', function() {
        expect(() => new DNA.DNA('15Rd1TC')).
            to.throw('Unexpected parse results');
        expect(() => new DNA.DNA('15Rd1TR')).
            to.throw('Unexpected parse results');
        expect(() => new DNA.DNA('15Rd1TN')).to.throw('Unexpected operator');
    });

    it('can parse not', function() {
        const dna = new DNA.DNA('1BRd6C0C0LNC0');
        expect(dna.genes[0].condition.operator).to.equal('N');
    });
});

describe('Binary operators', function() {
    it('must take two arguments', function() {
        // One argument
        expect(() => new DNA.DNA('17Rd1TC0G')).
            to.throw('Unexpected operator');

        // Three arguments
        expect(() => new DNA.DNA('1BRd1TC0C0C0G')).
            to.throw('Unexpected parse results');
    });

    it('can parse greater than', function() {
        const dna = new DNA.DNA('1ARd5C0C0GC0');
        expect(dna.genes[0].condition.operator).to.equal('G');
    });

    it('can parse less than', function() {
        const dna = new DNA.DNA('1ARd5C0C0LC0');
        expect(dna.genes[0].condition.operator).to.equal('L');
    });

    it('can parse and', function() {
        const dna = new DNA.DNA('1GRdBC0C0LC0C0GAC0');
        expect(dna.genes[0].condition.operator).to.equal('A');
    });

    it('can parse or', function() {
        const dna = new DNA.DNA('1GRdBC0C0LC0C0GOC0');
        expect(dna.genes[0].condition.operator).to.equal('O');
    });

    it('can parse add', function() {
        const dna = new DNA.DNA('19Rd1TC0C0P');
        expect(dna.genes[0].expression.operator).to.equal('P');
    });

    it('can parse subtract', function() {
        const dna = new DNA.DNA('19Rd1TC0C0S');
        expect(dna.genes[0].expression.operator).to.equal('S');
    });

    it('can parse multiply', function() {
        const dna = new DNA.DNA('19Rd1TC0C0M');
        expect(dna.genes[0].expression.operator).to.equal('M');
    });

    it('can parse divide', function() {
        const dna = new DNA.DNA('19Rd1TC0C0D');
        expect(dna.genes[0].expression.operator).to.equal('D');
    });
});
