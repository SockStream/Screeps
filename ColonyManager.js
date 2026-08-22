const Utils = require('./Utils');
const GameSettings = require('GameSettings');


function CreateCreep(spawn, body, role) //spawn,[WORK,CARRY,MOVE],"harvester"
{
    spawn.spawnCreep(
        body,
        Utils.randomName(role),
        {
            memory: {
                role: role,
                spawn: spawn.name
            }
        }
    );
}

function estimateHarvesterIncome(creep) {

    const distance = Utils.Manhattan(creep.memory.spawn, creep.memory.target);
    const work = creep.getActiveBodyparts(WORK);
    const carry = creep.getActiveBodyparts(CARRY);
    const move = creep.getActiveBodyparts(MOVE);

    const nonMoveParts = creep.body.length - move;

    const speed = Math.min(
        1,
        (move * 2) / nonMoveParts
    );

    const harvestPerTick = work * 2;
    const capacity = carry * CARRY_CAPACITY;

    const harvestTicks = capacity / harvestPerTick;
    const travelTicks = (distance * 2) / speed;

    const cycleTicks = harvestTicks + travelTicks;

    return capacity / cycleTicks;
}

function EstimerConsommation(spawn)
{
    const room = spawn.room;
    var consommation = 0.0;
    const creeps = Object.values(Game.creeps)
    .filter(creep => creep.memory.spawn === spawn.name);
    const sites = room.find(FIND_CONSTRUCTION_SITES);

    //estimation de l'énergie nécessaire pour le remplacement des creeps
    creeps.forEach(c => consommation += Utils.getBodyCost(c.body) / c.ticksToLive);
    //estimation de l'énergie nécessaire pour la construction
    sites.forEach(s => consommation += CONSTRUCTION_COST[s.structureType] / GameSettings.Construction_time_planned)
    
    return consommation;
}

function manageSpawn(spawn)
{
    const creeps = Object.values(Game.creeps)
    .filter(creep => creep.memory.spawn === spawn.name);

    console.log(
        spawn.name,
        "possède",
        creeps.length,
        "creeps"
    );
    const harvesters = creeps.filter(creep => creep.memory.role == "harvester");
    if(!harvesters.length || (harvesters.length < GameSettings.maxHarvester && spawn.energyAvailable >= Utils.getBodyCost([WORK,MOVE,CARRY])))
    {
        CreateCreep(spawn,GameSettings.BasicHarvester,"harvester");
    }

    //harvesters.forEach(h => harvester.run(h));
}

function run ()
{
    for (const spawn of Object.values(Game.spawns)) {
        console.log(spawn.name);

        const room = spawn.room;
        console.log(
            "Spawn :", spawn.name,
            "Room :", room.name,
            "Energy :", room.energyAvailable
        );
        manageSpawn(spawn);
        console.log(spawn.name, " consommation estimée: ", EstimerConsommation(spawn));
    }

};

module.exports = 
{
    run
}