export const operators = {
    greaterThan: 'G',
    lessThan: 'L',
    and: 'A',
    or: 'O',
    not: 'N',
    true: 'T',
    real: 'R',
    constant: 'C',
    boolean: 'B',
    add: 'P',
    subtract: 'S',
    multiply: 'M',
    divide: 'D'
};

export const operatorTypes = {
    arithmetic: 0,
    booleanConnective: 1,
    booleanOperator: 2,
    boolean: 3
};

const operatorsByType = {
    [operatorTypes.arithmetic]: [
        operators.real,
        operators.constant,
        operators.add,
        operators.subtract,
        operators.multiply,
        operators.divide
    ],

    [operatorTypes.booleanConnective]: [
        operators.and,
        operators.or,
        operators.not
    ],

    [operatorTypes.booleanOperator]: [
        operators.boolean,
        operators.greaterThan,
        operators.lessThan,
        operators.true
    ]
};

operatorsByType[operatorTypes.boolean] = [
    ...operatorsByType[operatorTypes.booleanConnective],
    ...operatorsByType[operatorTypes.booleanOperator]
];

export const isArithmeticOperator = operator =>
    operatorsByType[operatorTypes.arithmetic].indexOf(operator) !== -1;

export const isBooleanOperator = operator =>
    operatorsByType[operatorTypes.booleanOperator].indexOf(operator) !== -1;

export const isBooleanConnective = operator =>
    operatorsByType[operatorTypes.booleanConnective].indexOf(operator) !== -1;

const nullaryOperators = [
    operators.boolean,
    operators.constant,
    operators.true,
    operators.real
];

const unaryOperators = [
    operators.not
];

export const arity = operator => {
    if (nullaryOperators.indexOf(operator) !== -1) {
        return 0;
    } else if (unaryOperators.indexOf(operator) !== -1) {
        return 1;
    }

    return 2;
};

export const selectOperators = (type, operatorArity) =>
    operatorsByType[type].filter(op => arity(op) === operatorArity);

export const swappableOperators = operator => (isArithmeticOperator(operator) ?
    operatorsByType[operatorTypes.arithmetic] :
    operatorsByType[operatorTypes.boolean]);

export const constants = (() => {
    const values = [];
    for (let i = -4; i < 4; i += 1/8) {
        values.push(i);
    }
    return values;
})();

export const spliceType = {
    delete: 'delete',
    duplicate: 'duplicate',
    insert: 'insert'
};

export const mutationType = {
    replaceTree: 'replaceTree',
    swapChildren: 'swapChildren'
};
