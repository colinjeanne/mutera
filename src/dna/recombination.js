import { base64Values } from './../base64';
import * as Constants from './constants';
import * as Random from './../random';

const spliceType = {
    delete: 'delete',
    duplicate: 'duplicate',
    insert: 'insert'
};

const defaultMutationRates = {
    geneCount: new Map([
        [1, 0.2],
        [2, 0.4],
        [3, 0.6],
        [4, 0.8],
        [5, 1]
    ]),
    mutationsPerGene: new Map([
        [0, 0.2],
        [1, 0.4],
        [2, 0.6],
        [3, 0.8],
        [4, 1]
    ]),
    outputVariables: base64Values,
    primaryParentGeneSelection: 0.5,
    spliceRates: new Map([
        [spliceType.delete, 0.33],
        [spliceType.duplicate, 0.66],
        [spliceType.insert, 1]
    ]),
    splicesPerGene: new Map([
        [0, 0.9],
        [1, 1]
    ]),
    treeRecursionRate: 0.5
};

const flattenTree = tree => {
    const output = [];
    if (tree.lhs) {
        output.push(...flattenTree(tree.lhs));
    }

    if (tree.rhs) {
        output.push(...flattenTree(tree.rhs));
    }

    output.push(tree);
    return output;
};

const flattenGene = gene =>
    [
        gene.output,
        ...flattenTree(gene.condition),
        ...flattenTree(gene.expression)
    ];

const randomOutputVariable = (mutationRates, random) =>
    Random.chooseOne(mutationRates.outputVariables, random);

const mutateOutput = (gene, mutationRates, random) => {
    gene.output = randomOutputVariable(mutationRates, random);
};

const swapChildren = tree => {
    const temp = tree.lhs;
    tree.lhs = tree.rhs;
    tree.rhs = temp;
};

const swapOperator = (tree, mutationRates, random) => {
    const alternates = Constants.swappableOperators(tree.operator);
    tree.operator = Random.chooseOne(alternates, random);
};

const randomBooleanTree = (mutationRates, random) => {
    const shouldTerminate =
        Random.chooseIf(mutationRates.treeRecursionRate, random);
    const operators = shouldTerminate ?
        Constants.selectOperators(Constants.operatorTypes.boolean, 0) :
        ([
            ...Constants.selectOperators(Constants.operatorTypes.boolean, 1),
            ...Constants.selectOperators(Constants.operatorTypes.boolean, 2)
        ]);

    const operator = Random.chooseOne(operators, random);

    const tree = {
        operator
    };

    const arity = Constants.arity(operator);
    if (arity === 1) {
        tree.lhs = randomBooleanTree(mutationRates, random);
    } else if (arity === 2) {
        const treeGenerator = Constants.isBooleanConnective(operator) ?
            randomBooleanTree :
            randomArithmeticTree;

        tree.lhs = treeGenerator(mutationRates, random);
        tree.rhs = treeGenerator(mutationRates, random);
    }

    return tree;
};

const randomArithmeticTree = (mutationRates, random) => {
    const shouldTerminate =
        Random.chooseIf(mutationRates.treeRecursionRate, random);
    const operators = shouldTerminate ?
        Constants.selectOperators(Constants.operatorTypes.arithmetic, 0) :
        Constants.selectOperators(Constants.operatorTypes.arithmetic, 2);
    const operator = Random.chooseOne(operators, random);

    const tree = {
        operator
    };

    if (operator === Constants.operators.constant) {
        tree.data =
            Random.chooseIntBetween(0, Constants.constants.length, random);
    } else if (operator === Constants.operators.variable) {
        tree.data = randomOutputVariable(mutationRates, random);
    } else {
        tree.lhs = randomArithmeticTree(mutationRates, random);
        tree.rhs = randomArithmeticTree(mutationRates, random);
    }

    return tree;
};

const randomGene = (mutationRates, random) => ({
    output: randomOutputVariable(mutationRates, random),
    condition: randomBooleanTree(mutationRates, random),
    expression: randomArithmeticTree(mutationRates, random)
});

