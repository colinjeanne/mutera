import { intFromBase64, intToBase64, isBase64 } from './../base64';
import {
    isArithmeticOperator,
    isBooleanConnective,
    isBooleanOperator,
    operators } from './constants';

class InvalidDNA extends Error {
}

const objectValues = o => Object.keys(o).map(key => o[key]);

const parseBoolean = encoded => ({
    operator: operators.boolean,
    data: encoded
});

const encodeBoolean = variable => operators.boolean + variable;

const parseConstant = encoded => ({
    operator: operators.constant,
    data: intFromBase64(encoded)
});

const encodeConstant = value => operators.constant + intToBase64(value);

const parseReal = encoded => ({
    operator: operators.real,
    data: encoded
});

const encodeReal = variable => operators.real + variable;

const isBooleanTree = tree =>
    isBooleanOperator(tree.operator) || isBooleanConnective(tree.operator);

const updateDepths = (tree, initialDepth) => {
    tree.depth = initialDepth;
    if (tree.lhs) {
        updateDepths(tree.lhs, initialDepth + 1);
    }

    if (tree.rhs) {
        updateDepths(tree.rhs, initialDepth + 1);
    }
};

const parseTree = encoded => {
    let operands = [];

    let nextIsBoolean = false;
    let nextIsReal = false;
    let nextIsConstant = false;
    encoded.split('').forEach(c => {
        if (!nextIsConstant && !nextIsReal && !nextIsBoolean) {
            if (c === operators.boolean) {
                nextIsBoolean = true;
            } else if (c === operators.real) {
                nextIsReal = true;
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
        } else if (nextIsBoolean) {
            operands.push(parseBoolean(c));
            nextIsBoolean = false;
        } else if (nextIsConstant) {
            operands.push(parseConstant(c));
            nextIsConstant = false;
        } else if (nextIsReal) {
            operands.push(parseReal(c));
            nextIsReal = false;
        } else {
            throw new Error('Expecting both constant and variable');
        }
    });

    if (operands.length !== 1) {
        throw new InvalidDNA('Unexpected parse results');
    }

    updateDepths(operands[0], 0);
    return operands[0];
};

const encodeTree = tree => {
    if (tree.operator === operators.boolean) {
        return encodeBoolean(tree.data);
    } else if (tree.operator === operators.constant) {
        return encodeConstant(tree.data);
    } else if (tree.operator === operators.real) {
        return encodeReal(tree.data);
    } else if (tree.operator === operators.true) {
        return 'T';
    }

    const encodedLHS = encodeTree(tree.lhs);
    const encodedRHS = tree.rhs ? encodeTree(tree.rhs) : '';
    return encodedLHS + encodedRHS + tree.operator;
};

const parseLength = encoded => {
    const end = encoded.search(/[^0]/);
    if (end === -1) {
        throw new InvalidDNA('Invalid length');
    }

    const lengthValue = intFromBase64(encoded[end]) - (end ? 1 : 0);
    return {
        dataStart: end + 1,
        length: end * 63 + lengthValue
    };
};

const encodeLength = length => {
    // Since nothing can have a zero length we reserve 0 to represent a length
    // greater than or equal to 63.
    const extensions = Math.floor(length / 63);

    // If we have an extension then we must increment this value by 1 so that 0
    // is never used except when counting multiples of 64. This ensures the
    // encoded length always ends in a value other than 0 and so the encoded
    // length is properly delimited from values which themselves may be encoded
    // as 0. Since this value may be incremented by 1, that also precludes the
    // use of `_` in the first character encoding the length as allowing it
    // by dividing and calculating mod by 63 would allow the below value to be
    // set to 64 - an out of range value for the set of base-64 characters.
    const value = (length % 63) + (extensions ? 1 : 0);

    // Replace with String.padStart when available
    let encoded = '';
    for (let i = 0; i < extensions; ++i) {
        encoded += '0';
    }

    return encoded + intToBase64(value);
};

const parseOutput = encoded => {
    if (encoded.length < 2) {
        throw new InvalidDNA('Gene missing output variable');
    }

    const outputType = encoded[0];
    if ((outputType !== operators.boolean) && (outputType !== operators.real)) {
        throw new InvalidDNA('Invalid output type');
    }

    return {
        isBoolean: outputType === operators.boolean,
        variable: encoded[1]
    };
};

const encodeOutput = gene =>
    (gene.isBoolean ? operators.boolean : operators.real) + gene.output;

const parseCondition = encoded => {
    const tree = parseTree(encoded);
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

const parseExpression = parseTree;

const encodeExpression = encodeTree;

const parseGene = encoded => {
    const output = parseOutput(encoded);
    const { dataStart, length } =
        parseLength(encoded.substring(2));

    const end = 2 + dataStart + length;
    if (end > encoded.length) {
        throw new InvalidDNA('Giant condition');
    }

    const expressionStart = encoded.substring(end);
    if (expressionStart === '') {
        throw new InvalidDNA('Gene missing expression');
    }

    const encodedCondition = encoded.substring(2 + dataStart, end);
    const encodedExpression = encoded.substring(end);

    const expression = parseExpression(encodedExpression);
    if (output.isBoolean !== isBooleanTree(expression)) {
        throw new InvalidDNA('Expression type must match output type');
    }

    return {
        isBoolean: output.isBoolean,
        output: output.variable,
        condition: parseCondition(encodedCondition),
        expression
    };
};

const encodeGene = gene => {
    const encodedOutput = encodeOutput(gene);
    const encodedCondition = encodeCondition(gene.condition);
    const encodedExpression = encodeExpression(gene.expression);
    const length = encodedOutput.length +
        encodedCondition.length +
        encodedExpression.length;

    const encodedLength = encodeLength(length);
    return encodedLength +
        encodedOutput +
        encodedCondition +
        encodedExpression;
};

const splitGenes = encoded => {
    const genes = [];
    let start = 0;

    while (start < encoded.length) {
        const { dataStart, length } =
            parseLength(encoded.substring(start));

        const end = start + dataStart + length;
        if (end > encoded.length) {
            throw new InvalidDNA('Gene runt');
        }

        genes.push(encoded.substring(start + dataStart, end));
        start = end;
    }

    return genes;
};

const parseHeader = encoded => {
    const version = encoded[0];
    if (version !== '1') {
        throw new InvalidDNA('Unexpected version');
    }

    return {
        version
    };
};

const encodeHeader = header => header.version;

export const deserializeDNA = encoded => {
    try {
        if (!isBase64(encoded)) {
            throw new InvalidDNA('Encoded DNA is not a base64 string');
        }

        if (encoded.length === 0) {
            throw new InvalidDNA('DNA missing header');
        }

        const encodedHeader = encoded[0];
        const header = parseHeader(encodedHeader);
        const encodedGenes = encoded.substring(1);

        if (encodedGenes.length === 0) {
            throw new InvalidDNA('DNA missing genes');
        }

        const genes = splitGenes(encodedGenes).map(parseGene);

        return {
            header,
            genes
        };
    } catch (e) {
        if (e instanceof InvalidDNA) {
            e.encodedDNA = encoded;
            e.message += `: ${encoded}`;
        }

        throw e;
    }
};

export const serializeDNA = (header, genes) =>
    encodeHeader(header) + genes.map(encodeGene).join('');
