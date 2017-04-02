const expect = require('chai').expect;
const { Creature } = require('./../../umd/world.js').Creature;
const { Environment } = require('./../../umd/world.js').Environment;

const defaultCreatureData = {
    age: 1,
    angle: 0,
    color: 0,
    health: 100,
    speed: 0,
    x: 0,
    y: 0,
    canSee: () => ({
        leftPeriphery: false,
        rightPeriphery: false,
        focus: false
    })
};

class MockCreature {
    constructor(id, data = defaultCreatureData) {
        this.id = id;
        this.data = Object.assign({}, defaultCreatureData, data);
    }

    canReproduce() {
        return true;
    }

    canSee(point) {
        return this.data.canSee(point);
    }

    isDead() {
        return this.data.health === 0;
    }

    feed(foodHealth) {
        this.lastFoodHealth = foodHealth;
    }

    harm(healthLoss) {
        this.lastHealthLoss = healthLoss;
    }

    get age() {
        return this.data.age;
    }

    get angle() {
        return this.data.angle;
    }

    get color() {
        return this.data.color;
    }

    get health() {
        return this.data.health;
    }

    get speed() {
        return this.data.speed;
    }

    get x() {
        return this.data.x;
    }

    get y() {
        return this.data.y;
    }

    process(input) {
        this.lastInput = input;
    }

    recombine(other) {
        return new MockCreature(this.id + other.toString());
    }

    toString() {
        return this.id;
    }
}

