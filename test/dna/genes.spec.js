const expect = require('chai').expect;
const DNA = require('./../../umd/world.js').DNA;
const MockSelector = require('./mockSelector.js').default;

describe('Parsing genes', function() {
    it('cannot be empty', function() {
        expect(() => new DNA.DNA('11')).to.throw('Gene runt');
    });

    it('must have a length with a nonzero value', function() {
        expect(() => new DNA.DNA('10')).to.throw('Invalid length');
    });

    it('must have an output', function() {
        expect(() => new DNA.DNA('11B')).
            to.throw('Gene missing output variable');
    });

    it('must have a valid output type', function() {
        expect(() => new DNA.DNA('12QA')).
            to.throw('Invalid output type');
    });

    it('must have a condition', function() {
        expect(() => new DNA.DNA('12Rd')).to.throw('Invalid length');
    });

    it('must have a valid condition length', function() {
        expect(() => new DNA.DNA('14Rd2T')).to.throw('Giant condition');
    });

    it('must have an expression', function() {
        expect(() => new DNA.DNA('14Rd1T')).
            to.throw('Gene missing expression');
    });

    it('must have a boolean operator a condition root', function() {
        expect(() => new DNA.DNA('17Rd2C0C0')).
            to.throw('Condition must be boolean');
        expect(() => new DNA.DNA('17Rd2RaC0')).
            to.throw('Condition must be boolean');
        expect(() => new DNA.DNA('1ARd5C0C0PC0')).
            to.throw('Condition must be boolean');
        expect(() => new DNA.DNA('1ARd5C0C0SC0')).
            to.throw('Condition must be boolean');
        expect(() => new DNA.DNA('1ARd5C0C0MC0')).
            to.throw('Condition must be boolean');
        expect(() => new DNA.DNA('1ARd5C0C0DC0')).
            to.throw('Condition must be boolean');
    });

    it('must have an arithmetic operator as an expression root for arithmetic genes', function() {
        expect(() => new DNA.DNA('19Rd1TC0C0G')).
            to.throw('Expression type must match output type');
        expect(() => new DNA.DNA('19Rd1TC0C0L')).
            to.throw('Expression type must match output type');
        expect(() => new DNA.DNA('1FRd1TC0C0LC0C0GA')).
            to.throw('Expression type must match output type');
        expect(() => new DNA.DNA('1FRd1TC0C0LC0C0GO')).
            to.throw('Expression type must match output type');
        expect(() => new DNA.DNA('1ARd1TC0C0LN')).
            to.throw('Expression type must match output type');
        expect(() => new DNA.DNA('15Rd1TT')).
            to.throw('Expression type must match output type');
    });

    it('must have a boolean operator as an expression root for boolean genes', function() {
        expect(() => new DNA.DNA('19Bd1TC0C0P')).
            to.throw('Expression type must match output type');
        expect(() => new DNA.DNA('19Bd1TC0C0S')).
            to.throw('Expression type must match output type');
        expect(() => new DNA.DNA('19Bd1TC0C0M')).
            to.throw('Expression type must match output type');
        expect(() => new DNA.DNA('19Bd1TC0C0D')).
            to.throw('Expression type must match output type');
        expect(() => new DNA.DNA('16Bd1TC0')).
            to.throw('Expression type must match output type');
        expect(() => new DNA.DNA('16Bd1TR0')).
            to.throw('Expression type must match output type');
    });

    it('may use extensions', function() {
        const dna = new DNA.DNA(
            '107Rd01C0C0GNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNC0');

        const condition = {
            operator: 'N',
            depth: 0
        };

        let leaf = condition;
        for (let i = 0; i < 57; ++i) {
            leaf.lhs = {
                operator: 'N',
                depth: i + 1
            };

            leaf = leaf.lhs;
        }

        leaf.lhs = {
            operator: 'G',
            lhs: {
                operator: 'C',
                data: 0,
                depth: 59
            },
            rhs: {
                operator: 'C',
                data: 0,
                depth: 59
            },
            depth: 58
        };

        expect(dna.header.version).to.equal('1');
        expect(dna.genes).to.deep.equal([
            {
                isBoolean: false,
                output: 'd',
                condition,
                expression: {
                    operator: 'C',
                    data: 0,
                    depth: 0
                }
            }
        ]);
    });
});

describe('Encoding', function() {
    const validateEncoding = encodedDNA => {
        const dna = new DNA.DNA(encodedDNA, new MockSelector());
        const reencoded = dna.recombine(dna);

        expect(reencoded.toString()).to.equal(dna.toString());
    };

    it('encodes constants', function() {
        validateEncoding('16Ra1TC0');
    });

    it('encodes reals', function() {
        validateEncoding('16Ra1TRa');
    });

    it('encodes booleans', function() {
        validateEncoding('16Ba1TBa');
    });

    it('encodes extended lengths', function() {
        validateEncoding(
            '107Rd01C0C0GNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNC0');
    });

    it('encodes unary operators', function() {
        validateEncoding('17Ra2TNC0');
    });

    it('encodes binary operators', function() {
        validateEncoding('1ARa5RbRcGC0');
    });

    it('encodes multiple genes', function() {
        validateEncoding('16Ra1TC06Rb1TCY');
    });
});
