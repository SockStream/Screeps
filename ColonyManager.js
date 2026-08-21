const Utils = require('./Utils');

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
    }

};

module.exports = 
{
    run
}