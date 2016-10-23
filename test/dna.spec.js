const expect = require('chai').expect;
const world = require('./../umd/world.js');

const makeSequence = (...seq) => () => seq.length ? seq.shift() : 0;

describe('DNA', function() {
    it('must have a header', function() {
        expect(() => new world.DNA('')).to.throw('DNA missing header');
    });

    it('must be version 1', function() {
        expect(() => new world.DNA('2XCA')).to.throw('Unexpected version');
    });

    it('must have at least one gene', function() {
        expect(() => new world.DNA('1')).to.throw('DNA missing genes');
    });

    it('can process constants', function() {
        const dna = new world.DNA('15a1TCV');
        const output = dna.process({});
        expect(output).to.deep.equal({ a: -0.125 });
    });

    it('can process variables', function() {
        const dna = new world.DNA('15a1TVb');
        const output = dna.process({ b: 1 });
        expect(output).to.deep.equal({ a: 1, b: 1 });
    });

    it('default variable values to 0', function() {
        const dna = new world.DNA('15a1TVb');
        const output = dna.process({});
        expect(output).to.deep.equal({ a: 0 });
    });

    it('does not return unset variables', function() {
        const dna = new world.DNA('19a5C0CzGC0');
        const output = dna.process();
        expect(output).to.deep.equal({});
    });

    it('overwrite outputs', function() {
        const dna = new world.DNA('15a1TC05a1TCX');
        const output = dna.process();
        expect(output).to.deep.equal({ a: 0.125 });
    });

    it('return multiple outputs', function() {
        const dna = new world.DNA('15a1TC05b1TCY');
        const output = dna.process();
        expect(output).to.deep.equal({ a: -4, b: 0.25 });
    });

    it('can add', function() {
        const dna = new world.DNA('18a1TVbVcP');
        const output = dna.process({ b: 0.125, c: 0.25 });
        expect(output).to.deep.equal({ a: 0.375, b: 0.125, c: 0.25 });
    });

    it('can subtract', function() {
        const dna = new world.DNA('18a1TVbVcS');
        const output = dna.process({ b: 0.125, c: 0.25 });
        expect(output).to.deep.equal({ a: -0.125, b: 0.125, c: 0.25 });
    });

    it('can multiply', function() {
        const dna = new world.DNA('18a1TVbVcM');
        const output = dna.process({ b: 0.125, c: 0.25 });
        expect(output).to.deep.equal({ a: 0.03125, b: 0.125, c: 0.25 });
    });

    it('can divide', function() {
        const dna = new world.DNA('18a1TVbVcD');
        const output = dna.process({ b: 0.125, c: 0.25 });
        expect(output).to.deep.equal({ a: 0.5, b: 0.125, c: 0.25 });
    });

    it('can measure greater than', function() {
        const dna = new world.DNA('19a5VbVcGC0');
        const output = dna.process({ b: 0.5, c: 0.25 });
        expect(output).to.deep.equal({ a: -4, b: 0.5, c: 0.25 });
    });

    it('can measure less than', function() {
        const dna = new world.DNA('19a5VbVcLC0');
        const output = dna.process({ b: 0.125, c: 0.25 });
        expect(output).to.deep.equal({ a: -4, b: 0.125, c: 0.25 });
    });

    it('can combine conditions with and', function() {
        const dna = new world.DNA('1FaBVbVcGVcVbLAC0');
        const output = dna.process({ b: 0.5, c: 0.25 });
        expect(output).to.deep.equal({ a: -4, b: 0.5, c: 0.25 });
    });

    it('can combine conditions with or', function() {
        let dna = new world.DNA('1FaBVbVcGVcVbGOC0');
        let output = dna.process({ b: 0.5, c: 0.25 });
        expect(output).to.deep.equal({ a: -4, b: 0.5, c: 0.25 });

        dna = new world.DNA('1FaBVbVcGVcVbGOC0');
        output = dna.process({ b: 0.25, c: 0.5 });
        expect(output).to.deep.equal({ a: -4, b: 0.25, c: 0.5 });
    });

    it('can negate conditions with not', function() {
        const dna = new world.DNA('1Aa6VbVcGNC0');
        const output = dna.process({ b: 0.25, c: 0.5 });
        expect(output).to.deep.equal({ a: -4, b: 0.25, c: 0.5 });
    });

    it('can explicitly set conditions to true', function() {
        const dna = new world.DNA('15a1TC0');
        const output = dna.process({});
        expect(output).to.deep.equal({ a: -4 });
    });

    it('can convert to a string', function() {
        const dna = new world.DNA('15a1TCV');
        expect('' + dna).to.equal('15a1TCV');
    });
});

