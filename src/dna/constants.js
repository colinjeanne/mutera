export const operators = {
    greaterThan: 'G',
    lessThan: 'L',
    and: 'A',
    or: 'O',
    not: 'N',
    true: 'T',
    variable: 'V',
    constant: 'C',
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
        operators.variable,
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
    operators.constant,
    operators.true,
    operators.variable
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

const operatorType = operator =>
    Object.keys(operatorsByType).find(type =>
        operatorsByType[type].indexOf(operator) !== -1);

export const selectOperators = (type, operatorArity) =>
    operatorsByType[type].filter(op => arity(op) === operatorArity);

export const swappableOperators = operator => {
    // Don't allow variable and constants to be swapped because the set of
    // variables may be restricted while the set of constants is not.
    const unswappable = [
        operators.constant,
        operators.variable
    ];

    if (unswappable.indexOf(operator) !== -1) {
        return operator;
    }

    return selectOperators(operatorType(operator), arity(operator));
};

export const base64Values =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

export const variables = base64Values;

export const constants = (() => {
    const values = [];
    for (let i = -4; i < 4; i += 1/8) {
        values.push(i);
    }
    return values;
})();
