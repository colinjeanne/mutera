import { deserializeDNA, serializeDNA } from './serialization';
import { evaluateGenes } from './evaluation';
import { recombine } from './recombination';

export default class DNA {
    constructor(encodedDNA) {
        this.encodedDNA = encodedDNA;
        ({ header: this.header, genes: this.genes } =
            deserializeDNA(encodedDNA));
    }

    toString() {
        return this.encodedDNA;
    }

    process(input) {
        return evaluateGenes(this.genes, input);
    }

    recombine(other, { mutationRates, random = Math.random }) {
        const genes =
            recombine(this.genes, other.genes, mutationRates, random);
        return new DNA(serializeDNA({ version: 1 }, genes));
    }
}
