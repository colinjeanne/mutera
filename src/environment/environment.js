import GenericSelector from './genericSelector';
import { squareDistance } from './../geometry';
import * as KnownVariables from './../knownVariables';

const defaultOptions = {
    eatRadius: 20,
    eggGestationTime: 300,
    foodHealth: 500,
    minimumCreatures: 100,
    reproductionCooldownTime: 100
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
        this.map = {
            eggs: map.eggs.map(egg => ({
                creature: selector.deserializeCreature(egg.creature),
                elapsedGestationTime: egg.elapsedGestationTime,
                gestationTime: egg.gestationTime
            })),
            foodLocations: map.foodLocations,
            height: map.height,
            width: map.width
        };
        this.creatures = creatures;
        this.reproductionCooldown = new Map();
        this.options = Object.assign(
            {},
            defaultOptions,
            options);
        this.selector = selector;
        this.simulationTime = 0;

        this.genealogy = new Map();
    }

    process(elapsedTime) {
        this.simulationTime += elapsedTime;

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

        // Tick down the reproductive cooldowns
        this.reproductionCooldown.forEach((cooldownTime, id, map) => {
            const newCooldownTime = cooldownTime - elapsedTime;
            if (newCooldownTime > 0) {
                map.set(id, cooldownTime - elapsedTime);
            } else {
                map.delete(id);
            }
        });

        const newEggs = [];

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

                    const cooldownTime = this.reproductionCooldown.get(id);
                    const canInitiateReproduction = canSeeOther &&
                        !canAttack &&
                        !canBeAttacked &&
                        creature.shouldReproduceSexually &&
                        !cooldownTime;

                    if (canAttack && !canBeAttacked) {
                        creature.feed(
                            Math.min(
                                this.options.foodHealth,
                                otherCreature.health));
                    } else if (canBeAttacked) {
                        creature.harm(this.options.foodHealth);
                    } else if (canInitiateReproduction) {
                        const shouldMate = this.selector.isMateSuccessful(
                            creature,
                            otherCreature);
                        if (shouldMate) {
                            const reproduced =
                                creature.recombine(otherCreature, 3000);
                            newEggs.push({
                                creature: reproduced,
                                elapsedGestationTime: 0,
                                gestationTime: this.options.eggGestationTime
                            });

                            if (!this.genealogy.has(creature.id)) {
                                this.genealogy.set(creature.id, []);
                            }

                            this.genealogy.get(creature.id).push(reproduced.id);

                            if (!this.genealogy.has(otherCreature.id)) {
                                this.genealogy.set(otherCreature.id, []);
                            }

                            this.genealogy.get(otherCreature.id).
                                push(reproduced.id);

                            this.reproductionCooldown.set(
                                id,
                                this.options.reproductionCooldownTime);
                        }
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

                const cooldownTime = this.reproductionCooldown.get(id);
                if (creature.shouldReproduceAsexually && !cooldownTime) {
                    const reproduced = creature.recombine(
                        creature,
                        creature.health / 2);
                    newEggs.push({
                        creature: reproduced,
                        elapsedGestationTime: 0,
                        gestationTime: this.options.eggGestationTime
                    });

                    if (!this.genealogy.has(creature.id)) {
                        this.genealogy.set(creature.id, []);
                    }

                    this.genealogy.get(creature.id).push(reproduced.id);

                    creature.harm(creature.health / 2);

                    this.reproductionCooldown.set(
                        id,
                        this.options.reproductionCooldownTime);
                }
            }
        });

        deadCreatures.forEach(id => {
            this.creatures.delete(id);
            this.reproductionCooldown.delete(id);
        });

        if (this.selector.shouldSpawnFood(this.map, elapsedTime)) {
            const location = this.selector.chooseMapLocation(this.map);
            this.map.foodLocations.push(location);
        }

        this.map.eggs.forEach(egg => {
            egg.elapsedGestationTime += elapsedTime;
            if (egg.elapsedGestationTime >= egg.gestationTime) {
                this.creatures.set(egg.creature.id, egg.creature);
            }
        });

        this.map.eggs = this.map.eggs.
            filter(egg => egg.elapsedGestationTime < egg.gestationTime).
            concat(newEggs);

        // Make sure the minimum number of creatures is met
        while (this.creatures.size < this.options.minimumCreatures) {
            const creature = this.selector.createRandomCreature();
            this.creatures.set(creature.id, creature);
        }
    }

    toJSON() {
        return {
            map: {
                eggs: this.map.eggs.map(egg => ({
                    creature: egg.creature.toString(),
                    elapsedGestationTime: Math.floor(egg.elapsedGestationTime),
                    gestationTime: Math.floor(egg.gestationTime)
                })),
                foodLocations: this.map.foodLocations,
                height: this.map.height,
                width: this.map.width
            },
            creatures: Array.from(this.creatures.values()).
                map(creature => creature.toString()),
            reproductionCooldown: Array.from(
                this.reproductionCooldown.entries()).
                map(([id, cooldownTime]) => [
                    id,
                    Math.floor(cooldownTime)
                ]),
            simulationTime: this.simulationTime
        };
    }
}
