const Utils = require('./Utils');

/**
* @param {Creep} creep
*/
function findClosestSource(creep)
{
    var target = null;
    var sources = creep.room.find(FIND_SOURCES);
    var minDist = Number.MAX_SAFE_INTEGER;
    sources.forEach(s =>
    {
        var dist = Utils.Manhattan(creep.pos,s.pos)
        if(dist < minDist)
        {
            minDist = dist;
            target = s;
        }
    }
    );
    return target;
}

/**
* @param {Creep} creep
*/
function run (creep)
{
    console.log("creep name: ",creep.name);
    console.log("capacity =>", creep.store.getFreeCapacity());
    if (creep.store.getCapacity() > 0 && !creep.memory.target) //on cherche la resource la plus proche
    {
        console.log("cas 1");
        const spawn = creep.memory.spawn;
        var closestSource = findClosestSource(creep);
        console.log("source trouvée :", closestSource);
        console.log("source id :", closestSource ? closestSource.id : "NULL");

        creep.memory.target = closestSource.id;
    }
    if (creep.memory.target && creep.store.getFreeCapacity() > 0)
    {
        console.log("harvest result :", code);
        console.log("target: ", creep.memory.target);
        const source = Game.getObjectById(creep.memory.target);
        var code = creep.harvest(source);
        if( code == ERR_NOT_IN_RANGE) {
            creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
    }
    if(creep.store.getFreeCapacity() == 0)
    {
        console.log("cas 3");
        var targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_EXTENSION ||
                    structure.structureType == STRUCTURE_SPAWN ||
                    structure.structureType == STRUCTURE_TOWER) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
        if(targets.length > 0)
        {
            if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
    }
}

/**
* @param {Creep} creep
*/
function estimateHarvesterIncome(creep) {
    if(!creep.memory.target)
    {
        return 0;
    }

    var target = Game.getObjectById(creep.memory.target);
    const spawn = Game.spawns[creep.memory.spawn];
    console.log("target ", target);
    console.log("spawn ", spawn);
    const distance = Utils.Manhattan(spawn.pos, target.pos);
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

module.exports = 
{
    run,
    estimateHarvesterIncome
};