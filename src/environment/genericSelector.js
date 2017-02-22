import { Creature } from './../creature/index';
import * as Random from './../random';

export default class GenericSelector {
    chooseMapLocation(map) {
        return {
            x: Random.chooseBetween(0, map.width, Math.random),
            y: Random.chooseBetween(0, map.height, Math.random)
        };
    }

    createRandomCreature() {
        return Creature.createRandom();
    }

    shouldSpawnFood(elapsedTime) {
        return Random.chooseIf(elapsedTime, Math.random);
    }
}
