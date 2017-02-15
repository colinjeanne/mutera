const expect = require('chai').expect;
const DNA = require('./../../umd/world.js').DNA;
const MockSelector = require('./mockSelector.js').default;

describe('Recombination', function() {
    const validate =
        (encodedPrimary, encodedSecondary, selector, expected) => {
            const primary = new DNA.DNA(encodedPrimary, selector);
            const secondary = new DNA.DNA(encodedSecondary, selector);
            const child = primary.recombine(secondary);

            expect(child.toString()).to.equal(expected);
        };

    it('chooses genes from each parent according to the specified probability', function() {
        const geneSelector = ['primary', 'primary', 'secondary'];
        const selector = new MockSelector({
            chooseGene() {
                return geneSelector.shift();
            }
        });

        const encodedPrimary = '15a1TC05b1TC15c1TC2';
        const encodedSecondary = '15d1TV05e1TV15f1TV2';
        const expected = '15a1TC05b1TC15f1TV2';
        validate(encodedPrimary, encodedSecondary, selector, expected);
    });

    it('can choose excess genes from the primary', function() {
        const selector = new MockSelector({
            chooseGene() {
                return 'secondary';
            },

            shouldUseRestOfPrimaryGenes() {
                return true;
            }
        });

        const encodedPrimary = '15a1TC05b1TC15c1TC2';
        const encodedSecondary = '15d1TV0';
        const expected = '15d1TV05b1TC15c1TC2';
        validate(encodedPrimary, encodedSecondary, selector, expected);
    });

    it('can choose excess genes from the secondary', function() {
        const selector = new MockSelector({
            shouldUseRestOfSecondaryGenes() {
                return true;
            }
        });

        const encodedPrimary = '15a1TC0';
        const encodedSecondary = '15d1TV05e1TV15f1TV2';
        const expected = '15a1TC05e1TV15f1TV2';
        validate(encodedPrimary, encodedSecondary, selector, expected);
    });

    it('can ignore excess genes from the primary', function() {
        const selector = new MockSelector();

        const encodedPrimary = '15a1TC05b1TC15c1TC2';
        const encodedSecondary = '15d1TV0';
        const expected = '15a1TC0';
        validate(encodedPrimary, encodedSecondary, selector, expected);
    });

    it('can ignore excess genes from the secondary', function() {
        const selector = new MockSelector({
            chooseGene() {
                return 'secondary';
            }
        });

        const encodedPrimary = '15a1TC0';
        const encodedSecondary = '15d1TV05e1TV15f1TV2';
        const expected = '15d1TV0';
        validate(encodedPrimary, encodedSecondary, selector, expected);
    });
});
