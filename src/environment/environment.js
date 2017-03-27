import GenericSelector from './genericSelector';
import * as KnownVariables from './../knownVariables';

const defaultOptions = {
    eatRadius: 20,
    foodHealth: 500,
    generationTimeLength: 30,
    minimumCreatures: 100
};

const squareDistance = (a, b) =>
    (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);

const compareSquareDistance = (a, b) => a.squareDistance - b.squareDistance;

const nearestVisibleFood = (creature, foodLocations) => {
    const visibleLocations = foodLocations.
        map(point => ({
            canSee: creature.canSee(point),
            point
        })).
        filter(data => {
            return data.canSee.leftPeriphery ||
                data.canSee.rightPeriphery ||
                data.canSee.focus;
        });

    visibleLocations.forEach(data => {
        data.squareDistance = squareDistance(data.point, creature);
    });

    if (visibleLocations.length === 0) {
        return {};
    }

    const leftPeripheryLocations = visibleLocations.
        filter(data => data.canSee.leftPeriphery).
        sort(compareSquareDistance);

    let leftPeripheryFood = null;
    if (leftPeripheryLocations.length !== 0) {
        leftPeripheryFood = leftPeripheryLocations[0];
        leftPeripheryFood.distance =
            Math.sqrt(leftPeripheryFood.squareDistance);
    }

    const rightPeripheryLocations = visibleLocations.
        filter(data => data.canSee.rightPeriphery).
        sort(compareSquareDistance);

    let rightPeripheryFood = null;
    if (rightPeripheryLocations.length !== 0) {
        rightPeripheryFood = rightPeripheryLocations[0];
        rightPeripheryFood.distance =
            Math.sqrt(rightPeripheryFood.squareDistance);
    }

    const focusLocations = visibleLocations.
        filter(data => data.canSee.focus).
        sort(compareSquareDistance);

    let focusFood = null;
    if (focusLocations.length !== 0) {
        focusFood = focusLocations[0];
        focusFood.distance = Math.sqrt(focusFood.squareDistance);
    }

    return {
        leftPeripheryFood,
        rightPeripheryFood,
        focusFood
    };
};

export default class Environment {
    constructor(map, creatures, selector = new GenericSelector(), options = {}) {
        this.map = map;
        this.creatures = creatures;
        this.options = Object.assign(
            {},
            defaultOptions,
            options);
        this.selector = selector;
        this.generationTime = 0;
        this.generationCount = 0;

        this.genealogy = new Map();
    }

    get fittest() {
        return Array.from(this.creatures.values()).
            sort((a, b) => {
                if (a.age > b.age) {
                    return -1;
                } else if (b.age > a.age) {
                    return 1;
                } else if (a.health > b.health) {
                    return -1;
                } else if (b.health > a.health) {
                    return 1;
                }

                return 0;
            });
    }

    process(elapsedTime) {
        const deadCreatures = [];
        this.creatures.forEach((creature, id) => {
            const input = {};

            const nearestFood =
                nearestVisibleFood(creature, this.map.foodLocations);
            if (nearestFood.leftPeripheryFood) {
                input[KnownVariables.nearestLeftPeripheryFoodDistance] =
                    nearestFood.leftPeripheryFood.distance;
            } else {
                input[KnownVariables.nearestLeftPeripheryFoodDistance] = -1;
            }

            if (nearestFood.rightPeripheryFood) {
                input[KnownVariables.nearestRightPeripheryFoodDistance] =
                    nearestFood.rightPeripheryFood.distance;
            } else {
                input[KnownVariables.nearestRightPeripheryFoodDistance] = -1;
            }

            if (nearestFood.focusFood) {
                input[KnownVariables.nearestFocusFoodDistance] =
                    nearestFood.focusFood.distance;
            } else {
                input[KnownVariables.nearestFocusFoodDistance] = -1;
            }

            creature.process(input, elapsedTime);

            if (creature.isDead()) {
                deadCreatures.push(id);
            } else {
                [
                    nearestFood.leftPeripheryFood,
                    nearestFood.rightPeripheryFood,
                    nearestFood.focusFood
                ].
                filter(food => food && food.distance < this.options.eatRadius).
                forEach(food => {
                    creature.feed(this.options.foodHealth);

                    this.map.foodLocations = this.map.foodLocations.filter(
                        location =>
                            (location.x !== food.point.x) &&
                            (location.y !== food.point.y));
                });
            }
        });

        deadCreatures.forEach(id => this.creatures.delete(id));

        if (this.selector.shouldSpawnFood(this.map, elapsedTime)) {
            const location = this.selector.chooseMapLocation(this.map);
            this.map.foodLocations.push(location);
        }

        this.generationTime += elapsedTime;
        if (this.generationTime > this.options.generationTimeLength) {
            // Choose the two oldest creatures. Mate them with each other and
            // with themselves.
            const fittest = this.fittest.filter(
                creature => creature.canReproduce());

            const oldest = fittest.length ? fittest[0] : null;
            const secondOldest = (fittest.length > 1) ? fittest[1] : null;

            if (oldest) {
                const oldestMutation = oldest.recombine(oldest);
                this.creatures.set(oldestMutation.id, oldestMutation);

                if (!this.genealogy.has(oldest.id)) {
                    this.genealogy.set(oldest.id, []);
                }

                this.genealogy.get(oldest.id).push(oldestMutation.id);

                if (secondOldest) {
                    const recombined = oldest.recombine(secondOldest);
                    this.creatures.set(recombined.id, recombined);

                    if (!this.genealogy.has(secondOldest.id)) {
                        this.genealogy.set(secondOldest.id, []);
                    }

                    const secondOldestMutation =
                        secondOldest.recombine(secondOldest);
                    this.creatures.set(
                        secondOldestMutation.id,
                        secondOldestMutation);

                    this.genealogy.get(oldest.id).push(recombined.id);
                    this.genealogy.get(secondOldest.id).push(recombined.id);
                    this.genealogy.get(secondOldest.id).push(
                        secondOldestMutation.id);
                }
            }

            // Make sure the minimum number of creatures is met
            while (this.creatures.size < this.options.minimumCreatures) {
                const creature = this.selector.createRandomCreature();
                this.creatures.set(creature.id, creature);
            }

            this.generationTime = 0;
            ++this.generationCount;
        }
    }

    toJSON() {
        return {
            map: this.map,
            creatures: Array.from(this.creatures.values()).
                map(creature => creature.toString()),
            generationCount: this.generationCount
        };
    }
}
