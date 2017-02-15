import { deserializeDNA, serializeDNA } from './serialization';
import { evaluateGenes } from './evaluation';
import { createRandom, recombine } from './recombination';
import GenericSelector from './genericSelector';

export default class DNA {
    constructor(encodedDNA, selector = new GenericSelector()) {
        this.encodedDNA = encodedDNA;
        this.selector = selector;
        ({ header: this.header, genes: this.genes } =
            deserializeDNA(encodedDNA));
    }

    toString() {
        return this.encodedDNA;
    }

    process(input) {
        return evaluateGenes(this.genes, input);
    }

    recombine(other) {
        const genes = recombine(this.genes, other.genes, this.selector);
        return new DNA(serializeDNA({ version: '1' }, genes));
    }

    static createRandom(selector = new GenericSelector()) {
        const genes = createRandom(selector);
        return new DNA(serializeDNA({ version: '1' }, genes));
    }
}
