const DNA = require('./../../umd/world.js').DNA;

const defaultSelector = {
    chooseAlternateOperator(alternates) {
        if (alternates.length === 1) {
            return alternates[0];
        }

        return alternates[1];
    },

    chooseArithmeticOperator() {
        return DNA.operators.real;
    },

    chooseBooleanOperator() {
        return DNA.operators.true;
    },

    chooseConstant() {
        return 0;
    },

    chooseGene() {
        return 'primary';
    },

    chooseGeneCount() {
        return 1;
    },

    chooseGeneIsBoolean() {
        return false;
    },

    chooseGeneMutationCount() {
        return 0;
    },

    chooseGeneSpliceCount() {
        return 0;
    },

    chooseInputBoolean() {
        return '0';
    },

    chooseInputReal() {
        return '0';
    },

    chooseLocation() {
        return 0;
    },

    chooseMutationType() {
        return DNA.mutationType.replaceTree;
    },

    chooseOutputBoolean() {
        return '0';
    },

    chooseOutputReal() {
        return '0';
    },

    chooseSpliceType() {
        return DNA.spliceType.delete;
    },

    chooseTreeChild() {
        return 'lhs';
    },

    shouldUseRestOfPrimaryGenes() {
        return false;
    },

    shouldUseRestOfSecondaryGenes() {
        return false;
    }
};

exports.default = class MockSelector {
    constructor(sequences) {
        this.sequences = Object.assign({}, defaultSelector, sequences);
    }

    chooseAlternateOperator(alternates) {
        return this.sequences.chooseAlternateOperator(alternates);
    }

    chooseArithmeticOperator(depth) {
        return this.sequences.chooseArithmeticOperator(depth);
    }

    chooseBooleanOperator(depth) {
        return this.sequences.chooseBooleanOperator(depth);
    }

    chooseConstant() {
        return this.sequences.chooseConstant();
    }

    chooseGene(primaryGene, secondaryGene) {
        const nextGene = this.sequences.chooseGene();
        return nextGene === 'primary' ? primaryGene : secondaryGene;
    }

    chooseGeneCount() {
        return this.sequences.chooseGeneCount();
    }

    chooseGeneIsBoolean() {
        return this.sequences.chooseGeneIsBoolean();
    }

    chooseGeneMutationCount() {
        return this.sequences.chooseGeneMutationCount();
    }

    chooseGeneSpliceCount() {
        return this.sequences.chooseGeneSpliceCount();
    }

    chooseInputBoolean() {
        return this.sequences.chooseInputBoolean();
    }

    chooseInputReal() {
        return this.sequences.chooseInputReal();
    }

    chooseLocation() {
        return this.sequences.chooseLocation();
    }

    chooseMutationType() {
        return this.sequences.chooseMutationType();
    }

    chooseOutputBoolean() {
        return this.sequences.chooseOutputBoolean();
    }

    chooseOutputReal() {
        return this.sequences.chooseOutputReal();
    }

    chooseSpliceType() {
        return this.sequences.chooseSpliceType();
    }

    chooseTreeChild() {
        return this.sequences.chooseTreeChild();
    }

    shouldUseRestOfPrimaryGenes() {
        return this.sequences.shouldUseRestOfPrimaryGenes();
    }

    shouldUseRestOfSecondaryGenes() {
        return this.sequences.shouldUseRestOfSecondaryGenes();
    }
};
