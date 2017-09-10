export const chooseBetween = (min, max, random) =>
    (random() * (max - min)) + min;

export const chooseIntBetween = (min, max, random) =>
    Math.floor(chooseBetween(min, max, random));

export const choose = (u, v, probabilityOfU, random) =>
    random() < probabilityOfU ? u : v;

export const weightedChooseOne = (optionsMap, random) => {
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

export const chooseOne = (choices, random) =>
    choices[chooseIntBetween(0, choices.length, random)];

export const chooseIf = (probabilityOfChoice, random) =>
    choose(true, false, probabilityOfChoice, random);
