import GenericSelector from './genericSelector';
import { squareDistance } from './../geometry';
import * as KnownVariables from './../knownVariables';

const defaultOptions = {
    eatRadius: 20,
    eggGestationTime: 300,
    foodHealth: 500,
    minimumCarnivores: 50,
    minimumHerbivores: 50,
    onCreatureAttacked: () => {},
    onCreatureFed: () => {},
    onCreatureGenerated: () => {},
    onCreatureKilled: () => {},
    onEggCreated: () => {},
    onEggDestroyed: () => {},
    onEggHatched: () => {},
    onFoodSpawned: () => {},
    onMateAttemptRebuffed: () => {},
    onMateAttemptSucceeded: () => {},
    reproductionCooldownTime: 100
};

const compareSquareDistance = (a, b) => a.squareDistance - b.squareDistance;

const dataIsVisible = data =>
    data.leftPeriphery ||
    data.rightPeriphery ||
    data.focus;

const nearestVisibleObject = (creature, objectLocations) => {
    const visibleLocations = objectLocations.
        map(point => ({
            canSee: creature.canSee(point),
            point
        })).
        filter(location => dataIsVisible(location.canSee));

    visibleLocations.forEach(data => {
        data.squareDistance = squareDistance(data.point, creature);
    });

    if (visibleLocations.length === 0) {
        return {};
    }

    const leftPeripheryLocations = visibleLocations.
        filter(data => data.canSee.leftPeriphery).
        sort(compareSquareDistance);

    let leftPeriphery = null;
    if (leftPeripheryLocations.length !== 0) {
        leftPeriphery = leftPeripheryLocations[0];
        leftPeriphery.distance = Math.sqrt(leftPeriphery.squareDistance);
    }

    const rightPeripheryLocations = visibleLocations.
        filter(data => data.canSee.rightPeriphery).
        sort(compareSquareDistance);

    let rightPeriphery = null;
    if (rightPeripheryLocations.length !== 0) {
        rightPeriphery = rightPeripheryLocations[0];
        rightPeriphery.distance = Math.sqrt(rightPeriphery.squareDistance);
    }

    const focusLocations = visibleLocations.
        filter(data => data.canSee.focus).
        sort(compareSquareDistance);

    let focus = null;
    if (focusLocations.length !== 0) {
        focus = focusLocations[0];
        focus.distance = Math.sqrt(focus.squareDistance);
    }

    return {
        leftPeriphery,
        rightPeriphery,
        focus
    };
};

