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

const dataIsVisible = data =>
    data.canSee.leftPeriphery ||
    data.canSee.rightPeriphery ||
    data.canSee.focus;

const nearestVisibleFood = (creature, foodLocations) => {
    const visibleLocations = foodLocations.
        map(point => ({
            canSee: creature.canSee(point),
            point
        })).
        filter(dataIsVisible);

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

const nearestVisibleCreatures = (creature, creatures) => {
    const visibleLocations = Array.from(creatures.values()).
        filter(other => other.id !== creature.id).
        map(other => ({
            canSee: creature.canSee(other),
            creature: other
        })).
        filter(dataIsVisible);

    visibleLocations.forEach(data => {
        data.squareDistance = squareDistance(data.creature, creature);
    });

    if (visibleLocations.length === 0) {
        return {};
    }

    const visibleOverlapping = visibleLocations.
        filter(data => data.squareDistance <= 100).
        map(data => data.creature);

    const leftPeripheryLocations = visibleLocations.
        filter(data => data.canSee.leftPeriphery).
        sort(compareSquareDistance);

    let leftPeripheryCreature = null;
    if (leftPeripheryLocations.length !== 0) {
        leftPeripheryCreature = leftPeripheryLocations[0];
        leftPeripheryCreature.distance =
            Math.sqrt(leftPeripheryCreature.squareDistance);
    }

    const rightPeripheryLocations = visibleLocations.
        filter(data => data.canSee.rightPeriphery).
        sort(compareSquareDistance);

    let rightPeripheryCreature = null;
    if (rightPeripheryLocations.length !== 0) {
        rightPeripheryCreature = rightPeripheryLocations[0];
        rightPeripheryCreature.distance =
            Math.sqrt(rightPeripheryCreature.squareDistance);
    }

    const focusLocations = visibleLocations.
        filter(data => data.canSee.focus).
        sort(compareSquareDistance);

    let focusCreature = null;
    if (focusLocations.length !== 0) {
        focusCreature = focusLocations[0];
        focusCreature.distance = Math.sqrt(focusCreature.squareDistance);
    }

    return {
        leftPeripheryCreature,
        rightPeripheryCreature,
        focusCreature,
        visibleOverlapping
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
            if (deadCreatures.includes(id)) {
                return;
            }

            const input = {
                booleans: {},
                variables: {}
            };

            const nearestFood =
                nearestVisibleFood(creature, this.map.foodLocations);
            if (nearestFood.leftPeripheryFood) {
                input.variables[KnownVariables.nearestLeftPeripheryFoodDistance] =
                    nearestFood.leftPeripheryFood.distance;
            } else {
                input.variables[KnownVariables.nearestLeftPeripheryFoodDistance] = -1;
            }

            if (nearestFood.rightPeripheryFood) {
                input.variables[KnownVariables.nearestRightPeripheryFoodDistance] =
                    nearestFood.rightPeripheryFood.distance;
            } else {
                input.variables[KnownVariables.nearestRightPeripheryFoodDistance] = -1;
            }

            if (nearestFood.focusFood) {
                input.variables[KnownVariables.nearestFocusFoodDistance] =
                    nearestFood.focusFood.distance;
            } else {
                input.variables[KnownVariables.nearestFocusFoodDistance] = -1;
            }

            const nearestCreatures = nearestVisibleCreatures(
                creature,
                this.creatures);

            if (nearestCreatures.leftPeripheryCreature) {
                input.variables[KnownVariables.nearestLeftPeripheryCreatureDistance] =
                    nearestCreatures.leftPeripheryCreature.distance;
                input.variables[KnownVariables.nearestLeftPeripheryCreatureColor] =
                    nearestCreatures.leftPeripheryCreature.color;
            } else {
                input.variables[KnownVariables.nearestLeftPeripheryCreatureDistance] = -1;
                input.variables[KnownVariables.nearestLeftPeripheryCreatureColor] = -1;
            }

            if (nearestCreatures.rightPeripheryCreature) {
                input.variables[KnownVariables.nearestRightPeripheryCreatureDistance] =
                    nearestCreatures.rightPeripheryCreature.distance;
                input.variables[KnownVariables.nearestRightPeripheryCreatureColor] =
                    nearestCreatures.rightPeripheryCreature.color;
            } else {
                input.variables[KnownVariables.nearestRightPeripheryCreatureDistance] =
                    -1;
                input.variables[KnownVariables.nearestRightPeripheryCreatureColor] = -1;
            }

            if (nearestCreatures.focusCreature) {
                input.variables[KnownVariables.nearestFocusPeripheryCreatureDistance] =
                    nearestCreatures.focusCreature.distance;
                input.variables[KnownVariables.nearestFocusPeripheryCreatureColor] =
                    nearestCreatures.focusCreature.color;
            } else {
                input.variables[KnownVariables.nearestFocusPeripheryCreatureDistance] =
                    -1;
                input.variables[KnownVariables.nearestFocusPeripheryCreatureColor] = -1;
            }

            if (nearestCreatures.visibleOverlapping) {
                nearestCreatures.visibleOverlapping.forEach(other => {
                    creature.feed(
                        Math.min(other.health, this.options.foodHealth));
                    other.harm(this.options.foodHealth);
                    if (other.isDead()) {
                        deadCreatures.push(other.id);
                    }
                });
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
