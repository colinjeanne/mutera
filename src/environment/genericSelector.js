import { Creature } from './../creature/index';
import * as Random from './../random';

const defaultOptions = {
    foodGrowthPerTime: 10,
    maximumFood: 50
};

export default class GenericSelector {
    constructor(options = {}) {
        this.options = Object.assign({}, defaultOptions, options);
        this.randomFood = () =>
            (Math.random() / this.options.foodGrowthPerTime);
    }

    chooseMapLocation(map) {
        return {
            x: Random.chooseBetween(0, map.width, Math.random),
            y: Random.chooseBetween(0, map.height, Math.random)
        };
    }

    createRandomCreature() {
        return Creature.createRandom();
    }

    shouldSpawnFood(map, elapsedTime) {
        if (map.foodLocations.length > this.options.maximumFood) {
            return false;
        }

        return Random.chooseIf(elapsedTime, this.randomFood);
    }
}
