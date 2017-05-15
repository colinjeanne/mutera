const expect = require('chai').expect;
const sinon = require('sinon');
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
    isCarnivore: false,
    shouldReproduceAsexually: false,
    shouldReproduceSexually: false,
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

    get isCarnivore() {
        return this.data.isCarnivore;
    }

    get shouldReproduceAsexually() {
        return this.data.shouldReproduceAsexually;
    }

    get shouldReproduceSexually() {
        return this.data.shouldReproduceSexually;
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
            reproductionCooldown: [],
            simulationTime: 0
        };

        expect(environment.toJSON()).to.deep.equal(expected);
    });

    it('generates more creatures when below the minimum', function() {
        const options = {
            minimumCarnivores: 5,
            minimumHerbivores: 5,
            onCreatureGenerated: sinon.spy()
        };

        const selector = {
            createRandomCreature({ isCarnivore }) {
                return Creature.createRandom({ isCarnivore });
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
        expect(options.onCreatureGenerated.callCount).to.equal(10);
    });

    it('provides the distance to the nearest left periphery food item', function() {
        const options = {
            eatRadius: 50,
            minimumCarnivores: 0,
            minimumHerbivores: 0
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
            reals: {
                l: 10,
                r: -1,
                f: -1
            }
        });
    });

    it('provides the distance to the nearest right periphery food item', function() {
        const options = {
            eatRadius: 50,
            minimumCarnivores: 0,
            minimumHerbivores: 0
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
            reals: {
                l: -1,
                r: 10,
                f: -1
            }
        });
    });

    it('provides the distance to the nearest focus food item', function() {
        const options = {
            eatRadius: 50,
            minimumCarnivores: 0,
            minimumHerbivores: 0
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
            reals: {
                l: -1,
                r: -1,
                f: 10
            }
        });
    });

    it('directs carnivores to eggs and herbivores to plants', function() {
        const options = {
            foodHealth: 100,
            minimumCarnivores: 0,
            minimumHerbivores: 0,
            onCreatureFed: sinon.spy()
        };

        const carnivore = new MockCreature(
            '00001',
            {
                isCarnivore: true,
                x: 10,
                y: 10,
                canSee: () => ({
                    leftPeriphery: false,
                    rightPeriphery: false,
                    focus: true
                })
            });

        const herbivore = new MockCreature(
            '00002',
            {
                x: 50,
                y: 50,
                canSee: () => ({
                    leftPeriphery: false,
                    rightPeriphery: false,
                    focus: true
                })
            });

        const creatures = [
            carnivore,
            herbivore
        ];

        const creaturesMap = new Map(creatures.map(creature => [
            creature.id,
            creature
        ]));

        const selector = {
            deserializeCreature(encodedCreature) {
                const point = (encodedCreature === '00003') ?
                    ({
                        x: 20,
                        y: 10
                    }) :
                    ({
                        x: 51,
                        y: 50
                    });

                return new MockCreature(encodedCreature, point);
            },

            shouldSpawnFood() {
                return false;
            }
        };

        map.eggs = [
            {
                creature: '00003',
                elapsedGestationTime: 0,
                gestationTime: 100,
                initiatorId: '99999',
                x: 20,
                y: 10
            },
            {
                creature: '00004',
                elapsedGestationTime: 0,
                gestationTime: 100,
                initiatorId: '99999',
                x: 51,
                y: 50
            }
        ];

        map.foodLocations = [
            {
                x: 11,
                y: 10
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

        environment.process(1);

        expect(carnivore.lastInput.reals.f).to.equal(10);
        expect(carnivore.lastFoodHealth).to.equal(100);
        expect(herbivore.lastInput.reals.f).to.equal(10);
        expect(herbivore.lastFoodHealth).to.equal(100);

        const json = environment.toJSON();
        expect(json.map.eggs).to.deep.equal(
            [
                {
                    creature: '00004',
                    elapsedGestationTime: 1,
                    gestationTime: 100,
                    initiatorId: '99999',
                    otherId: undefined
                }
            ]);
        expect(json.map.foodLocations).to.deep.equal(
            [
                {
                    x: 11,
                    y: 10
                }
            ]);
        expect(options.onCreatureFed.calledTwice).to.be.true;
        expect(options.onCreatureFed.calledWith(carnivore, 100, 1)).to.be.true;
        expect(options.onCreatureFed.calledWith(herbivore, 100, 1)).to.be.true;
    });

    it('provides the distance and color to the nearest left periphery creature', function() {
        const options = {
            minimumCarnivores: 0,
            minimumHerbivores: 0
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
                isCarnivore: true,
                isRed: true,
                x: 60,
                y: 50
            });

        const far = new MockCreature(
            '00003',
            {
                isCarnivore: false,
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
            isMateSuccessful() {
                return false;
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

        environment.process(3);

        expect(creature.lastInput.booleans.I).to.be.true;
        expect(creature.lastInput.reals.H).to.equal(10);
        expect(creature.lastInput.booleans.B).to.be.true;
    });

    it('provides the distance and color to the nearest right periphery creature', function() {
        const options = {
            minimumCarnivores: 0,
            minimumHerbivores: 0
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
                isCarnivore: false,
                isRed: true,
                x: 60,
                y: 50
            });

        const far = new MockCreature(
            '00003',
            {
                isCarnivore: true,
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
            isMateSuccessful() {
                return false;
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

        environment.process(3);

        expect(creature.lastInput.booleans.M).to.be.true;
        expect(creature.lastInput.reals.L).to.equal(10);
        expect(creature.lastInput.booleans.C).to.be.false;
    });

    it('provides the distance and color to the nearest focus creature', function() {
        const options = {
            minimumCarnivores: 0,
            minimumHerbivores: 0
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
                isCarnivore: true,
                isRed: true,
                x: 60,
                y: 50
            });

        const far = new MockCreature(
            '00003',
            {
                isCarnivore: false,
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
            isMateSuccessful() {
                return false;
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

        environment.process(3);

        expect(creature.lastInput.booleans.Q).to.be.true;
        expect(creature.lastInput.reals.P).to.equal(10);
        expect(creature.lastInput.booleans.D).to.be.true;
    });

    it('provides no information about food or creatures if none are visible', function() {
        const options = {
            eatRadius: 50,
            minimumCarnivores: 0,
            minimumHerbivores: 0
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
            isMateSuccessful() {
                return false;
            },

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
            reals: {
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
            minimumCarnivores: 0,
            minimumHerbivores: 0
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
            isMateSuccessful() {
                return false;
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

        environment.process(3);

        expect(creature.lastInput).to.contain.all.keys({
            booleans: {},
            reals: {
                W: 1,
                X: 2,
                Y: 3,
                Z: 4
            }
        });
    });

    it('aggressive carnivores attack and eat creatures they can see', function() {
        const options = {
            foodHealth: 100,
            minimumCarnivores: 0,
            minimumHerbivores: 0,
            onCreatureAttacked: sinon.spy(),
            onCreatureFed: sinon.spy()
        };

        const creature = new MockCreature(
            '00001',
            {
                isAggressive: true,
                isCarnivore: true,
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

        expect(creature.lastFoodHealth).to.equal(100);
        expect(creature.lastHealthLoss).to.equal(0);
        expect(other.lastFoodHealth).to.equal(0);
        expect(other.lastHealthLoss).to.equal(100);

        expect(options.onCreatureAttacked.calledWith(
            other,
            creature,
            100,
            1
        )).to.be.true;
        expect(options.onCreatureFed.calledWith(creature, 100, 1)).to.be.true;
    });

    it('aggressive herbivores harm creatures they can see', function() {
        const options = {
            foodHealth: 100,
            minimumCarnivores: 0,
            minimumHerbivores: 0,
            onCreatureAttacked: sinon.spy(),
            onCreatureFed: sinon.spy()
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

        expect(creature.lastFoodHealth).to.equal(0);
        expect(creature.lastHealthLoss).to.equal(0);
        expect(other.lastFoodHealth).to.equal(0);
        expect(other.lastHealthLoss).to.equal(100);

        expect(options.onCreatureAttacked.calledWith(
            other,
            creature,
            100,
            1
        )).to.be.true;
        expect(options.onCreatureFed.notCalled).to.be.true;
    });

    it('two aggressive creatures attack each other', function() {
        const options = {
            foodHealth: 100,
            minimumCarnivores: 0,
            minimumHerbivores: 0,
            onCreatureAttacked: sinon.spy(),
            onCreatureFed: sinon.spy()
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
        expect(creature.lastHealthLoss).to.equal(100);
        expect(other.lastFoodHealth).to.equal(0);
        expect(other.lastHealthLoss).to.equal(100);

        expect(options.onCreatureAttacked.calledWith(
            creature,
            other,
            100,
            1
        )).to.be.true;
        expect(options.onCreatureAttacked.calledWith(
            other,
            creature,
            100,
            1
        )).to.be.true;
        expect(options.onCreatureFed.notCalled).to.be.true;
    });

    it('feeds carnivores when they are close enough to eggs', function() {
        const options = {
            eatRadius: 50,
            foodHealth: 10,
            minimumCarnivores: 0,
            minimumHerbivores: 0,
            onCreatureFed: sinon.spy(),
            onEggDestroyed: sinon.spy()
        };

        const creature = new MockCreature(
            '00001',
            {
                isCarnivore: true,
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

        const mockedCreature = new MockCreature(
            '00002',
            {
                x: 60,
                y: 50
            });

        const selector = {
            deserializeCreature() {
                return mockedCreature;
            },

            shouldSpawnFood() {
                return false;
            }
        };

        map.eggs = [
            {
                creature: '00002',
                elapsedGestationTime: 0,
                gestationTime: 100,
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
        expect(environment.toJSON().map.eggs).to.be.empty;
        expect(options.onCreatureFed.calledWith(creature, 10, 3)).to.be.true;

        expect(options.onEggDestroyed.calledWithMatch(
            creature,
            {
                creature: mockedCreature,
                elapsedGestationTime: 0,
                gestationTime: 100,
                x: 60,
                y: 50
            },
            3
        )).to.be.true;
    });

    it('feeds herbivores when they are close enough to food', function() {
        const options = {
            eatRadius: 50,
            foodHealth: 10,
            minimumCarnivores: 0,
            minimumHerbivores: 0,
            onCreatureFed: sinon.spy(),
            onEggDestroyed: sinon.spy()
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
        expect(options.onCreatureFed.calledWith(creature, 10, 3)).to.be.true;
        expect(options.onEggDestroyed.notCalled).to.be.true;
    });

    it('removes dead creatures', function() {
        const options = {
            minimumCarnivores: 0,
            minimumHerbivores: 0,
            onCreatureKilled: sinon.spy()
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
            isMateSuccessful() {
                return false;
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

        expect(options.onCreatureKilled.calledWith(creatures[0], 1)).to.be.true;
    });

    it('replenishes at least one food item per unit of time', function() {
        const options = {
            minimumCarnivores: 0,
            minimumHerbivores: 0,
            onFoodSpawned: sinon.spy()
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
        expect(options.onFoodSpawned.calledWith(
            {
                x: 0,
                y: 0
            },
            1
        )).to.be.true;
    });

    it('allows asexual reproduction', function() {
        const options = {
            asexualReproductionCost: 1000,
            eggGestationTime: 15,
            minimumCarnivores: 0,
            minimumHerbivores: 0,
            reproductionCooldownTime: 100,
            onEggCreated: sinon.spy()
        };

        const creatures = [
            new MockCreature(
                '00001',
                {
                    health: 4000,
                    shouldReproduceAsexually: true
                })
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

        const json = environment.toJSON();
        const expectedEggs = json.map.eggs;
        expect(expectedEggs).to.have.lengthOf(1);
        expect(expectedEggs).to.deep.include.members([
            {
                creature: '0000100001',
                elapsedGestationTime: 0,
                gestationTime: 15,
                initiatorId: '00001',
                otherId: undefined
            }
        ]);

        expect(creatures[0].lastHealthLoss).to.equal(1000);
        expect(json.reproductionCooldown).to.deep.equal([
            ['00001', 100]
        ]);

        expect(options.onEggCreated.calledWithMatch(
            {
                creature: new MockCreature('0000100001'),
                elapsedGestationTime: 0,
                gestationTime: 15,
                x: 0,
                y: 0
            },
            creatures[0],
            null,
            3
        )).to.be.true;
    });

    it('only triggers sexual reproduction between creatures of the same type', function() {
        const options = {
            eggGestationTime: 15,
            minimumCarnivores: 0,
            minimumHerbivores: 0,
            onMateAttemptRebuffed: sinon.spy(),
            onMateAttemptSucceeded: sinon.spy()
        };

        const creatures = [
            new MockCreature(
                '00001',
                {
                    angle: 0,
                    isCarnivore: true,
                    shouldReproduceAsexually: false,
                    shouldReproduceSexually: true,
                    x: 100,
                    y: 100
                }),
            new MockCreature(
                '00002',
                {
                    angle: Math.PI,
                    shouldReproduceAsexually: false,
                    shouldReproduceSexually: true,
                    x: 101,
                    y: 100
                })
        ];

        const creaturesMap = new Map(creatures.map(creature => [
            creature.id,
            creature
        ]));

        const selector = {
            isMateSuccessful() {
                return true;
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

        expect(environment.toJSON().creatures).to.have.lengthOf(2);

        environment.process(3);

        const expectedEggs = environment.toJSON().map.eggs;
        expect(expectedEggs).to.be.empty;

        expect(options.onMateAttemptRebuffed.notCalled).to.be.true;
        expect(options.onMateAttemptSucceeded.notCalled).to.be.true;
    });

    it('only triggers sexual reproduction if at least one creature wants it', function() {
        const options = {
            eggGestationTime: 15,
            minimumCarnivores: 0,
            minimumHerbivores: 0,
            onMateAttemptRebuffed: sinon.spy(),
            onMateAttemptSucceeded: sinon.spy()
        };

        const creatures = [
            new MockCreature(
                '00001',
                {
                    angle: 0,
                    shouldReproduceAsexually: false,
                    shouldReproduceSexually: false,
                    x: 100,
                    y: 100
                }),
            new MockCreature(
                '00002',
                {
                    angle: Math.PI,
                    shouldReproduceAsexually: false,
                    shouldReproduceSexually: false,
                    x: 101,
                    y: 100
                })
        ];

        const creaturesMap = new Map(creatures.map(creature => [
            creature.id,
            creature
        ]));

        const selector = {
            isMateSuccessful() {
                return true;
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

        expect(environment.toJSON().creatures).to.have.lengthOf(2);

        environment.process(3);

        const expectedEggs = environment.toJSON().map.eggs;
        expect(expectedEggs).to.be.empty;

        expect(options.onMateAttemptRebuffed.notCalled).to.be.true;
        expect(options.onMateAttemptSucceeded.notCalled).to.be.true;
    });

    it('allows sexual reproduction', function() {
        const options = {
            eggGestationTime: 15,
            minimumCarnivores: 0,
            minimumHerbivores: 0,
            reproductionCooldownTime: 100,
            onEggCreated: sinon.spy(),
            onMateAttemptRebuffed: sinon.spy(),
            onMateAttemptSucceeded: sinon.spy()
        };

        const creatures = [
            new MockCreature(
                '00001',
                {
                    angle: 0,
                    canSee: () => ({
                        leftPeriphery: false,
                        rightPeriphery: false,
                        focus: true
                    }),
                    shouldReproduceAsexually: false,
                    shouldReproduceSexually: true,
                    x: 100,
                    y: 100
                }),
            new MockCreature(
                '00002',
                {
                    angle: Math.PI,
                    shouldReproduceAsexually: false,
                    shouldReproduceSexually: false,
                    x: 101,
                    y: 100
                })
        ];

        const creaturesMap = new Map(creatures.map(creature => [
            creature.id,
            creature
        ]));

        const selector = {
            createRandomCreature() {
                return Creature.createRandom();
            },

            isMateSuccessful() {
                return true;
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

        expect(environment.toJSON().creatures).to.have.lengthOf(2);

        environment.process(3);

        const json = environment.toJSON();
        const expectedEggs = json.map.eggs;
        expect(expectedEggs).to.deep.equal([
            {
                creature: '0000100002',
                elapsedGestationTime: 0,
                gestationTime: 15,
                initiatorId: '00001',
                otherId: '00002'
            }
        ]);

        expect(json.reproductionCooldown).to.deep.equal([
            ['00001', 100]
        ]);

        expect(options.onEggCreated.calledWithMatch(
            {
                creature: new MockCreature('0000100002'),
                elapsedGestationTime: 0,
                gestationTime: 15,
                x: 0,
                y: 0
            },
            creatures[0],
            creatures[1],
            3
        )).to.be.true;

        expect(options.onMateAttemptRebuffed.notCalled).to.be.true;
        expect(options.onMateAttemptSucceeded.calledWith(
            creatures[0],
            creatures[1],
            3
        )).to.be.true;
    });

    it('prevents reproduction for a short period of time', function() {
        const options = {
            eggGestationTime: 100,
            minimumCarnivores: 0,
            minimumHerbivores: 0,
            reproductionCooldownTime: 5
        };

        const creatures = [
            new MockCreature(
                '00001',
                {
                    health: 4000,
                    shouldReproduceAsexually: true
                })
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

        environment.process(1);

        expect(environment.toJSON().map.eggs).to.have.lengthOf(1);
        expect(environment.toJSON().reproductionCooldown).to.deep.equal([
            ['00001', 5]
        ]);

        environment.process(1);

        expect(environment.toJSON().map.eggs).to.have.lengthOf(1);
        expect(environment.toJSON().reproductionCooldown).to.deep.equal([
            ['00001', 4]
        ]);

        environment.process(4);

        expect(environment.toJSON().map.eggs).to.have.lengthOf(2);
        expect(environment.toJSON().reproductionCooldown).to.deep.equal([
            ['00001', 5]
        ]);
    });

    it('prevents creatures from eating their own eggs', function() {
        const options = {
            eggGestationTime: 15,
            minimumCarnivores: 0,
            minimumHerbivores: 0,
            reproductionCooldownTime: 100,
            onEggCreated: sinon.spy(),
            onEggDestroyed: sinon.spy()
        };

        const creatures = [
            new MockCreature(
                '00001',
                {
                    health: 4000,
                    isCarnivore: true,
                    shouldReproduceAsexually: false,
                    shouldReproduceSexually: true,
                    canSee: () => ({
                        leftPeriphery: false,
                        rightPeriphery: false,
                        focus: true
                    })
                }),
            new MockCreature(
                '00002',
                {
                    angle: Math.PI,
                    isCarnivore: true,
                    shouldReproduceAsexually: false,
                    shouldReproduceSexually: false,
                    canSee: () => ({
                        leftPeriphery: false,
                        rightPeriphery: false,
                        focus: true
                    })
                })
        ];

        const creaturesMap = new Map(creatures.map(creature => [
            creature.id,
            creature
        ]));

        const selector = {
            createRandomCreature() {
                return Creature.createRandom();
            },

            isMateSuccessful() {
                return true;
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

        let json = environment.toJSON();
        let expectedEggs = json.map.eggs;
        expect(expectedEggs).to.have.lengthOf(1);
        expect(expectedEggs).to.deep.include.members([
            {
                creature: '0000100002',
                elapsedGestationTime: 0,
                gestationTime: 15,
                initiatorId: '00001',
                otherId: '00002'
            }
        ]);

        expect(options.onEggCreated.calledWithMatch(
            {
                creature: new MockCreature('0000100002'),
                elapsedGestationTime: 0,
                gestationTime: 15,
                x: 0,
                y: 0
            },
            creatures[0],
            creatures[1],
            1
        )).to.be.true;

        environment.process(1);

        json = environment.toJSON();
        expectedEggs = json.map.eggs;
        expect(expectedEggs).to.have.lengthOf(1);
        expect(expectedEggs).to.deep.include.members([
            {
                creature: '0000100002',
                elapsedGestationTime: 1,
                gestationTime: 15,
                initiatorId: '00001',
                otherId: '00002'
            }
        ]);

        expect(options.onEggDestroyed.notCalled).to.be.true;
    });

    it('gestates eggs when their elapsed time is greater than their gestation time', function() {
        const options = {
            minimumCarnivores: 0,
            minimumHerbivores: 0,
            onEggHatched: sinon.spy()
        };

        map.eggs = [
            {
                creature: '00001',
                elapsedGestationTime: 14,
                gestationTime: 15,
                initiatorId: '99999'
            },
            {
                creature: '00002',
                elapsedGestationTime: 10,
                gestationTime: 15,
                initiatorId: '99999'
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
                gestationTime: 15,
                initiatorId: '99999',
                otherId: undefined
            }
        ]);

        const expectedCreatures = environment.toJSON().creatures;
        expect(expectedCreatures).to.have.lengthOf(1);
        expect(expectedCreatures).to.include.members([
            '00001'
        ]);

        expect(options.onEggHatched.calledWithMatch(
            {
                creature: new MockCreature('00001'),
                elapsedGestationTime: 15,
                gestationTime: 15,
                x: 0,
                y: 0
            },
            1
        )).to.be.true;
    });
});
