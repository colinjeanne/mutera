const expect = require('chai').expect;
const { Creature } = require('./../../umd/world.js').Creature;
const { Environment } = require('./../../umd/world.js').Environment;

const defaultCreatureData = {
    age: 1,
    angle: 0,
    isAggressive: false,
    isRed: false,
    isGreen: false,
    isBlue: false,
    health: 100,
    isMoving: false,
    isFast: false,
    speed: 0,
    x: 0,
    y: 0,
    canSee: () => ({
        leftPeriphery: false,
        rightPeriphery: false,
        focus: false
    }),
    hear: () => ({
        front: 0,
        left: 0,
        back: 0,
        right: 0
    })
};

class MockCreature {
    constructor(id, data = defaultCreatureData) {
        this.id = id;
        this.data = Object.assign({}, defaultCreatureData, data);

        this.lastFoodHealth = 0;
        this.lastHealthLoss = 0;
    }

    canReproduce() {
        return true;
    }

    canSee(point) {
        return this.data.canSee(point);
    }

    hear(point) {
        return this.data.hear(point);
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

    get isAggressive() {
        return this.data.isAggressive;
    }

    get isRed() {
        return this.data.isRed;
    }

    get isGreen() {
        return this.data.isGreen;
    }

    get isBlue() {
        return this.data.isBlue;
    }

    get health() {
        return this.data.health;
    }

    get isMoving() {
        return this.data.isMoving;
    }

    get isFast() {
        return this.data.isFast;
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
            eggs: [],
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
                isRed: true,
                x: 60,
                y: 50
            });

        const far = new MockCreature(
            '00003',
            {
                isGreen: true,
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

        expect(creature.lastInput.booleans.I).to.be.true;
        expect(creature.lastInput.variables.H).to.equal(10);
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
                isRed: true,
                x: 60,
                y: 50
            });

        const far = new MockCreature(
            '00003',
            {
                isGreen: true,
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

        expect(creature.lastInput.booleans.M).to.be.true;
        expect(creature.lastInput.variables.L).to.equal(10);
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
                isRed: true,
                x: 60,
                y: 50
            });

        const far = new MockCreature(
            '00003',
            {
                isGreen: true,
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

        expect(creature.lastInput.booleans.Q).to.be.true;
        expect(creature.lastInput.variables.P).to.equal(10);
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

    it('provides information on the amount of sound in each direction', function() {
        const options = {
            generationTimeLength: 2,
            minimumCreatures: 1
        };

        const creature = new MockCreature(
            '00001',
            {
                x: 50,
                y: 50,
                hear: () => ({
                    front: 1,
                    left: 2,
                    back: 3,
                    right: 4
                })
            });

        const other = new MockCreature(
            '00002',
            {
                x: 70,
                y: 70,
                canSee: () => ({
                    leftPeriphery: false,
                    rightPeriphery: false,
                    focus: false
                })
            });

        const creatures = [creature, other];

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
                W: 1,
                X: 2,
                Y: 3,
                Z: 4
            }
        });
    });

    it('aggressive creatures attack creatures they can see', function() {
        const options = {
            generationTimeLength: 2,
            minimumCreatures: 1
        };

        const creature = new MockCreature(
            '00001',
            {
                isAggressive: true,
                health: 1000,
                x: 50,
                y: 50,
                canSee: () => ({
                    leftPeriphery: false,
                    rightPeriphery: false,
                    focus: true
                })
            });

        const other = new MockCreature(
            '00002',
            {
                health: 1000,
                x: 55,
                y: 55,
                canSee: () => ({
                    leftPeriphery: false,
                    rightPeriphery: false,
                    focus: false
                })
            });

        const creatures = [creature, other];

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

        environment.process(1);

        expect(creature.lastFoodHealth).to.equal(500);
        expect(creature.lastHealthLoss).to.equal(0);
        expect(other.lastFoodHealth).to.equal(0);
        expect(other.lastHealthLoss).to.equal(500);
    });

    it('two aggressive creatures attack each other', function() {
        const options = {
            generationTimeLength: 2,
            minimumCreatures: 1
        };

        const creature = new MockCreature(
            '00001',
            {
                isAggressive: true,
                health: 1000,
                x: 50,
                y: 50,
                canSee: () => ({
                    leftPeriphery: false,
                    rightPeriphery: false,
                    focus: true
                })
            });

        const other = new MockCreature(
            '00002',
            {
                isAggressive: true,
                health: 1000,
                x: 55,
                y: 55,
                canSee: () => ({
                    leftPeriphery: false,
                    rightPeriphery: false,
                    focus: true
                })
            });

        const creatures = [creature, other];

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

        environment.process(1);

        expect(creature.lastFoodHealth).to.equal(0);
        expect(creature.lastHealthLoss).to.equal(500);
        expect(other.lastFoodHealth).to.equal(0);
        expect(other.lastHealthLoss).to.equal(500);
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
        expect(environment.toJSON().map.foodLocations).to.be.empty;
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
            eggGestationTime: 15,
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

        const expectedEggs = environment.toJSON().map.eggs;
        expect(expectedEggs).to.have.lengthOf(1);
        expect(expectedEggs).to.deep.include.members([
            {
                creature: '0000100001',
                elapsedGestationTime: 0,
                gestationTime: 15
            }
        ]);
    });

    it('recombines the two oldest creatures with themselves and each other', function() {
        const options = {
            eggGestationTime: 15,
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

        const expectedEggs = environment.toJSON().map.eggs;
        expect(expectedEggs).to.have.lengthOf(3);
        expect(expectedEggs).to.deep.include.members([
            {
                creature: '0000200002',
                elapsedGestationTime: 0,
                gestationTime: 15
            },
            {
                creature: '0000100001',
                elapsedGestationTime: 0,
                gestationTime: 15
            },
            {
                creature: '0000200001',
                elapsedGestationTime: 0,
                gestationTime: 15
            }
        ]);
    });

    it('gestates eggs when their elapsed time is greater than their gestation time', function() {
        const options = {
            generationTimeLength: 2,
            minimumCreatures: 0
        };

        map.eggs = [
            {
                creature: '00001',
                elapsedGestationTime: 14,
                gestationTime: 15
            },
            {
                creature: '00002',
                elapsedGestationTime: 10,
                gestationTime: 15
            }
        ];

        const selector = {
            createRandomCreature() {
                return Creature.createRandom();
            },

            deserializeCreature(encodedCreature) {
                return new MockCreature(encodedCreature);
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

        environment.process(1);

        const expectedEggs = environment.toJSON().map.eggs;
        expect(expectedEggs).to.have.lengthOf(1);
        expect(expectedEggs).to.deep.include.members([
            {
                creature: '00002',
                elapsedGestationTime: 11,
                gestationTime: 15
            }
        ]);

        const expectedCreatures = environment.toJSON().creatures;
        expect(expectedCreatures).to.have.lengthOf(1);
        expect(expectedCreatures).to.include.members([
            '00001'
        ]);
    });
});
