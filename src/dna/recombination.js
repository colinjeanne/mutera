import * as Constants from './constants';

const cloneTree = tree => {
    const clone = {
        operator: tree.operator,
        depth: tree.depth
    };

    if (tree.lhs) {
        clone.lhs = cloneTree(tree.lhs);
    }

    if (tree.rhs) {
        clone.rhs = cloneTree(tree.rhs);
    }

    if ('data' in tree) {
        clone.data = tree.data;
    }

    return clone;
};

const cloneGene = gene => ({
    isBoolean: gene.isBoolean,
    output: gene.output,
    condition: cloneTree(gene.condition),
    expression: cloneTree(gene.expression)
});

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

const mutateOutput = (gene, selector) => {
    if (gene.isBoolean) {
        gene.output = selector.chooseOutputBoolean();
    } else {
        gene.output = selector.chooseOutputReal();
    }
};

const swapChildren = tree => {
    const temp = tree.lhs;
    tree.lhs = tree.rhs;
    tree.rhs = temp;
};

const replaceTree = (tree, selector) => {
    const alternates = Constants.swappableOperators(tree.operator);
    const operator = selector.chooseAlternateOperator(alternates, tree.depth);
    const canUseChildren = Constants.isBooleanConnective(tree.operator) ===
        Constants.isBooleanConnective(operator);

    const lhs = canUseChildren ? tree.lhs : undefined;
    const rhs = canUseChildren ? tree.rhs : undefined;

    tree.operator = operator;
    tree.lhs = undefined;
    tree.rhs = undefined;
    tree.data = undefined;

    if (tree.operator === Constants.operators.boolean) {
        tree.data = selector.chooseInputBoolean();
    } else if (tree.operator === Constants.operators.constant) {
        tree.data = tree.data = selector.chooseConstant();
    } else if (tree.operator === Constants.operators.real) {
        tree.data = selector.chooseInputReal();
    } else if (tree.operator === Constants.operators.not) {
        tree.lhs = lhs ? lhs : randomBooleanTree(selector, tree.depth + 1);
    } else if (Constants.isBooleanConnective(tree.operator)) {
        tree.lhs = lhs ? lhs : randomBooleanTree(selector, tree.depth + 1);
        tree.rhs = rhs ? rhs : randomBooleanTree(selector, tree.depth + 1);
    } else {
        tree.lhs = lhs ? lhs : randomArithmeticTree(selector, tree.depth + 1);
        tree.rhs = lhs ? rhs : randomArithmeticTree(selector, tree.depth + 1);
    }
};

const randomBooleanTree = (selector, depth) => {
    const operator = selector.chooseBooleanOperator(depth);

    const tree = {
        operator
    };

    const arity = Constants.arity(operator);
    if (operator === Constants.operators.boolean) {
        tree.data = selector.chooseInputBoolean();
    } else if (arity === 1) {
        tree.lhs = randomBooleanTree(selector, depth + 1);
    } else if (arity === 2) {
        const treeGenerator = Constants.isBooleanConnective(operator) ?
            randomBooleanTree :
            randomArithmeticTree;

        tree.lhs = treeGenerator(selector, depth + 1);
        tree.rhs = treeGenerator(selector, depth + 1);
    }

    return tree;
};

const randomArithmeticTree = (selector, depth) => {
    const operator = selector.chooseArithmeticOperator(depth);

    const tree = {
        operator
    };

    if (operator === Constants.operators.constant) {
        tree.data = selector.chooseConstant();
    } else if (operator === Constants.operators.real) {
        tree.data = selector.chooseInputReal();
    } else {
        tree.lhs = randomArithmeticTree(selector, depth + 1);
        tree.rhs = randomArithmeticTree(selector, depth + 1);
    }

    return tree;
};

const randomGene = selector => {
    const isBoolean = selector.chooseGeneIsBoolean();
    const output = isBoolean ?
        selector.chooseOutputBoolean() :
        selector.chooseOutputReal();
    const condition = randomBooleanTree(selector, 0);
    const expression = isBoolean ?
        randomBooleanTree(selector, 0) :
        randomArithmeticTree(selector, 0);

    return {
        isBoolean,
        output,
        condition,
        expression
    };
};

const mutateTree = (tree, selector) => {
    const mapping = {
        [Constants.mutationType.replaceTree]: replaceTree,
        [Constants.mutationType.swapChildren]: swapChildren
    };

    const type = selector.chooseMutationType(tree.operator);
    mapping[type](tree, selector);
};

const mutateGene = (gene, selector) => {
    const count = selector.chooseGeneMutationCount();
    const flattenedGene = flattenGene(gene);
    for (let i = 0; i < count; ++i) {
        const location = selector.chooseLocation(flattenedGene.length);
        if (location === 0) {
            mutateOutput(gene, selector);
        } else {
            mutateTree(flattenedGene[location], selector);
        }
    }
    return gene;
};

const spliceGenes = (genes, selector) => {
    const count = selector.chooseGeneSpliceCount();
    for (let i = 0; i < count; ++i) {
        const type = selector.chooseSpliceType(genes);
        if (type === Constants.spliceType.delete) {
            if (genes.length > 1) {
                const location = selector.chooseLocation(genes.length);
                genes.splice(location, 1);
            }
        } else if (type === Constants.spliceType.duplicate) {
            const location = selector.chooseLocation(genes.length);
            genes.splice(location, 0, genes[location]);
        } else {
            const location = selector.chooseLocation(genes.length + 1);
            genes.splice(location, 0, randomGene(selector));
        }
    }
};

const recombineGenes = (primaryGenes, secondaryGenes, selector) => {
    const genes = [];
    const length = Math.min(primaryGenes.length, secondaryGenes.length);
    for (let i = 0; i < length; ++i) {
        genes.push(selector.chooseGene(primaryGenes[i], secondaryGenes[i]));
    }

    if (length < primaryGenes.length) {
        if (selector.shouldUseRestOfPrimaryGenes()) {
            genes.push(...primaryGenes.slice(length));
        }
    } else if (length < secondaryGenes.length) {
        if (selector.shouldUseRestOfSecondaryGenes()) {
            genes.push(...secondaryGenes.slice(length));
        }
    }

    return genes;
};

export const createRandom = selector => {
    const count = selector.chooseGeneCount();
    const genes = [];

    for (let i = 0; i < count; ++i) {
        genes.push(randomGene(selector));
    }

    return genes;
};

export const recombine = (primaryGenes, secondaryGenes, selector) => {
    const genes = recombineGenes(primaryGenes, secondaryGenes, selector);

    // Mutation will modify a gene in place so clone it first
    const mutated = genes.map(gene => mutateGene(cloneGene(gene), selector));

    spliceGenes(mutated, selector);
    return mutated;
};
