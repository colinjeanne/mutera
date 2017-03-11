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

    it('cannot have more than 10 extensions', function() {
        expect(() => new DNA.DNA('1000000000001')).
            to.throw('Giant length');
    });

    it('must have a condition', function() {
        expect(() => new DNA.DNA('11d')).to.throw('Invalid length');
    });

    it('must have a valid condition length', function() {
        expect(() => new DNA.DNA('13d2T')).to.throw('Giant condition');
    });

    it('must have an expression', function() {
        expect(() => new DNA.DNA('13d1T')).
            to.throw('Gene missing expression');
    });

    it('must have a boolean operator a condition root', function() {
        expect(() => new DNA.DNA('16d2C0C0')).
            to.throw('Condition must be boolean');
        expect(() => new DNA.DNA('16d2VaC0')).
            to.throw('Condition must be boolean');
        expect(() => new DNA.DNA('19d5C0C0PC0')).
            to.throw('Condition must be boolean');
        expect(() => new DNA.DNA('19d5C0C0SC0')).
            to.throw('Condition must be boolean');
        expect(() => new DNA.DNA('19d5C0C0MC0')).
            to.throw('Condition must be boolean');
        expect(() => new DNA.DNA('19d5C0C0DC0')).
            to.throw('Condition must be boolean');
    });

    it('must have an arithmetic operator as an expression root', function() {
        expect(() => new DNA.DNA('18d1TC0C0G')).
            to.throw('Expression must only contain arithmetic operators');
        expect(() => new DNA.DNA('18d1TC0C0L')).
            to.throw('Expression must only contain arithmetic operators');
        expect(() => new DNA.DNA('1Ed1TC0C0LC0C0GA')).
            to.throw('Expression must only contain arithmetic operators');
        expect(() => new DNA.DNA('1Ed1TC0C0LC0C0GO')).
            to.throw('Expression must only contain arithmetic operators');
        expect(() => new DNA.DNA('19d1TC0C0LN')).
            to.throw('Expression must only contain arithmetic operators');
        expect(() => new DNA.DNA('14d1TT')).
            to.throw('Expression must only contain arithmetic operators');
    });

    it('may use extensions', function() {
        const dna = new DNA.DNA(
            '106d01C0C0GNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNC0');

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
        validateEncoding('15a1TC0');
    });

    it('encodes variables', function() {
        validateEncoding('15a1TVa');
    });

    it('encodes extended lengths', function() {
        validateEncoding(
            '106d01C0C0GNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNC0');
    });

    it('encodes unary operators', function() {
        validateEncoding('16a2TNC0');
    });

    it('encodes binary operators', function() {
        validateEncoding('19a5VbVcGC0');
    });

    it('encodes multiple genes', function() {
        validateEncoding('15a1TC05b1TCY');
    });
});

describe('Expression trees', function() {
    it('cannot have boolean operators below arithmetic operators', function() {
        // Left child
        expect(() => new DNA.DNA('1Bd1TC0C0GC0P')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('1Bd1TC0C0LC0P')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('1Hd1TC0C0LC0C0GAC0P')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('1Hd1TC0C0LC0C0GOC0P')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('1Cd1TC0C0LNC0P')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('17d1TTC0P')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');

        // Right child
        expect(() => new DNA.DNA('1Bd1TC0C0C0GP')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('1Bd1TC0C0C0LP')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('1Hd1TC0C0C0LC0C0GAP')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('1Hd1TC0C0C0LC0C0GOP')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('1Cd1TC0C0C0LNP')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new DNA.DNA('17d1TC0TP')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
    });

    it('cannot have boolean connectives operate on non-boolean trees', function() {
        // Left child
        expect(() => new DNA.DNA('1Bd1TC0C0C0GA')).
            to.throw(
                'Boolean connectives must operate on boolean trees');
        expect(() => new DNA.DNA('1Bd1TC0C0C0GO')).
            to.throw(
                'Boolean connectives must operate on boolean trees');
        expect(() => new DNA.DNA('16d1TC0N')).
            to.throw(
                'Boolean connectives must operate on boolean trees');

        // Right child
        expect(() => new DNA.DNA('1Bd1TC0C0GC0A')).
            to.throw(
                'Boolean connectives must operate on boolean trees');
        expect(() => new DNA.DNA('1Bd1TC0C0GC0O')).
            to.throw(
                'Boolean connectives must operate on boolean trees');
    });
});

describe('Unary operators', function() {
    it('must take one argument', function() {
        expect(() => new DNA.DNA('14d1TC')).
            to.throw('Unexpected parse results');
        expect(() => new DNA.DNA('14d1TV')).
            to.throw('Unexpected parse results');
        expect(() => new DNA.DNA('14d1TN')).to.throw('Unexpected operator');
    });

    it('can parse not', function() {
        const dna = new DNA.DNA('1Ad6C0C0LNC0');
        expect(dna.genes[0].condition.operator).to.equal('N');
    });
});

describe('Binary operators', function() {
    it('must take two arguments', function() {
        // One argument
        expect(() => new DNA.DNA('16d1TC0G')).
            to.throw('Unexpected operator');

        // Three arguments
        expect(() => new DNA.DNA('1Ad1TC0C0C0G')).
            to.throw('Unexpected parse results');
    });

    it('can parse greater than', function() {
        const dna = new DNA.DNA('19d5C0C0GC0');
        expect(dna.genes[0].condition.operator).to.equal('G');
    });

    it('can parse less than', function() {
        const dna = new DNA.DNA('19d5C0C0LC0');
        expect(dna.genes[0].condition.operator).to.equal('L');
    });

    it('can parse and', function() {
        const dna = new DNA.DNA('1FdBC0C0LC0C0GAC0');
        expect(dna.genes[0].condition.operator).to.equal('A');
    });

    it('can parse or', function() {
        const dna = new DNA.DNA('1FdBC0C0LC0C0GOC0');
        expect(dna.genes[0].condition.operator).to.equal('O');
    });

    it('can parse add', function() {
        const dna = new DNA.DNA('18d1TC0C0P');
        expect(dna.genes[0].expression.operator).to.equal('P');
    });

    it('can parse subtract', function() {
        const dna = new DNA.DNA('18d1TC0C0S');
        expect(dna.genes[0].expression.operator).to.equal('S');
    });

    it('can parse multiply', function() {
        const dna = new DNA.DNA('18d1TC0C0M');
        expect(dna.genes[0].expression.operator).to.equal('M');
    });

    it('can parse divide', function() {
        const dna = new DNA.DNA('18d1TC0C0D');
        expect(dna.genes[0].expression.operator).to.equal('D');
    });
});
