import * as Constants from './constants';

const cloneTree = tree => {
    const clone = {
        operator: tree.operator
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
    gene.output = selector.chooseOutputVariable();
};

const swapChildren = tree => {
    const temp = tree.lhs;
    tree.lhs = tree.rhs;
    tree.rhs = temp;
};

const swapOperator = (tree, selector) => {
    const alternates = Constants.swappableOperators(tree.operator);
    tree.operator = selector.chooseAlternateOperator(alternates);
};

const randomBooleanTree = (selector, depth) => {
    const operator = selector.chooseBooleanOperator(depth);

    const tree = {
        operator
    };

    const arity = Constants.arity(operator);
    if (arity === 1) {
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
    } else if (operator === Constants.operators.variable) {
        tree.data = selector.chooseInputVariable();
    } else {
        tree.lhs = randomArithmeticTree(selector, depth + 1);
        tree.rhs = randomArithmeticTree(selector, depth + 1);
    }

    return tree;
};

const randomGene = selector => ({
    output: selector.chooseOutputVariable(),
    condition: randomBooleanTree(selector, 0),
    expression: randomArithmeticTree(selector, 0)
});

const replaceChild = (tree, selector) => {
    const arity = Constants.arity(tree.operator);
    if (arity === 0) {
        if (tree.operator === Constants.operators.variable) {
            tree.data = selector.chooseInputVariable();
        } else if (tree.operator === Constants.operators.constant) {
            tree.data = selector.chooseConstant();
        } else if (tree.operator === Constants.operators.true) {
            // Do nothing, there is nothing that can be modified here
        } else {
            throw new Error('Unknown operator');
        }
    } else if (arity === 1) {
        tree.lhs = randomBooleanTree(selector, 0);
    } else {
        const child = selector.chooseTreeChild();
        if (!Constants.isBooleanConnective(tree.operator)) {
            tree[child] = randomArithmeticTree(selector, 0);
        } else {
            tree[child] = randomBooleanTree(selector, 0);
        }
    }
};

const mutateTree = (tree, selector) => {
    const mapping = {
        [Constants.mutationType.replaceChild]: replaceChild,
        [Constants.mutationType.swapOperator]: swapOperator,
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
        const type = selector.chooseSpliceType();
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
