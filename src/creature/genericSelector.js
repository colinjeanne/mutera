import { intToBase64 } from './../base64';
import * as Random from './../random';
import { DNA } from './../dna/index';

export default class GenericSelector {
    canReproduce(creature, stateProcessor) {
        const maximumHealth = stateProcessor.getMaximumPropertyValue('health');
        return creature.health > 0.75 * maximumHealth;
    }

    chooseBetween(min, max) {
        return Random.chooseBetween(min, max, Math.random);
    }

    chooseLocation(x, y) {
        // See http://stackoverflow.com/questions/9048095/create-random-number-within-an-annulus
        // Maximum radius = 20
        // Minimum radius = 10
        const normalizer = 1 / 300;
        const distance = Math.sqrt(Math.random() / normalizer + 100);
        const angle = Random.chooseBetween(-Math.PI, Math.PI, Math.random);
        return {
            x: distance * Math.cos(angle) + x,
            y: distance * Math.sin(angle) + y
        };
    }

    createRandomDNA() {
        return DNA.createRandom();
    }

    generateUniqueId() {
        return intToBase64(
            Math.floor(Random.chooseBetween(0, Math.pow(64, 5), Math.random)),
            5);
    }
}