describe('genes', function() {
    it('cannot be empty', function() {
        expect(() => new world.DNA('11')).to.throw('Gene runt');
    });

    it('must have a length with a nonzero value', function() {
        expect(() => new world.DNA('10')).to.throw('Invalid length');
    });

    it('cannot have more than 10 extensions', function() {
        expect(() => new world.DNA('1000000000001')).
            to.throw('Giant length');
    });

    it('must have a known length encoding', function() {
        expect(() => new world.DNA('1+')).to.throw('Invalid length');
    });

    it('must set a known variable', function() {
        expect(() => new world.DNA('15+1TC0')).
            to.throw('Unknown variable in gene');
    });

    it('must have a condition', function() {
        expect(() => new world.DNA('11d')).to.throw('Invalid length');
    });

    it('must have a valid condition length', function() {
        expect(() => new world.DNA('13d2T')).to.throw('Giant condition');
    });

    it('must have an expression', function() {
        expect(() => new world.DNA('13d1T')).
            to.throw('Gene missing expression');
    });

    it('must have a boolean operator a condition root', function() {
        expect(() => new world.DNA('16d2C0C0')).
            to.throw('Condition must be boolean');
        expect(() => new world.DNA('16d2VaC0')).
            to.throw('Condition must be boolean');
        expect(() => new world.DNA('19d5C0C0PC0')).
            to.throw('Condition must be boolean');
        expect(() => new world.DNA('19d5C0C0SC0')).
            to.throw('Condition must be boolean');
        expect(() => new world.DNA('19d5C0C0MC0')).
            to.throw('Condition must be boolean');
        expect(() => new world.DNA('19d5C0C0DC0')).
            to.throw('Condition must be boolean');
    });

    it('must have an arithmetic operator as an expression root', function() {
        expect(() => new world.DNA('18d1TC0C0G')).
            to.throw('Expression must only contain arithmetic operators');
        expect(() => new world.DNA('18d1TC0C0L')).
            to.throw('Expression must only contain arithmetic operators');
        expect(() => new world.DNA('1Ed1TC0C0LC0C0GA')).
            to.throw('Expression must only contain arithmetic operators');
        expect(() => new world.DNA('1Ed1TC0C0LC0C0GO')).
            to.throw('Expression must only contain arithmetic operators');
        expect(() => new world.DNA('19d1TC0C0LN')).
            to.throw('Expression must only contain arithmetic operators');
        expect(() => new world.DNA('14d1TT')).
            to.throw('Expression must only contain arithmetic operators');
    });

    it('may use extensions', function() {
        const dna = new world.DNA(
            '106d01C0C0GNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNC0');

        const condition = {
            operator: 'N'
        };

        let leaf = condition;
        for (let i = 0; i < 58; ++i) {
            leaf.lhs = {
                operator: 'N'
            };

            leaf = leaf.lhs;
        }

        leaf.lhs = {
            operator: 'G',
            lhs: {
                operator: 'C',
                data: 0
            },
            rhs: {
                operator: 'C',
                data: 0
            }
        };

        expect(dna.header.version).to.equal('1');
        expect(dna.genes).to.deep.equal([
            {
                output: 'd',
                condition,
                expression: {
                    operator: 'C',
                    data: 0
                }
            }
        ]);
    });
});

