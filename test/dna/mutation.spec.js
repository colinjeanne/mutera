const expect = require('chai').expect;
const DNA = require('./../../umd/world.js').DNA;
const MockSelector = require('./mockSelector.js').default;

describe('Mutation', function() {
    const mutateDNA = (encodedDNA, selector) => {
        const dna = new DNA.DNA(encodedDNA, selector);
        const mutated = dna.recombine(dna);
        return mutated.toString();
    };

    it('can choose zero mutations', function() {
        const selector = new MockSelector();

        const encoded = '16Va1TC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal(encoded);
    });

    it('can mutate the output variable', function() {
        const selector = new MockSelector({
            chooseGeneMutationCount() {
                return 1;
            },

            chooseOutputVariable() {
                return 'b';
            }
        });

        const encoded = '16Va1TC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Vb1TC0');
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

        const encoded = '1AVa5C0C1GC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('1AVa5C1C0GC0');
    });

    it('swaps true for itself', function() {
        const selector = new MockSelector({
            chooseGeneMutationCount() {
                return 1;
            },

            chooseLocation() {
                return 1;
            },

            chooseMutationType() {
                return DNA.mutationType.swapOperator;
            }
        });

        const encoded = '16Va1TC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Va1TC0');
    });

    it('swaps variables for themselves', function() {
        const selector = new MockSelector({
            chooseGeneMutationCount() {
                return 1;
            },

            chooseLocation() {
                return 2;
            },

            chooseMutationType() {
                return DNA.mutationType.swapOperator;
            }
        });

        const encoded = '16Va1TVa';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Va1TVa');
    });

    it('swaps constants for themselves', function() {
        const selector = new MockSelector({
            chooseGeneMutationCount() {
                return 1;
            },

            chooseLocation() {
                return 2;
            },

            chooseMutationType() {
                return DNA.mutationType.swapOperator;
            }
        });

        const encoded = '16Va1TC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Va1TC0');
    });

    it('swaps booleans for themselves', function() {
        const selector = new MockSelector({
            chooseGeneMutationCount() {
                return 1;
            },

            chooseLocation() {
                return 2;
            },

            chooseMutationType() {
                return DNA.mutationType.swapOperator;
            }
        });

        const encoded = '16Ba1TBa';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Ba1TBa');
    });

    it('swaps arithmetic operators for other arithmetic operators', function() {
        const selector = new MockSelector({
            chooseGeneMutationCount() {
                return 1;
            },

            chooseLocation() {
                return 4;
            },

            chooseMutationType() {
                return DNA.mutationType.swapOperator;
            }
        });

        const encoded = '19Va1TC0C1P';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('19Va1TC0C1S');
    });

    it('swaps boolean operators for other boolean operators', function() {
        const selector = new MockSelector({
            chooseGeneMutationCount() {
                return 1;
            },

            chooseLocation() {
                return 3;
            },

            chooseMutationType() {
                return DNA.mutationType.swapOperator;
            }
        });

        const encoded = '1AVa5C0C1GC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('1AVa5C0C1LC0');
    });

    it('swaps boolean connectives for other boolean connectives', function() {
        const selector = new MockSelector({
            chooseGeneMutationCount() {
                return 1;
            },

            chooseLocation() {
                return 7;
            },

            chooseMutationType() {
                return DNA.mutationType.swapOperator;
            }
        });

        const encoded = '1GVaBC0C1GC0C1LAC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('1GVaBC0C1GC0C1LOC0');
    });

    it('can replace a variable with another variable', function() {
        const selector = new MockSelector({
            chooseGeneMutationCount() {
                return 1;
            },

            chooseInputVariable() {
                return 'b';
            },

            chooseLocation() {
                return 2;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceChild;
            }
        });

        const encoded = '16Va1TVa';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Va1TVb');
    });

    it('can replace a constant with another constant', function() {
        const selector = new MockSelector({
            chooseConstant() {
                return 1;
            },

            chooseGeneMutationCount() {
                return 1;
            },

            chooseLocation() {
                return 2;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceChild;
            }
        });

        const encoded = '16Va1TC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Va1TC1');
    });

    it('can replace a boolean with another boolean', function() {
        const selector = new MockSelector({
            chooseGeneMutationCount() {
                return 1;
            },

            chooseInputBoolean() {
                return 'b';
            },

            chooseLocation() {
                return 2;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceChild;
            }
        });

        const encoded = '16Ba1TBa';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Ba1TBb');
    });

    it('can replace true with itself', function() {
        const selector = new MockSelector({
            chooseGeneMutationCount() {
                return 1;
            },

            chooseLocation() {
                return 1;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceChild;
            }
        });

        const encoded = '16Va1TC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Va1TC0');
    });

    it('can replace not tree with a boolean tree', function() {
        const selector = new MockSelector({
            chooseArithmeticOperator() {
                return DNA.operators.constant;
            },

            chooseBooleanOperator() {
                return DNA.operators.greaterThan;
            },

            chooseConstant() {
                return 0;
            },

            chooseGeneMutationCount() {
                return 1;
            },

            chooseLocation() {
                return 2;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceChild;
            }
        });

        const encoded = '17Va2TNC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('1BVa6C0C0GNC0');
    });

    it('can replace the left hand child of binary operators', function() {
        const selector = new MockSelector({
            chooseArithmeticOperator(depth) {
                if (depth === 1) {
                    return DNA.operators.add;
                }
                return DNA.operators.variable;
            },

            chooseGeneMutationCount() {
                return 1;
            },

            chooseInputVariable() {
                return 'a';
            },

            chooseLocation() {
                return 4;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceChild;
            },

            chooseTreeChild() {
                return 'lhs';
            }
        });

        const encoded = '19Va1TC0C0P';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('1CVa1TVaVaPC0P');
    });

    it('can replace the right hand child of binary operators', function() {
        const selector = new MockSelector({
            chooseArithmeticOperator(depth) {
                if (depth === 1) {
                    return DNA.operators.add;
                }
                return DNA.operators.variable;
            },

            chooseGeneMutationCount() {
                return 1;
            },

            chooseInputVariable() {
                return 'a';
            },

            chooseLocation() {
                return 4;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceChild;
            },

            chooseTreeChild() {
                return 'rhs';
            }
        });

        const encoded = '19Va1TC0C0P';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('1CVa1TC0VaVaPP');
    });

    it('can replace a child of an arithmetic operator with an arithmetic tree', function() {
        const selector = new MockSelector({
            chooseArithmeticOperator(depth) {
                if (depth === 1) {
                    return DNA.operators.add;
                }
                return DNA.operators.variable;
            },

            chooseGeneMutationCount() {
                return 1;
            },

            chooseInputVariable() {
                return 'a';
            },

            chooseLocation() {
                return 4;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceChild;
            },

            chooseTreeChild() {
                return 'rhs';
            }
        });

        const encoded = '19Va1TC0C0P';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('1CVa1TC0VaVaPP');
    });

    it('can replace a child of a boolean operator with an arithmetic tree', function() {
        const selector = new MockSelector({
            chooseArithmeticOperator() {
                return DNA.operators.variable;
            },

            chooseGeneMutationCount() {
                return 1;
            },

            chooseInputVariable() {
                return 'a';
            },

            chooseLocation() {
                return 3;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceChild;
            },

            chooseTreeChild() {
                return 'rhs';
            }
        });

        const encoded = '1AVa5C0C0GC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('1AVa5C0VaGC0');
    });

    it('can replace a child of a boolean connective with another boolean tree', function() {
        const selector = new MockSelector({
            chooseBooleanOperator(depth) {
                if (depth === 1) {
                    return DNA.operators.not;
                } else if (depth === 2) {
                    return DNA.operators.and;
                }
                return DNA.operators.true;
            },

            chooseGeneMutationCount() {
                return 1;
            },

            chooseLocation() {
                return 3;
            },

            chooseMutationType() {
                return DNA.mutationType.replaceChild;
            },

            chooseTreeChild() {
                return 'lhs';
            }
        });

        const encoded = '18Va3TTAC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('1BVa6TTANTAC0');
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

        const encoded = '16Va1TC06Va1TC16Va1TC2';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Va1TC06Va1TC16Va1TC16Va1TC2');
    });

    it('can splice in a random gene at the start', function() {
        const selector = new MockSelector({
            chooseAlternateOperator() {
                return DNA.operators.variable;
            },

            chooseBooleanOperator() {
                return DNA.operators.true;
            },

            chooseGeneSpliceCount() {
                return 1;
            },

            chooseInputVariable() {
                return 'a';
            },

            chooseLocation() {
                return 0;
            },

            chooseOutputVariable() {
                return 'a';
            },

            chooseSpliceType() {
                return DNA.spliceType.insert;
            }
        });

        const encoded = '16Va1TC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Va1TVa6Va1TC0');
    });

    it('can splice in a random gene in the middle', function() {
        const selector = new MockSelector({
            chooseAlternateOperator() {
                return DNA.operators.variable;
            },

            chooseBooleanOperator() {
                return DNA.operators.true;
            },

            chooseGeneSpliceCount() {
                return 1;
            },

            chooseInputVariable() {
                return 'a';
            },

            chooseLocation() {
                return 1;
            },

            chooseOutputVariable() {
                return 'a';
            },

            chooseSpliceType() {
                return DNA.spliceType.insert;
            }
        });

        const encoded = '16Va1TC06Va1TC1';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Va1TC06Va1TVa6Va1TC1');
    });

    it('can splice in a random gene at the end', function() {
        const selector = new MockSelector({
            chooseAlternateOperator() {
                return DNA.operators.variable;
            },

            chooseBooleanOperator() {
                return DNA.operators.true;
            },

            chooseGeneSpliceCount() {
                return 1;
            },

            chooseInputVariable() {
                return 'a';
            },

            chooseLocation() {
                return 1;
            },

            chooseOutputVariable() {
                return 'a';
            },

            chooseSpliceType() {
                return DNA.spliceType.insert;
            }
        });

        const encoded = '16Va1TC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Va1TC06Va1TVa');
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

        const encoded = '16Va1TC06Va1TC16Va1TC2';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Va1TC06Va1TC2');
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

        const encoded = '16Va1TC0';
        const mutated = mutateDNA(encoded, selector);
        expect(mutated).to.equal('16Va1TC0');
    });
});
