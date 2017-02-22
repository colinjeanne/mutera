import GenericSelector from './genericSelector';

const defaultOptions = {
    eatRadius: 20,
    foodGrowthPerTime: 10,
    foodHealth: 500,
    generationTimeLength: 30,
    minimumCreatures: 100
};

const squareDistance = (a, b) =>
    (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);

const distance = (a, b) => Math.sqrt(squareDistance(a, b));

const nearestVisibleFood = (creature, foodLocations) => {
    const visibleLocations = foodLocations.
        filter(point => creature.canSee(point));

    const sortedDistances = visibleLocations.map(point => ({
        squareDistance: squareDistance(point, creature),
        point
    })).
    sort((a, b) => a.squareDistance - b.squareDistance);

    if (sortedDistances.length === 0) {
        return null;
    }

    const nearest = sortedDistances[0];
    const angleInRadians = Math.atan2(
        nearest.point.y - creature.y,
        nearest.point.x - creature.x);

    return {
        angle: angleInRadians * 256 / Math.PI,
        distance: Math.sqrt(nearest.squareDistance),
        x: nearest.point.x,
        y: nearest.point.y
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
    }

    process(elapsedTime) {
        const deadCreatures = [];
        this.creatures.forEach((creature, id) => {
            const input = {};

            const nearestFood =
                nearestVisibleFood(creature, this.map.foodLocations);
            if (nearestFood) {
                input.f = nearestFood.angle;
                input.d = nearestFood.distance;
            }

            creature.process(input, elapsedTime);

            if (nearestFood &&
                (distance(nearestFood, creature) < this.options.eatRadius)) {
                creature.feed(this.options.foodHealth);
            }
            else if (creature.isDead()) {
                deadCreatures.push(id);
            }
        });

        deadCreatures.forEach(id => this.creatures.delete(id));

        if (this.selector.shouldSpawnFood(elapsedTime)) {
            const location = this.selector.chooseMapLocation(this.map);
            this.map.foodLocations.push(location);
        }

        this.generationTime += elapsedTime;
        if (this.generationTime > this.options.generationTimeLength) {
            // Choose the two oldest creatures. Mate them with each other and
            // with themselves.
            let oldest = null;
            let secondOldest = null;
            this.creatures.forEach(creature => {
                if (!oldest) {
                    oldest = creature;
                } else if (creature.age >= oldest.age) {
                    secondOldest = oldest;
                    oldest = creature;
                } else if (!secondOldest ||
                    (creature.age >= secondOldest.age)) {
                    secondOldest = creature;
                }
            });

            if (oldest) {
                const oldestMutation = oldest.recombine(oldest);
                this.creatures.set(oldestMutation.id, oldestMutation);

                if (secondOldest) {
                    const recombined = oldest.recombine(secondOldest);
                    this.creatures.set(recombined.id, recombined);

                    const secondOldestMutation =
                        secondOldest.recombine(secondOldest);
                    this.creatures.set(
                        secondOldestMutation.id,
                        secondOldestMutation);
                }
            }

            // Make sure the minimum number of creatures is met
            while (this.creatures.size < this.options.minimumCreatures) {
                const creature = this.selector.createRandomCreature();
                this.creatures.set(creature.id, creature);
            }

            this.generationTime = 0;
        }
    }

    toJSON() {
        return {
            map: this.map,
            creatures: Array.from(this.creatures.values()).
                map(creature => creature.toString())
        };
    }
}