const creatureRelationships = creatures => {
    const relations = new Map();
    creatures.forEach(creature => {
        const relationships = new Map();
        creatures.forEach(other => {
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

    return relations;
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

const nearestVisibleCreaturesInputData = (relationships, creatures) => {
    const booleans = {};
    const variables = {};

    const nearestCreatures = nearestVisibleCreatures(relationships, creatures);

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
            const nearestCreature = creatures.get(nearest.id);
            variables[distanceVariable] = nearest.distance;
            colors.forEach(color => {
                booleans[KnownVariables[color[0]]] = nearestCreature[color[1]];
            });
        } else {
            variables[distanceVariable] = -1;
            colors.forEach(color => {
                booleans[KnownVariables[color[0]]] = false;
            });
        }
    });

    return {
        booleans,
        variables
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

const audioEffectsInputData = (relationships, creatures) => {
    const variables = {};
    const audioEffects = totalAudioEffects(relationships, creatures);

    [
        ['front', KnownVariables.frontSound],
        ['left', KnownVariables.leftSound],
        ['back', KnownVariables.backSound],
        ['right', KnownVariables.rightSound]
    ].forEach(([property, variable]) => {
        variables[variable] = audioEffects[property];
    });

    return {
        variables
    };
};

const countCarnivores = creatures => Array.from(creatures.values()).
    filter(creature => creature.isCarnivore).length;

const countHerbivores = creatures => Array.from(creatures.values()).
    filter(creature => !creature.isCarnivore).length;

export default class Environment {
    constructor(map, creatures, selector = new GenericSelector(), options = {}) {
        this.map = {
            eggs: map.eggs.map(egg => {
                const creature = selector.deserializeCreature(egg.creature);
                return {
                    creature,
                    elapsedGestationTime: egg.elapsedGestationTime,
                    gestationTime: egg.gestationTime,
                    x: creature.x,
                    y: creature.y
                };
            }),
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
    }

    process(elapsedTime) {
        this.simulationTime += elapsedTime;

        const relations = creatureRelationships(this.creatures);

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
                    const canAttack = canSeeOther &&
                        creature.isAggressive &&
                        creature.isCarnivore;

                    const canOtherSee = dataIsVisible(otherRelationship.visible);
                    const canBeAttacked = canOtherSee &&
                        otherCreature.isAggressive;

                    const cooldownTime = this.reproductionCooldown.get(id);
                    const canInitiateReproduction = canSeeOther &&
                        !canAttack &&
                        !canBeAttacked &&
                        creature.shouldReproduceSexually &&
                        !cooldownTime &&
                        (creature.isCarnivore === otherCreature.isCarnivore);

                    if (canAttack && !canBeAttacked) {
                        const healthGain = Math.min(
                            this.options.foodHealth,
                            otherCreature.health);

                        creature.feed(healthGain);
                        this.options.onCreatureFed(
                            creature,
                            healthGain,
                            this.simulationTime);
                    } else if (canBeAttacked) {
                        creature.harm(this.options.foodHealth);
                        this.options.onCreatureAttacked(
                            creature,
                            otherCreature,
                            this.options.foodHealth,
                            this.simulationTime);
                    } else if (canInitiateReproduction) {
                        const shouldMate = this.selector.isMateSuccessful(
                            creature,
                            otherCreature);
                        if (shouldMate) {
                            this.options.onMateAttemptSucceeded(
                                creature,
                                otherCreature,
                                this.simulationTime);

                            const reproduced =
                                creature.recombine(otherCreature, 3000);
                            const egg = {
                                creature: reproduced,
                                elapsedGestationTime: 0,
                                gestationTime: this.options.eggGestationTime,
                                x: reproduced.x,
                                y: reproduced.y
                            };

                            newEggs.push(egg);

                            this.options.onEggCreated(
                                egg,
                                creature,
                                otherCreature,
                                this.simulationTime);

                            this.reproductionCooldown.set(
                                id,
                                this.options.reproductionCooldownTime);
                        } else {
                            this.options.onMateAttemptRebuffed(
                                creature,
                                otherCreature,
                                this.simulationTime);
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

            const locations = creature.isCarnivore ? 'eggs' : 'foodLocations';

            const nearestFood =
                nearestVisibleObject(creature, this.map[locations]);
            if (nearestFood.leftPeriphery) {
                input.variables[KnownVariables.nearestLeftPeripheryFoodDistance] =
                    nearestFood.leftPeriphery.distance;
            } else {
                input.variables[KnownVariables.nearestLeftPeripheryFoodDistance] = -1;
            }

            if (nearestFood.rightPeriphery) {
                input.variables[KnownVariables.nearestRightPeripheryFoodDistance] =
                    nearestFood.rightPeriphery.distance;
            } else {
                input.variables[KnownVariables.nearestRightPeripheryFoodDistance] = -1;
            }

            if (nearestFood.focus) {
                input.variables[KnownVariables.nearestFocusFoodDistance] =
                    nearestFood.focus.distance;
            } else {
                input.variables[KnownVariables.nearestFocusFoodDistance] = -1;
            }

            const relationships = relations.get(creature.id);
            const nearestCreaturesInput = nearestVisibleCreaturesInputData(
                relationships,
                this.creatures);

            Object.assign(input.booleans, nearestCreaturesInput.booleans);
            Object.assign(input.variables, nearestCreaturesInput.variables);

            const audioEffects = audioEffectsInputData(
                relationships,
                this.creatures);

            Object.assign(input.variables, audioEffects.variables);

            creature.process(input, elapsedTime);

            if (creature.isDead()) {
                deadCreatures.push(id);
            } else {
                [
                    nearestFood.leftPeriphery,
                    nearestFood.rightPeriphery,
                    nearestFood.focus
                ].
                filter(food => food && food.distance < this.options.eatRadius).
                forEach(food => {
                    creature.feed(this.options.foodHealth);
                    this.options.onCreatureFed(
                        creature,
                        this.options.foodHealth,
                        this.simulationTime);

                    if (locations === 'eggs') {
                        this.options.onEggDestroyed(
                            creature,
                            food.point,
                            this.simulationTime);
                    }

                    this.map[locations] = this.map[locations].filter(
                        location =>
                            (location.x !== food.point.x) &&
                            (location.y !== food.point.y));
                });

                const cooldownTime = this.reproductionCooldown.get(id);
                if (creature.shouldReproduceAsexually && !cooldownTime) {
                    const reproduced = creature.recombine(
                        creature,
                        creature.health / 2);
                    const egg = {
                        creature: reproduced,
                        elapsedGestationTime: 0,
                        gestationTime: this.options.eggGestationTime,
                        x: creature.x,
                        y: creature.y
                    };

                    newEggs.push(egg);

                    this.options.onEggCreated(
                        egg,
                        creature,
                        null,
                        this.simulationTime);

                    creature.harm(creature.health / 2);

                    this.reproductionCooldown.set(
                        id,
                        this.options.reproductionCooldownTime);
                }
            }
        });

        deadCreatures.forEach(id => {
            const deadCreature = this.creatures.get(id);

            this.creatures.delete(id);
            this.reproductionCooldown.delete(id);
            this.options.onCreatureKilled(deadCreature, this.simulationTime);
        });

        if (this.selector.shouldSpawnFood(this.map, elapsedTime)) {
            const location = this.selector.chooseMapLocation(this.map);
            this.map.foodLocations.push(location);
            this.options.onFoodSpawned(location, this.simulationTime);
        }

        this.map.eggs.forEach(egg => {
            egg.elapsedGestationTime += elapsedTime;
            if (egg.elapsedGestationTime >= egg.gestationTime) {
                this.creatures.set(egg.creature.id, egg.creature);
                this.options.onEggHatched(egg, this.simulationTime);
            }
        });

        this.map.eggs = this.map.eggs.
            filter(egg => egg.elapsedGestationTime < egg.gestationTime).
            concat(newEggs);

        // Make sure the minimum number of creatures is met
        const newCarnivores = this.options.minimumCarnivores -
            countCarnivores(this.creatures);
        for (let i = 0; i < newCarnivores; ++i) {
            const creature = this.selector.createRandomCreature({
                isCarnivore: true
            });
            this.creatures.set(creature.id, creature);
            this.options.onCreatureGenerated(creature);
        }

        const newHerbivores = this.options.minimumHerbivores -
            countHerbivores(this.creatures);
        for (let i = 0; i < newHerbivores; ++i) {
            const creature = this.selector.createRandomCreature({
                isCarnivore: false
            });
            this.creatures.set(creature.id, creature);
            this.options.onCreatureGenerated(creature);
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
