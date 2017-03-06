const DNA = require('./../../umd/world.js').DNA;

const defaultSelector = {
    chooseAlternateOperator(alternates) {
        if (alternates.length === 1) {
            return alternates[0];
        }

        return alternates[1];
    },

    chooseArithmeticOperator() {
        return DNA.operators.variable;
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

    chooseGeneMutationCount() {
        return 0;
    },

    chooseGeneSpliceCount() {
        return 0;
    },

    chooseInputVariable() {
        return '0';
    },

    chooseLocation() {
        return 0;
    },

    chooseMutationType() {
        return DNA.mutationType.replaceChild;
    },

    chooseOutputVariable() {
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

    chooseGeneMutationCount() {
        return this.sequences.chooseGeneMutationCount();
    }

    chooseGeneSpliceCount() {
        return this.sequences.chooseGeneSpliceCount();
    }

    chooseInputVariable() {
        return this.sequences.chooseInputVariable();
    }

    chooseLocation() {
        return this.sequences.chooseLocation();
    }

    chooseMutationType() {
        return this.sequences.chooseMutationType();
    }

    chooseOutputVariable() {
        return this.sequences.chooseOutputVariable();
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