describe('Expression trees', function() {
    it('cannot have boolean operators below arithmetic operators', function() {
        // Left child
        expect(() => new world.DNA('1Bd1TC0C0GC0P')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new world.DNA('1Bd1TC0C0LC0P')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new world.DNA('1Hd1TC0C0LC0C0GAC0P')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new world.DNA('1Hd1TC0C0LC0C0GOC0P')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new world.DNA('1Cd1TC0C0LNC0P')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new world.DNA('17d1TTC0P')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');

        // Right child
        expect(() => new world.DNA('1Bd1TC0C0C0GP')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new world.DNA('1Bd1TC0C0C0LP')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new world.DNA('1Hd1TC0C0C0LC0C0GAP')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new world.DNA('1Hd1TC0C0C0LC0C0GOP')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new world.DNA('1Cd1TC0C0C0LNP')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
        expect(() => new world.DNA('17d1TC0TP')).
            to.throw(
                'Arithmetic operator cannot operate the result of boolean ' +
                'operators');
    });

    it('cannot have boolean connectives operate on non-boolean trees', function() {
        // Left child
        expect(() => new world.DNA('1Bd1TC0C0C0GA')).
            to.throw(
                'Boolean connectives must operate on boolean trees');
        expect(() => new world.DNA('1Bd1TC0C0C0GO')).
            to.throw(
                'Boolean connectives must operate on boolean trees');
        expect(() => new world.DNA('16d1TC0N')).
            to.throw(
                'Boolean connectives must operate on boolean trees');

        // Right child
        expect(() => new world.DNA('1Bd1TC0C0GC0A')).
            to.throw(
                'Boolean connectives must operate on boolean trees');
        expect(() => new world.DNA('1Bd1TC0C0GC0O')).
            to.throw(
                'Boolean connectives must operate on boolean trees');
    });

    it('fails on an unknown token', function() {
        expect(() => new world.DNA('18d1TC0C0@')).to.throw('Unexpected token');
    });

    it('fails on unknown variables', function() {
        expect(() => new world.DNA('15d1TV+')).to.throw('Unknown variable');
    });

    it('fails on unknown constants', function() {
        expect(() => new world.DNA('15d1TC+')).
            to.throw('Constant out of range');
    });
});

describe('Unary operators', function() {
    it('must take one argument', function() {
        expect(() => new world.DNA('14d1TC')).
            to.throw('Unexpected parse results');
        expect(() => new world.DNA('14d1TV')).
            to.throw('Unexpected parse results');
        expect(() => new world.DNA('14d1TN')).to.throw('Unexpected operator');
    });

    it('can parse not', function() {
        const dna = new world.DNA('1Ad6C0C0LNC0');
        expect(dna.genes[0].condition.operator).to.equal('N');
    });
});

describe('Binary operators', function() {
    it('must take two arguments', function() {
        // One argument
        expect(() => new world.DNA('16d1TC0G')).
            to.throw('Unexpected operator');

        // Three arguments
        expect(() => new world.DNA('1Ad1TC0C0C0G')).
            to.throw('Unexpected parse results');
    });

    it('can parse greater than', function() {
        const dna = new world.DNA('19d5C0C0GC0');
        expect(dna.genes[0].condition.operator).to.equal('G');
    });

    it('can parse less than', function() {
        const dna = new world.DNA('19d5C0C0LC0');
        expect(dna.genes[0].condition.operator).to.equal('L');
    });

    it('can parse and', function() {
        const dna = new world.DNA('1FdBC0C0LC0C0GAC0');
        expect(dna.genes[0].condition.operator).to.equal('A');
    });

    it('can parse or', function() {
        const dna = new world.DNA('1FdBC0C0LC0C0GOC0');
        expect(dna.genes[0].condition.operator).to.equal('O');
    });

    it('can parse add', function() {
        const dna = new world.DNA('18d1TC0C0P');
        expect(dna.genes[0].expression.operator).to.equal('P');
    });

    it('can parse subtract', function() {
        const dna = new world.DNA('18d1TC0C0S');
        expect(dna.genes[0].expression.operator).to.equal('S');
    });

    it('can parse multiply', function() {
        const dna = new world.DNA('18d1TC0C0M');
        expect(dna.genes[0].expression.operator).to.equal('M');
    });

    it('can parse divide', function() {
        const dna = new world.DNA('18d1TC0C0D');
        expect(dna.genes[0].expression.operator).to.equal('D');
    });
});

describe('Encoding', function() {
    const random = () => 0;

    const validateEncoding = encodedDNA => {
        const dna = new world.DNA(encodedDNA);
        const reencoded = dna.recombine(dna, { random });

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
            '106d01C0C0GNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNC0');
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

describe('Recombination', function() {
    const validate =
        (encodedPrimary, encodedSecondary, random, expected) => {
            const primary = new world.DNA(encodedPrimary);
            const secondary = new world.DNA(encodedSecondary);
            const child = primary.recombine(secondary, { random });

            expect(child.toString()).to.equal(expected);
        };

    it('chooses genes from each parent according to the specified probability', function() {
        const random = makeSequence(0.1, 0.1, 0.7);
        const encodedPrimary = '15a1TC05b1TC15c1TC2';
        const encodedSecondary = '15d1TV05e1TV15f1TV2';
        const expected = '15a1TC05b1TC15f1TV2';
        validate(encodedPrimary, encodedSecondary, random, expected);
    });

    it('can choose excess genes from the primary', function() {
        const random = makeSequence(0.7, 0.1);
        const encodedPrimary = '15a1TC05b1TC15c1TC2';
        const encodedSecondary = '15d1TV0';
        const expected = '15d1TV05b1TC15c1TC2';
        validate(encodedPrimary, encodedSecondary, random, expected);
    });

    it('can choose excess genes from the secondary', function() {
        const random = makeSequence(0.1, 0.7);
        const encodedPrimary = '15a1TC0';
        const encodedSecondary = '15d1TV05e1TV15f1TV2';
        const expected = '15a1TC05e1TV15f1TV2';
        validate(encodedPrimary, encodedSecondary, random, expected);
    });

    it('can ignore excess genes from the primary', function() {
        const random = makeSequence(0.1, 0.7);
        const encodedPrimary = '15a1TC05b1TC15c1TC2';
        const encodedSecondary = '15d1TV0';
        const expected = '15a1TC0';
        validate(encodedPrimary, encodedSecondary, random, expected);
    });

    it('can ignore excess genes from the secondary', function() {
        const random = makeSequence(0.7, 0.1);
        const encodedPrimary = '15a1TC0';
        const encodedSecondary = '15d1TV05e1TV15f1TV2';
        const expected = '15d1TV0';
        validate(encodedPrimary, encodedSecondary, random, expected);
    });
});

describe('Mutation', function() {
    const mutateDNA = (encodedDNA, random) => {
        const mutationRates = {
            mutationsPerGene: new Map([
                [0, 0.2],
                [1, 0.4],
                [2, 1]
            ]),
            outputVariables: 'abcd',
            primaryParentGeneSelection: 0.5,
            spliceRates: new Map([
                ['delete', 0.33],
                ['duplicate', 0.66],
                ['insert', 1]
            ]),
            splicesPerGene: new Map([
                [0, 0.9],
                [1, 1]
            ]),
            treeRecursionRate: 0.5,
        };

        const dna = new world.DNA(encodedDNA);
        const mutated = dna.recombine(dna, { mutationRates, random });
        return mutated.toString();
    };

    it('can choose zero mutations', function() {
        const random = makeSequence();
        const encoded = '15a1TC0';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal(encoded);
    });

    it('can mutate the output variable', function() {
        const random = makeSequence(0, 0.3, 0, 0.3);
        const encoded = '15a1TC0';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('15b1TC0');
    });

    it('can swap children', function() {
        const random = makeSequence(0, 0.3, 0.7, 0.9);
        const encoded = '19a5C0C1GC0';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('19a5C1C0GC0');
    });

    it('swaps true for itself', function() {
        const random = makeSequence(0, 0.3, 0.4, 0.9);
        const encoded = '15a1TC0';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('15a1TC0');
    });

    it('swaps variables for themselves', function() {
        const random = makeSequence(0, 0.3, 0.9, 0.9);
        const encoded = '15a1TVa';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('15a1TVa');
    });

    it('swaps constants for themselves', function() {
        const random = makeSequence(0, 0.3, 0.9, 0.9);
        const encoded = '15a1TC0';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('15a1TC0');
    });

    it('swaps arithmetic operators for other arithmetic operators', function() {
        const random = makeSequence(0, 0.3, 0.9, 0.5, 0.4);
        const encoded = '18a1TC0C1P';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('18a1TC0C1S');
    });

    it('swaps boolean operators for other boolean operators', function() {
        const random = makeSequence(0, 0.3, 0.7, 0.5, 0.6);
        const encoded = '19a5C0C1GC0';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('19a5C0C1LC0');
    });

    it('swaps boolean connectives for other boolean connectives', function() {
        const random = makeSequence(0, 0.3, 0.85, 0.5, 0.6);
        const encoded = '1FaBC0C1GC0C1LAC0';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('1FaBC0C1GC0C1LOC0');
    });

    it('can replace a variable with another variable', function() {
        const random = makeSequence(0, 0.3, 0.9, 0, 0.3);
        const encoded = '15a1TVa';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('15a1TVb');
    });

    it('can replace a constant with another constant', function() {
        const random = makeSequence(0, 0.3, 0.9, 0, 1/64);
        const encoded = '15a1TC0';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('15a1TC1');
    });

    it('can replace true with itself', function() {
        const random = makeSequence(0, 0.3, 0.4, 0);
        const encoded = '15a1TC0';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('15a1TC0');
    });

    it('can replace not tree with a boolean tree', function() {
        const random =
            makeSequence(0, 0.3, 0.6, 0, 0.6, 0.7, 0, 0.6, 0, 0, 0.6);
        const encoded = '16a2TNC0';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('1Aa6C0C0GNC0');
    });

    it('can replace the left hand child of binary operators', function() {
        const random = makeSequence(0, 0.3, 0.9, 0, 0.4, 0.7, 0, 0, 0, 0, 0);
        const encoded = '18a1TC0C0P';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('1Ba1TVaVaPC0P');
    });

    it('can replace the right hand child of binary operators', function() {
        const random = makeSequence(0, 0.3, 0.9, 0, 0.6, 0.7, 0, 0, 0, 0, 0);
        const encoded = '18a1TC0C0P';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('1Ba1TC0VaVaPP');
    });

    it('can replace a child of an arithmetic operator with an arithmetic tree', function() {
        const random = makeSequence(0, 0.3, 0.9, 0, 0.6, 0.7, 0, 0, 0, 0, 0);
        const encoded = '18a1TC0C0P';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('1Ba1TC0VaVaPP');
    });

    it('can replace a child of a boolean operator with an arithmetic tree', function() {
        const random = makeSequence(0, 0.3, 0.7, 0, 0.6, 0, 0, 0);
        const encoded = '19a5C0C0GC0';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('19a5C0VaGC0');
    });

    it('can replace a child of a boolean connective with another boolean tree', function() {
        const random =
            makeSequence(0, 0.3, 0.7, 0, 0.4, 0.7, 0, 0.6, 0.2, 0, 0, 0);
        const encoded = '17a3TTAC0';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('1Aa6TTANTAC0');
    });

    it('can duplicate a gene', function() {
        const random = makeSequence(0, 0, 0, 0, 0, 0, 0.95, 0.4, 0.5);
        const encoded = '15a1TC05a1TC15a1TC2';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('15a1TC05a1TC15a1TC15a1TC2');
    });

    it('can splice in a random gene at the start', function() {
        const random = makeSequence(0, 0, 0.95, 0.7, 0);
        const encoded = '15a1TC0';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('15a1TVa5a1TC0');
    });

    it('can splice in a random gene in the middle', function() {
        const random = makeSequence(0, 0, 0, 0, 0.95, 0.7, 0.4);
        const encoded = '15a1TC05a1TC1';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('15a1TC05a1TVa5a1TC1');
    });

    it('can splice in a random gene at the end', function() {
        const random = makeSequence(0, 0, 0.95, 0.7, 0.7);
        const encoded = '15a1TC0';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('15a1TC05a1TVa');
    });

    it('can delete a gene', function() {
        const random = makeSequence(0, 0, 0, 0, 0, 0, 0.95, 0, 0.4);
        const encoded = '15a1TC05a1TC15a1TC2';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('15a1TC05a1TC2');
    });

    it('will not delete the only gene', function() {
        const random = makeSequence(0, 0, 0.95, 0, 0);
        const encoded = '15a1TC0';
        const mutated = mutateDNA(encoded, random);
        expect(mutated).to.equal('15a1TC0');
    });
});
