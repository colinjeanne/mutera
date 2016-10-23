import { constants, operators } from './constants';

const isConditionMet = (condition, context) => {
    switch (condition.operator) {
    case operators.greaterThan:
        return evaluateExpression(condition.lhs, context) >
            evaluateExpression(condition.rhs, context);

    case operators.lessThan:
        return evaluateExpression(condition.lhs, context) <
            evaluateExpression(condition.rhs, context);

    case operators.and:
        return isConditionMet(condition.lhs, context) &&
            isConditionMet(condition.rhs, context);

    case operators.or:
        return isConditionMet(condition.lhs, context) ||
            isConditionMet(condition.rhs, context);

    case operators.not:
        return !isConditionMet(condition.lhs, context);

    case operators.true:
        return true;
    }

    throw new Error('Unexpected condition operator');
};

const evaluateExpression = (expression, context) => {
    switch (expression.operator) {
    case operators.variable:
        return context[expression.data] || 0;

    case operators.constant:
        return constants[expression.data];

    case operators.add:
        return evaluateExpression(expression.lhs, context) +
            evaluateExpression(expression.rhs, context);

    case operators.subtract:
        return evaluateExpression(expression.lhs, context) -
            evaluateExpression(expression.rhs, context);

    case operators.multiply:
        return evaluateExpression(expression.lhs, context) *
            evaluateExpression(expression.rhs, context);

    case operators.divide:
        return evaluateExpression(expression.lhs, context) /
            evaluateExpression(expression.rhs, context);
    }

    throw new Error('Unexpected expression operator');
};

export const evaluateGenes = (genes, input) => {
    let output = Object.assign({}, input);

    genes.forEach(gene => {
        if (isConditionMet(gene.condition, output)) {
            output[gene.output] =
                evaluateExpression(gene.expression, output);
        }
    });

    return output;
};
