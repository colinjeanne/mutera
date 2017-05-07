import { Creature } from './../creature/index';
import * as Random from './../random';

const defaultOptions = {
    aggressivePartnerMateRate: 0.3,
    foodGrowthPerTime: 10,
    maximumFood: 50,
    neutralPartnerMateRate: 0.75
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

    createRandomCreature({ isCarnivore }) {
        return Creature.createRandom({ isCarnivore });
    }

    deserializeCreature(encodedCreature) {
        return new Creature(encodedCreature);
    }

    isMateSuccessful(initiator, other) {
        if (initiator.shouldReproduceSexually &&
            other.shouldReproduceSexually) {
            return true;
        }

        if (other.isAggressive) {
            return Random.chooseIf(
                this.options.aggressivePartnerMateRate,
                Math.random);
        }

        return Random.chooseIf(
            this.options.neutralPartnerMateRate,
            Math.random);
    }

    shouldSpawnFood(map, elapsedTime) {
        if (map.foodLocations.length > this.options.maximumFood) {
            return false;
        }

        return Random.chooseIf(elapsedTime, this.randomFood);
    }
}