const replaceChild = (tree, mutationRates, random) => {
    const arity = Constants.arity(tree.operator);
    if (arity === 0) {
        if (tree.operator === Constants.operators.variable) {
            tree.data = randomOutputVariable(mutationRates, random);
        } else if (tree.operator === Constants.operators.constant) {
            tree.data =
                Random.chooseIntBetween(0, Constants.constants.length, random);
        } else if (tree.operator === Constants.operators.true) {
            // Do nothing, there is nothing that can be modified here
        } else {
            throw new Error('Unknown operator');
        }
    } else if (arity === 1) {
        tree.lhs = randomBooleanTree(mutationRates, random);
    } else {
        const child = Random.chooseIf(0.5, random) ? 'lhs' : 'rhs';
        if (!Constants.isBooleanConnective(tree.operator)) {
            tree[child] = randomArithmeticTree(mutationRates, random);
        } else {
            tree[child] = randomBooleanTree(mutationRates, random);
        }
    }
};

const mutateTree = (tree, mutationRates, random) => {
    const possibleMutations = [
        replaceChild,
        swapOperator
    ];

    if (Constants.arity(tree.operator) === 2) {
        possibleMutations.push(swapChildren);
    }

    const mutation = Random.chooseOne(possibleMutations, random);
    mutation(tree, mutationRates, random);
};

const mutateGene = (gene, mutationRates, random) => {
    const count =
        Random.weightedChooseOne(mutationRates.mutationsPerGene, random);

    const flattenedGene = flattenGene(gene);
    for (let i = 0; i < count; ++i) {
        const location =
            Random.chooseIntBetween(0, flattenedGene.length, random);
        if (location === 0) {
            mutateOutput(gene, mutationRates, random);
        } else {
            mutateTree(flattenedGene[location], mutationRates, random);
        }
    }
    return gene;
};

const spliceGenes = (genes, mutationRates, random) => {
    const count =
        Random.weightedChooseOne(mutationRates.splicesPerGene, random);

    for (let i = 0; i < count; ++i) {
        const type =
            Random.weightedChooseOne(mutationRates.spliceRates, random);

        if (type === spliceType.delete) {
            if (genes.length > 1) {
                const location =
                    Random.chooseIntBetween(0, genes.length, random);
                genes.splice(location, 1);
            }
        } else if (type === spliceType.duplicate) {
            const location = Random.chooseIntBetween(0, genes.length, random);
            genes.splice(location, 0, genes[location]);
        } else {
            const location =
                Random.chooseIntBetween(0, genes.length + 1, random);
            genes.splice(location, 0, randomGene(mutationRates, random));
        }
    }
};

const recombineGenes =
    (primaryGenes, secondaryGenes, primaryParentGeneSelection, random) => {
        const genes = [];
        const length = Math.min(primaryGenes.length, secondaryGenes.length);
        for (let i = 0; i < length; ++i) {
            genes.push(
                Random.choose(
                    primaryGenes[i],
                    secondaryGenes[i],
                    primaryParentGeneSelection,
                    random));
        }

        if (length < primaryGenes.length) {
            if (Random.chooseIf(primaryParentGeneSelection, random)) {
                genes.push(...primaryGenes.slice(length));
            }
        } else if (length < secondaryGenes.length) {
            if (!Random.chooseIf(primaryParentGeneSelection, random)) {
                genes.push(...secondaryGenes.slice(length));
            }
        }

        return genes;
    };

export const createRandom = (mutationRates, random) => {
    const activeMutationRates =
        Object.assign({}, defaultMutationRates, mutationRates);
    const count =
        Random.weightedChooseOne(activeMutationRates.geneCount, random);
    const genes = [];

    for (let i = 0; i < count; ++i) {
        genes.push(randomGene(activeMutationRates, random));
    }

    return genes;
};

export const recombine = (
    primaryGenes,
    secondaryGenes,
    mutationRates,
    random) => {
    const activeMutationRates =
        Object.assign({}, defaultMutationRates, mutationRates);
    const genes = recombineGenes(
        primaryGenes,
        secondaryGenes,
        activeMutationRates.primaryParentGeneSelection,
        random);
    const mutated =
        genes.map(gene => mutateGene(gene, activeMutationRates, random));

    spliceGenes(mutated, activeMutationRates, random);
    return mutated;
};
