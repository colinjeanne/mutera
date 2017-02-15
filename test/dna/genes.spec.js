const expect = require('chai').expect;
const DNA = require('./../../umd/world.js').DNA;

describe('Genes', function() {
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