describe('Environment', function() {
    let map;

    beforeEach(function() {
        map = {
            foodLocations: [],
            height: 100,
            width: 100
        };
    });

    it('is convertable to JSON', function() {
        const creatures = [
            Creature.createRandom(),
            Creature.createRandom()
        ];

        const creaturesMap = new Map(creatures.map(creature => [
            creature.id,
            creature
        ]));

        const environment = new Environment(map, creaturesMap);

        const expected = {
            map,
            creatures: creatures.map(creature => creature.toString()),
            generationCount: 0
        };

        expect(environment.toJSON()).to.deep.equal(expected);
    });

    it('generates more creatures when below the minimum', function() {
        const options = {
            generationTimeLength: 1,
            minimumCreatures: 10
        };

        const selector = {
            createRandomCreature() {
                return Creature.createRandom();
            },

            shouldSpawnFood() {
                return false;
            }
        };

        const environment = new Environment(
            map,
            new Map(),
            selector,
            options);

        expect(environment.toJSON().creatures).to.be.empty;

        environment.process(1.5);

        expect(environment.toJSON().creatures).to.have.lengthOf(10);
    });

    it('provides the distance to the nearest left periphery food item', function() {
        const options = {
            eatRadius: 50,
            generationTimeLength: 2,
            minimumCreatures: 1
        };

        const creature = new MockCreature(
            '00001',
            {
                x: 50,
                y: 50,
                canSee: () => ({
                    leftPeriphery: true,
                    rightPeriphery: false,
                    focus: false
                })
            });

        const creatures = [creature];

        const creaturesMap = new Map(creatures.map(creature => [
            creature.id,
            creature
        ]));

        const selector = {
            shouldSpawnFood() {
                return false;
            }
        };

        map.foodLocations = [
            {
                x: 30,
                y: 50
            },
            {
                x: 50,
                y: 60
            },
            {
                x: 70,
                y: 50
            }
        ];

        const environment = new Environment(
            map,
            creaturesMap,
            selector,
            options);

        environment.process(3);

        expect(creature.lastInput).to.contain.all.keys({
            booleans: {},
            variables: {
                l: 10,
                r: -1,
                f: -1
            }
        });
    });

    it('provides the distance to the nearest right periphery food item', function() {
        const options = {
            eatRadius: 50,
            generationTimeLength: 2,
            minimumCreatures: 1
        };

        const creature = new MockCreature(
            '00001',
            {
                x: 50,
                y: 50,
                canSee: () => ({
                    leftPeriphery: false,
                    rightPeriphery: true,
                    focus: false
                })
            });

        const creatures = [creature];

        const creaturesMap = new Map(creatures.map(creature => [
            creature.id,
            creature
        ]));

        const selector = {
            shouldSpawnFood() {
                return false;
            }
        };

        map.foodLocations = [
            {
                x: 30,
                y: 50
            },
            {
                x: 50,
                y: 60
            },
            {
                x: 70,
                y: 50
            }
        ];

        const environment = new Environment(
            map,
            creaturesMap,
            selector,
            options);

        environment.process(3);

        expect(creature.lastInput).to.contain.all.keys({
            booleans: {},
            variables: {
                l: -1,
                r: 10,
                f: -1
            }
        });
    });

    it('provides the distance to the nearest focus food item', function() {
        const options = {
            eatRadius: 50,
            generationTimeLength: 2,
            minimumCreatures: 1
        };

        const creature = new MockCreature(
            '00001',
            {
                x: 50,
                y: 50,
                canSee: () => ({
                    leftPeriphery: false,
                    rightPeriphery: false,
                    focus: true
                })
            });

        const creatures = [creature];

        const creaturesMap = new Map(creatures.map(creature => [
            creature.id,
            creature
        ]));

        const selector = {
            shouldSpawnFood() {
                return false;
            }
        };

        map.foodLocations = [
            {
                x: 30,
                y: 50
            },
            {
                x: 50,
                y: 60
            },
            {
                x: 70,
                y: 50
            }
        ];

        const environment = new Environment(
            map,
            creaturesMap,
            selector,
            options);

        environment.process(3);

        expect(creature.lastInput).to.contain.all.keys({
            booleans: {},
            variables: {
                l: -1,
                r: -1,
                f: 10
            }
        });
    });

    it('provides the distance and color to the nearest left periphery creature', function() {
        const options = {
            generationTimeLength: 2,
            minimumCreatures: 1
        };

        const creature = new MockCreature(
            '00001',
            {
                x: 50,
                y: 50,
                canSee: () => ({
                    leftPeriphery: true,
                    rightPeriphery: false,
                    focus: false
                })
            });

        const near = new MockCreature(
            '00002',
            {
                color: 1,
                x: 60,
                y: 50
            });

        const far = new MockCreature(
            '00003',
            {
                color: 2,
                x: 70,
                y: 50
            });

        const creatures = [
            creature,
            near,
            far
        ];

        const creaturesMap = new Map(creatures.map(creature => [
            creature.id,
            creature
        ]));

        const selector = {
            shouldSpawnFood() {
                return false;
            }
        };

        const environment = new Environment(
            map,
            creaturesMap,
            selector,
            options);

        environment.process(3);

        expect(creature.lastInput).to.contain.all.keys({
            booleans: {},
            variables: {
                H: 10,
                I: 1,
                J: -1,
                K: -1,
                L: -1,
                M: -1
            }
        });
    });

    it('provides the distance and color to the nearest right periphery creature', function() {
        const options = {
            generationTimeLength: 2,
            minimumCreatures: 1
        };

        const creature = new MockCreature(
            '00001',
            {
                x: 50,
                y: 50,
                canSee: () => ({
                    leftPeriphery: false,
                    rightPeriphery: true,
                    focus: false
                })
            });

        const near = new MockCreature(
            '00002',
            {
                color: 1,
                x: 60,
                y: 50
            });

        const far = new MockCreature(
            '00003',
            {
                color: 2,
                x: 70,
                y: 50
            });

        const creatures = [
            creature,
            near,
            far
        ];

        const creaturesMap = new Map(creatures.map(creature => [
            creature.id,
            creature
        ]));

        const selector = {
            shouldSpawnFood() {
                return false;
            }
        };

        const environment = new Environment(
            map,
            creaturesMap,
            selector,
            options);

        environment.process(3);

        expect(creature.lastInput).to.contain.all.keys({
            booleans: {},
            variables: {
                H: -1,
                I: -1,
                J: 10,
                K: 1,
                L: -1,
                M: -1
            }
        });
    });

    it('provides the distance and color to the nearest focus creature', function() {
        const options = {
            generationTimeLength: 2,
            minimumCreatures: 1
        };

        const creature = new MockCreature(
            '00001',
            {
                x: 50,
                y: 50,
                canSee: () => ({
                    leftPeriphery: false,
                    rightPeriphery: false,
                    focus: true
                })
            });

        const near = new MockCreature(
            '00002',
            {
                color: 1,
                x: 60,
                y: 50
            });

        const far = new MockCreature(
            '00003',
            {
                color: 2,
                x: 70,
                y: 50
            });

        const creatures = [
            creature,
            near,
            far
        ];

        const creaturesMap = new Map(creatures.map(creature => [
            creature.id,
            creature
        ]));

        const selector = {
            shouldSpawnFood() {
                return false;
            }
        };

        const environment = new Environment(
            map,
            creaturesMap,
            selector,
            options);

        environment.process(3);

        expect(creature.lastInput).to.contain.all.keys({
            booleans: {},
            variables: {
                H: -1,
                I: -1,
                J: -1,
                K: -1,
                L: 10,
                M: 1
            }
        });
    });

    it('provides no information about food or creatures if none are visible', function() {
        const options = {
            eatRadius: 50,
            generationTimeLength: 2,
            minimumCreatures: 1
        };

        const creature = new MockCreature(
            '00001',
            {
                x: 50,
                y: 50,
                canSee: () => ({
                    leftPeriphery: false,
                    rightPeriphery: false,
                    focus: false
                })
            });

        const creatures = [creature];

        const creaturesMap = new Map(creatures.map(creature => [
            creature.id,
            creature
        ]));

        const selector = {
            shouldSpawnFood() {
                return false;
            }
        };

        map.foodLocations = [
            {
                x: 49,
                y: 50
            },
            {
                x: 60,
                y: 50
            }
        ];

        const environment = new Environment(
            map,
            creaturesMap,
            selector,
            options);

        environment.process(3);

        expect(creature.lastInput).to.contain.all.keys({
            booleans: {},
            variables: {
                l: -1,
                r: -1,
                f: -1,
                H: -1,
                I: -1,
                J: -1,
                K: -1,
                L: -1,
                M: -1
            }
        });
    });

    it('feeds creatures when they are close enough to food', function() {
        const options = {
            eatRadius: 50,
            foodHealth: 10,
            generationTimeLength: 2,
            minimumCreatures: 1
        };

        const creature = new MockCreature(
            '00001',
            {
                x: 50,
                y: 50,
                canSee: point => ({
                    leftPeriphery: false,
                    rightPeriphery: false,
                    focus: point.x > 50
                })
            });

        const creatures = [creature];

        const creaturesMap = new Map(creatures.map(creature => [
            creature.id,
            creature
        ]));

        const selector = {
            shouldSpawnFood() {
                return false;
            }
        };

        map.foodLocations = [
            {
                x: 60,
                y: 50
            }
        ];

        const environment = new Environment(
            map,
            creaturesMap,
            selector,
            options);

        environment.process(3);

        expect(creature.lastFoodHealth).to.equal(10);
        expect(map.foodLocations).to.be.empty;
    });

    it('removes dead creatures', function() {
        const options = {
            generationTimeLength: 10,
            minimumCreatures: 1
        };

        const creatures = [
            new MockCreature('00001', { health: 0 }),
            new MockCreature('00002', { health: 100 })
        ];

        const creaturesMap = new Map(creatures.map(creature => [
            creature.id,
            creature
        ]));

        const selector = {
            createRandomCreature() {
                return Creature.createRandom();
            },

            shouldSpawnFood() {
                return false;
            }
        };

        const environment = new Environment(
            map,
            creaturesMap,
            selector,
            options);

        environment.process(1);

        expect(environment.toJSON().creatures).to.deep.equal([
            creatures[1].toString()
        ]);
    });

    it('replenishes at least one food item per unit of time', function() {
        const options = {
            generationTimeLength: 10,
            minimumCreatures: 0
        };

        const selector = {
            chooseMapLocation() {
                return {
                    x: 0,
                    y: 0
                };
            },

            shouldSpawnFood() {
                return true;
            }
        };

        const environment = new Environment(
            map,
            new Map(),
            selector,
            options);

        environment.process(1);

        expect(environment.toJSON().map.foodLocations).to.have.lengthOf(1);
    });

    it('performs no recombinations when there are no creatures', function() {
        const options = {
            generationTimeLength: 2,
            minimumCreatures: 0
        };

        const selector = {
            shouldSpawnFood() {
                return false;
            }
        };

        const environment = new Environment(
            map,
            new Map(),
            selector,
            options);

        environment.process(3);

        expect(environment.toJSON().creatures).to.be.empty;
    });

    it('recombines the sole creature with itself', function() {
        const options = {
            generationTimeLength: 2,
            minimumCreatures: 1
        };

        const creatures = [
            new MockCreature('00001')
        ];

        const creaturesMap = new Map(creatures.map(creature => [
            creature.id,
            creature
        ]));

        const selector = {
            createRandomCreature() {
                return Creature.createRandom();
            },

            shouldSpawnFood() {
                return false;
            }
        };

        const environment = new Environment(
            map,
            creaturesMap,
            selector,
            options);

        expect(environment.toJSON().creatures).to.have.lengthOf(1);

        environment.process(3);

        const expectedCreatures = environment.toJSON().creatures;
        expect(expectedCreatures).to.have.lengthOf(2);
        expect(expectedCreatures).to.include.members([
            creatures[0].toString(),
            '0000100001'
        ]);
    });

    it('recombines the two oldest creatures with themselves and each other', function() {
        const options = {
            generationTimeLength: 2,
            minimumCreatures: 1
        };

        const creatures = [
            new MockCreature('00001', { age: 100 }),
            new MockCreature('00002', { age: 500 }),
            new MockCreature('00003', { age: 50 })
        ];

        const creaturesMap = new Map(creatures.map(creature => [
            creature.id,
            creature
        ]));

        const selector = {
            createRandomCreature() {
                return Creature.createRandom();
            },

            shouldSpawnFood() {
                return false;
            }
        };

        const environment = new Environment(
            map,
            creaturesMap,
            selector,
            options);

        expect(environment.toJSON().creatures).to.have.lengthOf(3);

        environment.process(3);

        const expectedCreatures = environment.toJSON().creatures;
        expect(expectedCreatures).to.have.lengthOf(6);
        expect(expectedCreatures).to.include.members([
            creatures[0].toString(),
            creatures[1].toString(),
            creatures[2].toString(),
            '0000200002',
            '0000100001',
            '0000200001'
        ]);
    });
});
