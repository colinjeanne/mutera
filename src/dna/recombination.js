import * as Constants from './constants';

const spliceType = {
    delete: 'delete',
    duplicate: 'duplicate',
    insert: 'insert'
};

const defaultMutationRates = {
    mutationsPerGene: new Map([
        [0, 0.2],
        [1, 0.4],
        [2, 0.6],
        [3, 0.8],
        [4, 1]
    ]),
    outputVariables: Constants.base64Values,
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

const choose = (u, v, probabilityOfU, random) =>
   random() < probabilityOfU ? u : v;

const weightedChooseOne = (optionsMap, random) => {
    const choice = random();
    let chosenKey = undefined;
    let chosenValue = undefined;
    for (let [key, value] of optionsMap) {
        if ((value > choice) &&
            ((chosenValue === undefined) ||
             (value < chosenValue))) {
            chosenKey = key;
            chosenValue = value;
        }
    }
    return chosenKey;
};

const chooseIntBetween = (min, max, random) =>
    Math.floor(random() * (max - min)) + min;

const chooseOne = (choices, random) =>
    choices[chooseIntBetween(0, choices.length, random)];

const chooseIf = (probabilityOfChoice, random) =>
    choose(true, false, probabilityOfChoice, random);

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
    chooseOne(mutationRates.outputVariables, random);

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
    tree.operator = chooseOne(alternates, random);
};

const randomBooleanTree = (mutationRates, random) => {
    const shouldTerminate = chooseIf(mutationRates.treeRecursionRate, random);
    const operators = shouldTerminate ?
        Constants.selectOperators(Constants.operatorTypes.boolean, 0) :
        ([
            ...Constants.selectOperators(Constants.operatorTypes.boolean, 1),
            ...Constants.selectOperators(Constants.operatorTypes.boolean, 2)
        ]);

    const operator = chooseOne(operators, random);

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
    const shouldTerminate = chooseIf(mutationRates.treeRecursionRate, random);
    const operators = shouldTerminate ?
        Constants.selectOperators(Constants.operatorTypes.arithmetic, 0) :
        Constants.selectOperators(Constants.operatorTypes.arithmetic, 2);
    const operator = chooseOne(operators, random);

    const tree = {
        operator
    };

    if (operator === Constants.operators.constant) {
        tree.data = chooseIntBetween(0, Constants.constants.length, random);
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
            tree.data = chooseIntBetween(0, Constants.constants.length, random);
        } else if (tree.operator === Constants.operators.true) {
            // Do nothing, there is nothing that can be modified here
        } else {
            throw new Error('Unknown operator');
        }
    } else if (arity === 1) {
        tree.lhs = randomBooleanTree(mutationRates, random);
    } else {
        const child = chooseIf(0.5, random) ? 'lhs' : 'rhs';
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

    const mutation = chooseOne(possibleMutations, random);
    mutation(tree, mutationRates, random);
};

const mutateGene = (gene, mutationRates, random) => {
    const count = weightedChooseOne(mutationRates.mutationsPerGene, random);

    const flattenedGene = flattenGene(gene);
    for (let i = 0; i < count; ++i) {
        const location = chooseIntBetween(0, flattenedGene.length, random);
        if (location === 0) {
            mutateOutput(gene, mutationRates, random);
        } else {
            mutateTree(flattenedGene[location], mutationRates, random);
        }
    }
    return gene;
};

const spliceGenes = (genes, mutationRates, random) => {
    const count = weightedChooseOne(mutationRates.splicesPerGene, random);

    for (let i = 0; i < count; ++i) {
        const type = weightedChooseOne(mutationRates.spliceRates, random);

        if (type === spliceType.delete) {
            if (genes.length > 1) {
                const location = chooseIntBetween(0, genes.length, random);
                genes.splice(location, 1);
            }
        } else if (type === spliceType.duplicate) {
            const location = chooseIntBetween(0, genes.length, random);
            genes.splice(location, 0, genes[location]);
        } else {
            const location = chooseIntBetween(0, genes.length + 1, random);
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
                choose(
                    primaryGenes[i],
                    secondaryGenes[i],
                    primaryParentGeneSelection,
                    random));
        }

        if (length < primaryGenes.length) {
            if (chooseIf(primaryParentGeneSelection, random)) {
                genes.push(...primaryGenes.slice(length));
            }
        } else if (length < secondaryGenes.length) {
            if (!chooseIf(primaryParentGeneSelection, random)) {
                genes.push(...secondaryGenes.slice(length));
            }
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
