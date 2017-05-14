const expect = require('chai').expect;
const DNA = require('../../umd/world.js').DNA;
const MockSelector = require('./mockSelector.js').default;

describe('Mutation', function() {
    const mutateDNA = (encodedDNA, selector) => {
        const dna = new DNA.DNA(encodedDNA, selector);
        const mutated = dna.recombine(dna);
        return mutated.toString();
    };

    it('can choose zero mutations', function() {
        const selector = new MockSelector();

        const encoded = '16Ra1TC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal(encoded);
    });

    it('can mutate the output real', function() {
        const selector = new MockSelector({
            chooseGeneMutationCount() {
                return 1;
            },

            chooseOutputReal() {
                return 'b';
            }
        });

        const encoded = '16Ra1TC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Rb1TC0');
    });

    it('can mutate the output boolean', function() {
        const selector = new MockSelector({
            chooseGeneMutationCount() {
                return 1;
            },

            chooseOutputBoolean() {
                return 'b';
            }
        });

        const encoded = '15Ba1TT';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('15Bb1TT');
    });

    it('can swap children', function() {
        const selector = new MockSelector({
            chooseGeneMutationCount() {
                return 1;
            },

            chooseLocation() {
                return 3;
            },

            chooseMutationType() {
                return DNA.mutationType.swapChildren;
            }
        });

        const encoded = '1ARa5C0C1GC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('1ARa5C1C0GC0');
    });

    it('can swap nullary boolean for nullary boolean', function() {
        const selector = new MockSelector({
            chooseAlternateOperator() {
                return DNA.operators.boolean;
            },

            chooseGeneMutationCount() {
                return 1;
            },

            chooseInputBoolean() {
                return 'a';
            },

            chooseLocation() {
                return 1;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceTree;
            }
        });

        const encoded = '16Ra1TC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('17Ra2BaC0');
    });

    it('can swap nullary boolean for unary boolean', function() {
        const selector = new MockSelector({
            chooseAlternateOperator() {
                return DNA.operators.not;
            },

            chooseBooleanOperator() {
                return DNA.operators.boolean;
            },

            chooseGeneMutationCount() {
                return 1;
            },

            chooseInputBoolean() {
                return 'a';
            },

            chooseLocation() {
                return 1;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceTree;
            }
        });

        const encoded = '16Ra1TC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('18Ra3BaNC0');
    });

    it('can swap nullary boolean for binary boolean', function() {
        const selector = new MockSelector({
            chooseAlternateOperator() {
                return DNA.operators.and;
            },

            chooseBooleanOperator() {
                return DNA.operators.boolean;
            },

            chooseGeneMutationCount() {
                return 1;
            },

            chooseInputBoolean() {
                return 'a';
            },

            chooseLocation() {
                return 1;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceTree;
            }
        });

        const encoded = '16Ra1TC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('1ARa5BaBaAC0');
    });

    it('swaps reals for constants', function() {
        const selector = new MockSelector({
            chooseAlternateOperator() {
                return DNA.operators.constant;
            },

            chooseGeneMutationCount() {
                return 1;
            },

            chooseLocation() {
                return 2;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceTree;
            }
        });

        const encoded = '16Ra1TRa';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Ra1TC0');
    });

    it('swaps constants for reals', function() {
        const selector = new MockSelector({
            chooseAlternateOperator() {
                return DNA.operators.real;
            },

            chooseGeneMutationCount() {
                return 1;
            },

            chooseLocation() {
                return 2;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceTree;
            }
        });

        const encoded = '16Ra1TCa';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Ra1TR0');
    });

    it('can swap unary boolean for nullary boolean', function() {
        const selector = new MockSelector({
            chooseAlternateOperator() {
                return DNA.operators.true;
            },

            chooseGeneMutationCount() {
                return 1;
            },

            chooseLocation() {
                return 2;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceTree;
            }
        });

        const encoded = '17Ra2TNC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Ra1TC0');
    });

    it('swaps arithmetic operators for other arithmetic operators', function() {
        const selector = new MockSelector({
            chooseAlternateOperator() {
                return DNA.operators.subtract;
            },

            chooseGeneMutationCount() {
                return 1;
            },

            chooseLocation() {
                return 4;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceTree;
            }
        });

        const encoded = '19Ra1TC0C1P';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('19Ra1TC0C1S');
    });

    it('swaps boolean operators for other boolean operators', function() {
        const selector = new MockSelector({
            chooseAlternateOperator() {
                return DNA.operators.lessThan;
            },

            chooseGeneMutationCount() {
                return 1;
            },

            chooseLocation() {
                return 3;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceTree;
            }
        });

        const encoded = '1ARa5C0C1GC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('1ARa5C0C1LC0');
    });

    it('swaps binary boolean connectives for unary boolean connectives', function() {
        const selector = new MockSelector({
            chooseAlternateOperator() {
                return DNA.operators.not;
            },

            chooseGeneMutationCount() {
                return 1;
            },

            chooseLocation() {
                return 7;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceTree;
            }
        });

        const encoded = '1GRaBC0C1GC0C1LAC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('1BRa6C0C1GNC0');
    });

    it('swaps binary boolean connectives for binary boolean connectives', function() {
        const selector = new MockSelector({
            chooseAlternateOperator() {
                return DNA.operators.or;
            },

            chooseGeneMutationCount() {
                return 1;
            },

            chooseLocation() {
                return 7;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceTree;
            }
        });

        const encoded = '1GRaBC0C1GC0C1LAC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('1GRaBC0C1GC0C1LOC0');
    });

    it('swaps boolean connectives for boolean operators', function() {
        const selector = new MockSelector({
            chooseAlternateOperator() {
                return DNA.operators.greaterThan;
            },

            chooseArithmeticOperator() {
                return DNA.operators.constant;
            },

            chooseGeneMutationCount() {
                return 1;
            },

            chooseLocation() {
                return 7;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceTree;
            }
        });

        const encoded = '1GRaBC0C1GC0C1LAC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('1ARa5C0C0GC0');
    });

    it('can duplicate a gene', function() {
        const selector = new MockSelector({
            chooseGeneSpliceCount() {
                return 1;
            },

            chooseLocation() {
                return 1;
            },

            chooseSpliceType() {
                return DNA.spliceType.duplicate;
            }
        });

        const encoded = '16Ra1TC06Ra1TC16Ra1TC2';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Ra1TC06Ra1TC16Ra1TC16Ra1TC2');
    });

    it('can splice in a random gene at the start', function() {
        const selector = new MockSelector({
            chooseAlternateOperator() {
                return DNA.operators.real;
            },

            chooseBooleanOperator() {
                return DNA.operators.true;
            },

            chooseGeneSpliceCount() {
                return 1;
            },

            chooseInputReal() {
                return 'a';
            },

            chooseLocation() {
                return 0;
            },

            chooseOutputReal() {
                return 'a';
            },

            chooseSpliceType() {
                return DNA.spliceType.insert;
            }
        });

        const encoded = '16Ra1TC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Ra1TRa6Ra1TC0');
    });

    it('can splice in a random gene in the middle', function() {
        const selector = new MockSelector({
            chooseAlternateOperator() {
                return DNA.operators.real;
            },

            chooseBooleanOperator() {
                return DNA.operators.true;
            },

            chooseGeneSpliceCount() {
                return 1;
            },

            chooseInputReal() {
                return 'a';
            },

            chooseLocation() {
                return 1;
            },

            chooseOutputReal() {
                return 'a';
            },

            chooseSpliceType() {
                return DNA.spliceType.insert;
            }
        });

        const encoded = '16Ra1TC06Ra1TC1';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Ra1TC06Ra1TRa6Ra1TC1');
    });

    it('can splice in a random gene at the end', function() {
        const selector = new MockSelector({
            chooseAlternateOperator() {
                return DNA.operators.real;
            },

            chooseBooleanOperator() {
                return DNA.operators.true;
            },

            chooseGeneSpliceCount() {
                return 1;
            },

            chooseInputReal() {
                return 'a';
            },

            chooseLocation() {
                return 1;
            },

            chooseOutputReal() {
                return 'a';
            },

            chooseSpliceType() {
                return DNA.spliceType.insert;
            }
        });

        const encoded = '16Ra1TC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Ra1TC06Ra1TRa');
    });

    it('can delete a gene', function() {
        const selector = new MockSelector({
            chooseGeneSpliceCount() {
                return 1;
            },

            chooseLocation() {
                return 1;
            },

            chooseSpliceType() {
                return DNA.spliceType.delete;
            }
        });

        const encoded = '16Ra1TC06Ra1TC16Ra1TC2';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Ra1TC06Ra1TC2');
    });

    it('will not delete the only gene', function() {
        const selector = new MockSelector({
            chooseGeneSpliceCount() {
                return 1;
            },

            chooseLocation() {
                return 0;
            },

            chooseSpliceType() {
                return DNA.spliceType.delete;
            }
        });

        const encoded = '16Ra1TC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Ra1TC0');
    });
});
