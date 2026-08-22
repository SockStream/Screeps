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

    harvesters.forEach(h => h.run());
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