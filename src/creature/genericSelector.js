import { intToBase64 } from './../base64';
import * as Random from './../random';
import { DNA } from './../dna/index';

export default class GenericSelector {
    chooseAnatomy(primaryAnatomy, secondaryAnatomy) {
        return {
            body: Random.chooseOne(
                [
                    primaryAnatomy.body,
                    secondaryAnatomy.body
                ],
                Math.random),
            eyes: Random.chooseOne(
                [
                    primaryAnatomy.eyes,
                    secondaryAnatomy.eyes
                ],
                Math.random),
            legs: Random.chooseOne(
                [
                    primaryAnatomy.legs,
                    secondaryAnatomy.legs
                ],
                Math.random),
            mouth: Random.chooseOne(
                [
                    primaryAnatomy.mouth,
                    secondaryAnatomy.mouth
                ],
                Math.random)
        };
    }

    chooseBetween(min, max) {
        return Random.chooseBetween(min, max, Math.random);
    }

    chooseIntBetween(min, max) {
        return Random.chooseIntBetween(min, max, Math.random);
    }

    createRandomDNA() {
        return DNA.createRandom();
    }

    generateUniqueId() {
        return intToBase64(
            Math.floor(Random.chooseBetween(0, Math.pow(64, 5), Math.random)),
            5);
    }

    shouldUsePrimaryAnatomy() {
        return Random.chooseIf(0.5, Math.random);
    }
}
