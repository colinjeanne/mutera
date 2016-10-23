import {
    base64Values,
    isArithmeticOperator,
    isBooleanConnective,
    isBooleanOperator,
    operators,
    variables } from './constants';

class InvalidDNA extends Error {
}

const objectValues = o => Object.keys(o).map(key => o[key]);

const parseConstant = encodedConstant => {
    const index = base64Values.indexOf(encodedConstant);
    if (index === -1) {
        throw new InvalidDNA('Constant out of range');
    }

    return {
        operator: operators.constant,
        data: index
    };
};

const encodeConstant = value => operators.constant + base64Values[value];

const parseVariable = encodedVariable => {
    if (variables.indexOf(encodedVariable) === -1) {
        throw new InvalidDNA('Unknown variable');
    }

    return {
        operator: operators.variable,
        data: encodedVariable
    };
};

const encodeVariable = variable => operators.variable + variable;

const isBooleanTree = tree =>
    isBooleanOperator(tree.operator) || isBooleanConnective(tree.operator);

const parseTree = encodedTree => {
    let operands = [];

    let nextIsVariable = false;
    let nextIsConstant = false;
    encodedTree.split('').forEach(c => {
        if (!nextIsConstant && !nextIsVariable) {
            if (c === operators.variable) {
                nextIsVariable = true;
            } else if (c === operators.constant) {
                nextIsConstant = true;
            } else if (c === operators.true) {
                operands.push({
                    operator: c
                });
            } else if (c === operators.not) {
                if (operands.length < 1) {
                    throw new InvalidDNA('Unexpected operator');
                }

                const lhs = operands.pop();
                if (!isBooleanTree(lhs)) {
                    throw new InvalidDNA(
                        'Boolean connectives must operate on boolean trees');
                }

                operands.push({
                    operator: c,
                    lhs
                });
            } else if (objectValues(operators).indexOf(c) !== -1) {
                if (operands.length < 2) {
                    throw new InvalidDNA('Unexpected operator');
                }

                const rhs = operands.pop();
                const lhs = operands.pop();
                if (isArithmeticOperator(c) &&
                    (isBooleanTree(lhs) || isBooleanTree(rhs))) {
                    throw new InvalidDNA(
                        'Arithmetic operator cannot operate the result of ' +
                        'boolean operators');
                }

                if (isBooleanConnective(c) &&
                    (!isBooleanTree(lhs) || !isBooleanTree(rhs))) {
                    throw new InvalidDNA(
                        'Boolean connectives must operate on boolean trees');
                }

                operands.push({
                    operator: c,
                    rhs,
                    lhs
                });
            } else {
                throw new InvalidDNA('Unexpected token');
            }
        } else if (nextIsConstant) {
            operands.push(parseConstant(c));
            nextIsConstant = false;
        } else if (nextIsVariable) {
            operands.push(parseVariable(c));
            nextIsVariable = false;
        } else {
            throw new Error('Expecting both constant and variable');
        }
    });

    if (operands.length !== 1) {
        throw new InvalidDNA('Unexpected parse results');
    }

    return operands[0];
};

const encodeTree = tree => {
    if (tree.operator === operators.constant) {
        return encodeConstant(tree.data);
    } else if (tree.operator === operators.variable) {
        return encodeVariable(tree.data);
    } else if (tree.operator === operators.true) {
        return 'T';
    }

    const encodedLHS = encodeTree(tree.lhs);
    const encodedRHS = tree.rhs ? encodeTree(tree.rhs) : '';
    return encodedLHS + encodedRHS + tree.operator;
};

const parseLength = encodedData => {
    const end = encodedData.search(/[^0]/);
    if (end > 10) {
        throw new InvalidDNA('Giant length');
    } else if (end === -1) {
        throw new InvalidDNA('Invalid length');
    }

    const lengthValue = base64Values.indexOf(encodedData[end]);
    if (lengthValue === -1) {
        throw new InvalidDNA('Invalid length');
    }

    return {
        dataStart: end + 1,
        length: end * 63 + lengthValue
    };
};

const encodeLength = length => {
    const extensions = Math.floor(length / 63);
    const value = length % 63;

    // Replace with String.padStart when available
    let encoded = '';
    for (let i = 0; i < extensions; ++i) {
        encoded += '0';
    }

    return encoded + base64Values[value];
};

const parseCondition = encodedCondition => {
    const tree = parseTree(encodedCondition);
    if (!isBooleanTree(tree)) {
        throw new InvalidDNA('Condition must be boolean');
    }

    return tree;
};

const encodeCondition = condition => {
    const encodedTree = encodeTree(condition);
    const encodedLength = encodeLength(encodedTree.length);
    return encodedLength + encodedTree;
};

const parseExpression = encodedExpression => {
    const tree = parseTree(encodedExpression);
    if (!isArithmeticOperator(tree.operator)) {
        throw new InvalidDNA(
            'Expression must only contain arithmetic operators');
    }

    return tree;
};

const encodeExpression = encodeTree;

const parseGene = encodedGene => {
    const output = encodedGene[0];
    if (variables.indexOf(output) === -1) {
        throw new InvalidDNA('Unknown variable in gene');
    }

    const { dataStart, length } =
        parseLength(encodedGene.substring(1));

    const end = 1 + dataStart + length;
    if (end > encodedGene.length) {
        throw new InvalidDNA('Giant condition');
    }

    const expressionStart = encodedGene.substring(end);
    if (expressionStart === '') {
        throw new InvalidDNA('Gene missing expression');
    }

    const encodedCondition = encodedGene.substring(1 + dataStart, end);
    const encodedExpression = encodedGene.substring(end);

    return {
        output,
        condition: parseCondition(encodedCondition),
        expression: parseExpression(encodedExpression)
    };
};

const encodeGene = gene => {
    const encodedCondition = encodeCondition(gene.condition);
    const encodedExpression = encodeExpression(gene.expression);
    const length = gene.output.length +
        encodedCondition.length +
        encodedExpression.length;

    const encodedLength = encodeLength(length);
    return encodedLength +
        gene.output +
        encodedCondition +
        encodedExpression;
};

const splitGenes = encodedGenes => {
    const genes = [];
    let start = 0;

    while (start < encodedGenes.length) {
        const { dataStart, length } =
            parseLength(encodedGenes.substring(start));

        const end = start + dataStart + length;
        if (end > encodedGenes.length) {
            throw new InvalidDNA('Gene runt');
        }

        genes.push(encodedGenes.substring(start + dataStart, end));
        start = end;
    }

    return genes;
};

const parseHeader = encodedHeader => {
    const version = encodedHeader[0];
    if (version !== '1') {
        throw new InvalidDNA('Unexpected version');
    }

    return {
        version
    };
};

const encodeHeader = header => header.version;

export const deserializeDNA = encodedDNA => {
    if (encodedDNA.length === 0) {
        throw new InvalidDNA('DNA missing header');
    }

    const encodedHeader = encodedDNA[0];
    const header = parseHeader(encodedHeader);
    const encodedGenes = encodedDNA.substring(1);

    if (encodedGenes.length === 0) {
        throw new InvalidDNA('DNA missing genes');
    }

    const genes = splitGenes(encodedGenes).map(parseGene);

    return {
        header,
        genes
    };
};

export const serializeDNA = (header, genes) =>
    encodeHeader(header) + genes.map(encodeGene).join('');
