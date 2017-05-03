import GenericSelector from './genericSelector';
import { squareDistance } from './../geometry';
import * as KnownVariables from './../knownVariables';

const defaultOptions = {
    eatRadius: 20,
    foodHealth: 500,
    generationTimeLength: 30,
    minimumCreatures: 100
};

const compareSquareDistance = (a, b) => a.squareDistance - b.squareDistance;

const dataIsVisible = data =>
    data.leftPeriphery ||
    data.rightPeriphery ||
    data.focus;

const nearestVisibleFood = (creature, foodLocations) => {
    const visibleLocations = foodLocations.
        map(point => ({
            canSee: creature.canSee(point),
            point
        })).
        filter(foodLocation => dataIsVisible(foodLocation.canSee));

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

const nearestVisibleCreatures = relationships => {
    const orderedRelations = Array.from(relationships.entries()).
        map(([id, relation]) => ({
            id,
            squareDistance: relation.squareDistance,
            visible: relation.visible
        })).
        sort(compareSquareDistance);

    let leftCreature = orderedRelations.find(relation =>
        relation.visible.leftPeriphery);
    if (leftCreature) {
        leftCreature.distance = Math.sqrt(leftCreature.squareDistance);
    }

    let rightCreature = orderedRelations.find(relation =>
        relation.visible.rightPeriphery);
    if (rightCreature) {
        rightCreature.distance = Math.sqrt(rightCreature.squareDistance);
    }

    let focusCreature = orderedRelations.find(relation =>
        relation.visible.focus);
    if (focusCreature) {
        focusCreature.distance = Math.sqrt(focusCreature.squareDistance);
    }

    return {
        leftCreature,
        rightCreature,
        focusCreature
    };
};

const totalAudioEffects = (relationships, creatures) =>
    Array.from(relationships.entries()).
        filter(([id]) => !creatures.get(id).isDead()).
        map(([, relation]) => relation.audioEffect).
        reduce((totalEffects, effect) => {
            totalEffects.front += effect.front;
            totalEffects.left += effect.left;
            totalEffects.back += effect.back;
            totalEffects.right += effect.right;
            return totalEffects;
        },
        {
            front: 0,
            left: 0,
            back: 0,
            right: 0
        });

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
        const relations = new Map();
        this.creatures.forEach(creature => {
            const relationships = new Map();
            this.creatures.forEach(other => {
                if (other !== creature) {
                    const distance = squareDistance(creature, other);
                    relationships.set(other.id, {
                        squareDistance: distance,
                        overlapping: distance <= 100,
                        visible: creature.canSee(other),
                        audioEffect: creature.hear(other)
                    });
                }
            });

            relations.set(creature.id, relationships);
        });

        relations.forEach((relationships, id) => {
            const creature = this.creatures.get(id);
            relationships.forEach((relation, otherId) => {
                if (relation.overlapping) {
                    const otherCreature = this.creatures.get(otherId);
                    const otherRelationship = relations.get(otherId).get(id);

                    const canSeeOther = dataIsVisible(relation.visible);
                    const canAttack = canSeeOther && creature.isAggressive;

                    const canOtherSee = dataIsVisible(otherRelationship.visible);
                    const canBeAttacked = canOtherSee &&
                        otherCreature.isAggressive;

                    if (canAttack && !canBeAttacked) {
                        creature.feed(
                            Math.min(
                                this.options.foodHealth,
                                otherCreature.health));
                    } else if (canBeAttacked) {
                        creature.harm(this.options.foodHealth);
                    }
                }
            });
        });

        const deadCreatures = [];
        this.creatures.forEach(creature => {
            if (creature.isDead()) {
                deadCreatures.push(creature.id);
            }
        });

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

            const relationships = relations.get(creature.id);
            const nearestCreatures = nearestVisibleCreatures(
                relationships,
                this.creatures);

            [
                ['left', 'Left'],
                ['right', 'Right'],
                ['focus', 'Focus']
            ].forEach(data => {
                const nearest = nearestCreatures[`${data[0]}Creature`];
                const rootName = `nearest${data[1]}Creature`;
                const distanceVariable = KnownVariables[`${rootName}Distance`];

                const colors = [
                    [`${rootName}IsRed`, 'isRed'],
                    [`${rootName}IsGreen`, 'isGreen'],
                    [`${rootName}IsBlue`, 'isBlue']
                ];

                if (nearest) {
                    const nearestCreature = this.creatures.get(nearest.id);
                    input.variables[distanceVariable] = nearest.distance;
                    colors.forEach(color => {
                        input.booleans[KnownVariables[color[0]]] =
                            nearestCreature[color[1]];
                    });
                } else {
                    input.variables[distanceVariable] = -1;
                    colors.forEach(color => {
                        input.booleans[KnownVariables[color[0]]] = false;
                    });
                }
            });

            const audioEffects = totalAudioEffects(
                relationships,
                this.creatures);

            [
                ['front', KnownVariables.frontSound],
                ['left', KnownVariables.leftSound],
                ['back', KnownVariables.backSound],
                ['right', KnownVariables.rightSound]
            ].forEach(([property, variable]) => {
                input.variables[variable] = audioEffects[property];
            });

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
