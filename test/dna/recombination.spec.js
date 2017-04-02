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

        const encodedPrimary = '16Va1TC06Vb1TC16Vc1TC2';
        const encodedSecondary = '16Vd1TV06Ve1TV16Vf1TV2';
        const expected = '16Va1TC06Vb1TC16Vf1TV2';
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

        const encodedPrimary = '16Va1TC06Vb1TC16Vc1TC2';
        const encodedSecondary = '16Vd1TV0';
        const expected = '16Vd1TV06Vb1TC16Vc1TC2';
        validate(encodedPrimary, encodedSecondary, selector, expected);
    });

    it('can choose excess genes from the secondary', function() {
        const selector = new MockSelector({
            shouldUseRestOfSecondaryGenes() {
                return true;
            }
        });

        const encodedPrimary = '16Va1TC0';
        const encodedSecondary = '16Vd1TV06Ve1TV16Vf1TV2';
        const expected = '16Va1TC06Ve1TV16Vf1TV2';
        validate(encodedPrimary, encodedSecondary, selector, expected);
    });

    it('can ignore excess genes from the primary', function() {
        const selector = new MockSelector();

        const encodedPrimary = '16Va1TC06Vb1TC16Vc1TC2';
        const encodedSecondary = '16Vd1TV0';
        const expected = '16Va1TC0';
        validate(encodedPrimary, encodedSecondary, selector, expected);
    });

    it('can ignore excess genes from the secondary', function() {
        const selector = new MockSelector({
            chooseGene() {
                return 'secondary';
            }
        });

        const encodedPrimary = '16Va1TC0';
        const encodedSecondary = '16Vd1TV06Ve1TV16Vf1TV2';
        const expected = '16Vd1TV0';
        validate(encodedPrimary, encodedSecondary, selector, expected);
    });
});
