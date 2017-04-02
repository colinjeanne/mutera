import { constants, operators } from './constants';

const evaluateTree = (tree, context) => {
    switch (tree.operator) {
    case operators.true:
        return true;

    case operators.boolean:
        return context.booleans[tree.data] || false;

    case operators.variable:
        return context.variables[tree.data] || 0;

    case operators.constant:
        return constants[tree.data];

    case operators.add:
        return evaluateTree(tree.lhs, context) +
            evaluateTree(tree.rhs, context);

    case operators.subtract:
        return evaluateTree(tree.lhs, context) -
            evaluateTree(tree.rhs, context);

    case operators.multiply:
        return evaluateTree(tree.lhs, context) *
            evaluateTree(tree.rhs, context);

    case operators.divide:
        return evaluateTree(tree.lhs, context) /
            evaluateTree(tree.rhs, context);

    case operators.greaterThan:
        return evaluateTree(tree.lhs, context) >
            evaluateTree(tree.rhs, context);

    case operators.lessThan:
        return evaluateTree(tree.lhs, context) <
            evaluateTree(tree.rhs, context);

    case operators.and:
        return evaluateTree(tree.lhs, context) &&
            evaluateTree(tree.rhs, context);

    case operators.or:
        return evaluateTree(tree.lhs, context) ||
            evaluateTree(tree.rhs, context);

    case operators.not:
        return !evaluateTree(tree.lhs, context);
    }

    throw new Error('Unexpected tree operator');
};

export const evaluateGenes = (genes, input) => {
    const output = {};
    output.variables = input ? Object.assign({}, input.variables) : {};
    output.booleans = input ? Object.assign({}, input.booleans) : {};

    genes.forEach(gene => {
        if (evaluateTree(gene.condition, output)) {
            const type = gene.isBoolean ? 'booleans': 'variables';
            output[type][gene.output] = evaluateTree(gene.expression, output);
        }
    });

    return output;
};
