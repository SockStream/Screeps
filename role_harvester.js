/* role_harvester.js
 * Comportement d'un harvester : trouver une source, la récolter,
 * puis transférer l'énergie vers une structure (spawn/extension/tower).
 */
const Utils = require('./Utils');

/**
* @param {Creep} creep
*/
// Recherche la source la plus proche du creep en utilisant la distance de Manhattan.
// Retourne l'objet Source (ou null si aucune source trouvée).
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
// Comportement principal du harvester :
// 1) Si on n'a pas de cible, on choisit la source la plus proche et on la stocke en mémoire
// 2) Si on a une cible et de la place, on harvest la source (ou on se déplace si hors portée)
// 3) Si le conteneur est plein, on transfère l'énergie vers la première structure admissible
function run (creep)
{
    console.log("creep name: ",creep.name);
    console.log("capacity =>", creep.store.getFreeCapacity());
    if (creep.store.getCapacity() > 0 && !creep.memory.target) // on cherche la ressource la plus proche
    {
        console.log("cas 1");
        const spawn = creep.memory.spawn;
        var closestSource = findClosestSource(creep);
        console.log("source trouvée :", closestSource);
        console.log("source id :", closestSource ? closestSource.id : "NULL");

        if (closestSource) creep.memory.target = closestSource.id;
    }
    if (creep.memory.target && creep.store.getFreeCapacity() > 0)
    {
        // ATTENTION: il y avait un console.log affichant 'code' avant qu'il ne soit défini.
        // Cela semble être un oubli. Ici on appelle harvest puis on inspecte le code.
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
// Retourne une estimation de l'apport en énergie par tick pour un harvester.
// Basé sur : distance au spawn (coût de trajet), nombre de WORK/CARRY/MOVE actifs, etc.
// Cette estimation est approximative mais utile pour la planification.
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

// Export des fonctions du rôle
module.exports = 
{
    run,
    estimateHarvesterIncome
};