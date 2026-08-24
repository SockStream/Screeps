const Utils = require('./Utils');
const GameSettings = require('GameSettings');
const roleHarvester = require('role_harvester');

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

function estimateIncome(spawn)
{
    var income = 0;
    const creeps = Object.values(Game.creeps)
    .filter(creep => creep.memory.spawn === spawn.name);
    creeps.forEach(c => income += roleHarvester.estimateHarvesterIncome(c));

    return income;
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
    const rolePriorities = {
        "builder": 3,
        "upgrader": 2,
        "harvester": 1,
        "warrior": 4
    };

    // Calculate energy needs for all roles
    const roleRequirements = {
        "harvester": Utils.getBodyCost([WORK, CARRY, MOVE]),
        "builder": Utils.getBodyCost([WORK, CARRY, MOVE, TOUGH]),
        "upgrader": Utils.getBodyCost([WORK, CARRY, MOVE]),
        "warrior": Utils.getBodyCost([TOUGH, ATTACK, MOVE])
    };

    // Check for immediate threats
    const threats = spawn.room.find(FIND_HOSTILE_CREEPS).concat(spawn.room.find(FIND_HOSTILE_STRUCTURES));
    const hasThreats = threats.length > 0;

    // Determine optimal spawn
    let selectedRole = null;
    let maxPriority = -1;
    let energyNeeded = 0;

    for (const [role, priority] of Object.entries(rolePriorities)) {
        if (hasThreats && priority < rolePriorities.warrior) continue;
        
        const requiredEnergy = roleRequirements[role];
        if (spawn.energyAvailable >= requiredEnergy) {
            if (priority > maxPriority) {
                maxPriority = priority;
                selectedRole = role;
                energyNeeded = requiredEnergy;
            }
        }
    }

    if (selectedRole) {
        console.log(`Spawning ${selectedRole} (Energy: ${spawn.energyAvailable}/${energyNeeded})`);
        CreateCreep(spawn, GameSettings[`Basic${selectedRole}`], selectedRole);
    }

    // Run all existing creeps
    creeps.forEach(c => {
        if (c.memory.role in roleHarvester) {
            roleHarvester[c.memory.role].run(c);
        }
    });
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
        console.log(spawn.name, " apport estimé: ", estimateIncome(spawn));
    }

};

module.exports = 
{
    run
}