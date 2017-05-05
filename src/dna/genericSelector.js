import { base64Values } from './../base64';
import * as Constants from './constants';
import * as Random from './../random';

const defaultMutationRates = {
    geneCount: new Map([
        [1, 0.1],
        [2, 0.2],
        [3, 0.3],
        [4, 0.5],
        [5, 0.6],
        [6, 0.65],
        [7, 0.7],
        [8, 0.75],
        [9, 0.8],
        [10, 0.85],
        [11, 0.9],
        [12, 0.94],
        [13, 0.97],
        [14, 0.99],
        [15, 1]
    ]),
    geneBooleanRate: 0.5,
    inputBooleans: base64Values,
    inputVariables: base64Values,
    maximumGeneCount: 15,
    maximumTreeDepth: 5,
    mutationsPerGene: new Map([
        [0, 0.2],
        [1, 0.4],
        [2, 0.6],
        [3, 0.8],
        [4, 1]
    ]),
    outputBooleans: base64Values,
    outputVariables: base64Values,
    primaryParentGeneSelection: 0.5,
    spliceRates: new Map([
        [Constants.spliceType.delete, 0.33],
        [Constants.spliceType.duplicate, 0.66],
        [Constants.spliceType.insert, 1]
    ]),
    splicesPerGene: new Map([
        [0, 0.9],
        [1, 1]
    ]),
    treeRecursionRate: 0.5
};

export default class GenericSelector {
    constructor(mutationRates) {
        this.mutationRates = Object.assign(
            {},
            defaultMutationRates,
            mutationRates);
    }

    chooseAlternateOperator(alternates, depth) {
        if (alternates.includes(Constants.operators.boolean) &&
            (this.mutationRates.inputBooleans.length === 0)) {
            alternates = alternates.filter(
                operator => operator !== Constants.operators.boolean);
        }

        if (alternates.includes(Constants.operators.variable) &&
            (this.mutationRates.inputVariables.length === 0)) {
            alternates = alternates.filter(
                operator => operator !== Constants.operators.variable);
        }

        if (this.shouldTerminate(depth)) {
            alternates = alternates.filter(
                operator => Constants.arity(operator) === 0);
        }

        return Random.chooseOne(alternates, Math.random);
    }

    chooseArithmeticOperator(depth) {
        const shouldTerminate = this.shouldTerminate(depth);
        let operators = shouldTerminate ?
            Constants.selectOperators(Constants.operatorTypes.arithmetic, 0) :
            Constants.selectOperators(Constants.operatorTypes.arithmetic, 2);

        if (this.mutationRates.inputVariables.length === 0) {
            operators = operators.filter(operator =>
                operator !== Constants.operators.variable);
        }

        return Random.chooseOne(operators, Math.random);
    }

    chooseBooleanOperator(depth) {
        const shouldTerminate = this.shouldTerminate(depth);
        let operators = shouldTerminate ?
            Constants.selectOperators(Constants.operatorTypes.boolean, 0) :
            ([
                ...Constants.
                    selectOperators(Constants.operatorTypes.boolean, 1),
                ...Constants.selectOperators(Constants.operatorTypes.boolean, 2)
            ]);

        if (this.mutationRates.inputBooleans.length === 0) {
            operators = operators.filter(operator =>
                operator !== Constants.operators.boolean);
        }

        return Random.chooseOne(operators, Math.random);
    }

    chooseConstant() {
        return Random.
            chooseIntBetween(0, Constants.constants.length, Math.random);
    }

    chooseGene(primaryGene, secondaryGene) {
        return Random.choose(
            primaryGene,
            secondaryGene,
            this.mutationRates.primaryParentGeneSelection,
            Math.random);
    }

    chooseGeneCount() {
        return Random.
            weightedChooseOne(this.mutationRates.geneCount, Math.random);
    }

    chooseGeneIsBoolean() {
        return Random.
            chooseIf(this.mutationRates.geneBooleanRate, Math.random);
    }

    chooseGeneMutationCount() {
        return Random.
            weightedChooseOne(this.mutationRates.mutationsPerGene, Math.random);
    }

    chooseGeneSpliceCount() {
        return Random.
            weightedChooseOne(this.mutationRates.splicesPerGene, Math.random);
    }

    chooseInputBoolean() {
        return Random.chooseOne(this.mutationRates.inputBooleans, Math.random);
    }

    chooseInputVariable() {
        return Random.chooseOne(this.mutationRates.inputVariables, Math.random);
    }

    chooseLocation(max) {
        return Random.chooseIntBetween(0, max, Math.random);
    }

    chooseMutationType(operator) {
        const possibleMutations = [
            Constants.mutationType.replaceTree
        ];

        if (Constants.arity(operator) === 2) {
            possibleMutations.push(Constants.mutationType.swapChildren);
        }

        return Random.chooseOne(possibleMutations, Math.random);
    }

    chooseOutputBoolean() {
        return Random.chooseOne(this.mutationRates.outputBooleans, Math.random);
    }

    chooseOutputVariable() {
        return Random.chooseOne(
            this.mutationRates.outputVariables,
            Math.random);
    }

    chooseSpliceType(genes) {
        let spliceRates;
        if (genes.length === this.mutationRates.maximumGeneCount) {
            spliceRates = new Map([
                [Constants.spliceType.delete, 1]
            ]);
        } else {
            spliceRates = this.mutationRates.spliceRates;
        }

        return Random.weightedChooseOne(spliceRates, Math.random);
    }

    chooseTreeChild() {
        return Random.chooseIf(0.5, Math.random) ? 'lhs' : 'rhs';
    }

    shouldUseRestOfPrimaryGenes() {
        return Random.chooseIf(
            this.mutationRates.primaryParentGeneSelection,
            Math.random);
    }

    shouldUseRestOfSecondaryGenes() {
        return !this.shouldUseRestOfPrimaryGenes();
    }

    shouldTerminate(depth) {
        return (depth >= this.mutationRates.maximumTreeDepth) ||
            Random.chooseIf(this.mutationRates.treeRecursionRate, Math.random);
    }
}
