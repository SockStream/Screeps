/*
 * ColonyManager.js
 * Responsable de la gestion des spawns et des décisions de construction/spawn.
 *
 * Explications :
 * - Chaque spawn exécute manageSpawn(spawn) pour décider quel creep créer
 *   et quelles constructions lancer.
 * - Le système gère des priorités (rôles et bâtiments) qui peuvent être
 *   modifiées à la volée via setPriority(...). Ces priorités sont persistées
 *   dans Memory pour survivre aux reloads.
 * - Les fonctions utilitaires aident au calcul des coûts, placements de
 *   sites de construction, et aux estimations simples de flux d'énergie.
 *
 * Les commentaires ci-dessous expliquent chaque fonction et bloc.
 */
const Utils = require('./Utils');
const GameSettings = require('./GameSettings');
const roleHarvester = require('role_harvester');

// Default and per-spawn priority maps (modifiable at runtime)
const defaultRolePriorities = {
    "builder": 3,
    "upgrader": 2,
    "harvester": 1,
    "warrior": 4
};
const spawnRolePriorities = {}; // { spawnName: { role: priority, ... } }

const defaultBuildingPriorities = {
    "extension": 1,
    "road": 2,
    "wall": 3,
    "controller": 4
};
const spawnBuildingPriorities = {}; // { spawnName: { building: priority, ... } }

// Retourne la table des priorités des rôles pour un spawn donné.
// Fusionne les priorités par défaut avec les overrides spécifiques au spawn.
// Exemple de retour : { builder: 3, upgrader: 2, ... }
function getRolePriorities(spawn) {
    return Object.assign({}, defaultRolePriorities, spawnRolePriorities[spawn.name] || {});
}
// Même principe que getRolePriorities mais pour les bâtiments (extension, road, wall, ...)
function getBuildingPriorities(spawn) {
    return Object.assign({}, defaultBuildingPriorities, spawnBuildingPriorities[spawn.name] || {});
}

// Fonctions pour charger et sauvegarder les priorités dans Memory.
// Cela permet de garder les réglages quand le script est rechargé.
function loadPrioritiesFromMemory() {
    if (!Memory) return;
    const mem = Memory.colonyPriorities || {};
    if (mem.roleDefaults) Object.assign(defaultRolePriorities, mem.roleDefaults);
    if (mem.buildingDefaults) Object.assign(defaultBuildingPriorities, mem.buildingDefaults);
    if (mem.spawnRolePriorities) Object.assign(spawnRolePriorities, mem.spawnRolePriorities);
    if (mem.spawnBuildingPriorities) Object.assign(spawnBuildingPriorities, mem.spawnBuildingPriorities);
}

// Enregistre l'état courant des priorités dans Memory.colonyPriorities.
function savePrioritiesToMemory() {
    if (!Memory) return;
    Memory.colonyPriorities = Memory.colonyPriorities || {};
    Memory.colonyPriorities.roleDefaults = Object.assign({}, defaultRolePriorities);
    Memory.colonyPriorities.buildingDefaults = Object.assign({}, defaultBuildingPriorities);
    Memory.colonyPriorities.spawnRolePriorities = Object.assign({}, spawnRolePriorities);
    Memory.colonyPriorities.spawnBuildingPriorities = Object.assign({}, spawnBuildingPriorities);
}

// Load at module initialization
try { loadPrioritiesFromMemory(); } catch (e) { console.log('Error loading colony priorities from Memory', e); }

/**
 * API publique pour modifier les priorités à l'exécution.
 * - kind: 'role' ou 'building'
 * - key: nom du rôle (ex: 'builder') ou clé de bâtiment (ex: 'extension')
 * - priority: entier (plus grand => plus prioritaire)
 * - spawnName: optionnel, si fourni la priorité est appliquée uniquement à ce spawn
 *
 * La fonction met à jour les maps en mémoire et persiste immédiatement dans Memory.
 */
function setPriority(kind, key, priority, spawnName) {
    if (kind !== 'role' && kind !== 'building') {
        throw new Error("setPriority: kind must be 'role' or 'building'");
    }
    if (spawnName) {
        if (kind === 'role') {
            spawnRolePriorities[spawnName] = spawnRolePriorities[spawnName] || {};
            spawnRolePriorities[spawnName][key] = priority;
        } else {
            spawnBuildingPriorities[spawnName] = spawnBuildingPriorities[spawnName] || {};
            spawnBuildingPriorities[spawnName][key] = priority;
        }
    } else {
        if (kind === 'role') defaultRolePriorities[key] = priority;
        else defaultBuildingPriorities[key] = priority;
    }
    try { savePrioritiesToMemory(); } catch (e) { console.log('Error saving colony priorities to Memory', e); }
}


// Crée un creep via le spawn.
// - spawn: l'objet Spawn (ex: Game.spawns['Spawn1'])
// - body: tableau de parts (ex: [WORK,CARRY,MOVE])
// - role: chaîne utilisée pour le nom et la mémoire
// NOTE: spawn.spawnCreep est asynchrone (retourne un code), ici on n'inspecte pas le résultat.
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

// Petite fonction utilitaire qui convertit une 'key' logique ('extension', 'road', ...)
// en la constante STRUCTURE_* correspondante reconnue par l'API Screeps.
// Exemple : 'extension' -> STRUCTURE_EXTENSION
function buildingKeyToStructure(key) {
    switch (key) {
        case 'extension': return STRUCTURE_EXTENSION;
        case 'road': return STRUCTURE_ROAD;
        case 'wall': return STRUCTURE_WALL;
        case 'controller': return STRUCTURE_CONTROLLER;
        default: return null;
    }
}

// Crée un site de construction à proximité du spawn.
// Algorithme : scan en anneaux (rayons croissants) autour du spawn et
// tente de placer un site sur la première case libre (pas de structure, pas de site, pas de mur).
// - spawn: l'objet spawn qui demande l'action
// - buildingKey: clé logique ('extension','road','wall')
// NOTE: pour 'controller' on n'appelle pas createConstructionSite car le contrôleur
// doit être upgradé par des creeps (on l'ignore ici).
function CreateStructure(spawn, buildingKey) {
    const room = spawn.room;
    if (!room) return;

    // 'controller' n'est pas construit par createConstructionSite
    if (buildingKey === 'controller') {
        console.log(`${spawn.name}: controller action requested — upgrading the controller should be handled by upgraders, skipping CreateStructure.`);
        return;
    }

    const structureConst = buildingKeyToStructure(buildingKey);
    if (!structureConst) {
        console.log(`${spawn.name}: unknown building key ${buildingKey}`);
        return;
    }

    const maxRange = 6; // rayon de recherche autour du spawn
    const terrain = room.getTerrain ? room.getTerrain() : null;

    // On parcourt les anneaux de distance pour favoriser les cases proches
    for (let r = 1; r <= maxRange; r++) {
        for (let dx = -r; dx <= r; dx++) {
            for (let dy = -r; dy <= r; dy++) {
                if (Math.abs(dx) + Math.abs(dy) !== r) continue; // on scanne la couronne
                const x = spawn.pos.x + dx;
                const y = spawn.pos.y + dy;
                if (x < 0 || x >= 50 || y < 0 || y >= 50) continue;

                // éviter les cases occupées, les sites existants, et les murs
                const hasStructure = room.lookForAt(LOOK_STRUCTURES, x, y).length > 0;
                const hasSite = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length > 0;
                const isWall = terrain ? terrain.get(x, y) === TERRAIN_MASK_WALL : false;

                if (hasStructure || hasSite || isWall) continue;

                const res = room.createConstructionSite(x, y, structureConst);
                if (res === OK) {
                    console.log(`${spawn.name}: created construction site for ${buildingKey} at ${x},${y}`);
                    return;
                } else {
                    // On ignore certains codes d'erreur non bloquants, mais on logge les autres.
                    if (res !== ERR_INVALID_TARGET && res !== ERR_NOT_OWNER && res !== ERR_FULL && res !== ERR_TIRED) {
                        console.log(`${spawn.name}: failed to create ${buildingKey} at ${x},${y} -> ${res}`);
                    }
                }
            }
        }
    }

    console.log(`${spawn.name}: could not find a free position to place ${buildingKey} within range ${maxRange}`);
}

// Estime l'apport (énergie) provenant des harvesters associés à ce spawn.
// Utilise estimateHarvesterIncome pour chaque creep lié au spawn.
function estimateIncome(spawn)
{
    var income = 0;
    const creeps = Object.values(Game.creeps)
    .filter(creep => creep.memory.spawn === spawn.name);
    creeps.forEach(c => income += roleHarvester.estimateHarvesterIncome(c));

    return income;
}

// Estime la consommation d'énergie future liée :
// - au remplacement des creeps existants (coût du body / ticksToLive)
// - aux sites de construction en cours (coût estimé de construction réparti sur le temps)
// Renvoie une valeur approximative servant à la planification.
function EstimerConsommation(spawn)
{
    const room = spawn.room;
    var consommation = 0.0;
    const creeps = Object.values(Game.creeps)
    .filter(creep => creep.memory.spawn === spawn.name);
    const sites = room.find(FIND_CONSTRUCTION_SITES);

    // estimation de l'énergie nécessaire pour le remplacement des creeps
    creeps.forEach(c => consommation += Utils.getBodyCost(c.body) / c.ticksToLive);
    // estimation de l'énergie nécessaire pour la construction
    sites.forEach(s => consommation += CONSTRUCTION_COST[s.structureType] / GameSettings.Construction_time_planned)
    
    return consommation;
}

// manageSpawn: logique centrale par spawn
// - choisit quel rôle spammer en fonction des priorités, de l'énergie disponible et des menaces
// - déclenche la création de sites de construction si besoin
function manageSpawn(spawn)
{
    // Récupère tous les creeps associés à ce spawn
    const creeps = Object.values(Game.creeps)
    .filter(creep => creep.memory.spawn === spawn.name);

    console.log(
        spawn.name,
        "possède",
        creeps.length,
        "creeps"
    );

    // Récupère les priorités pour ce spawn (fusion defaults + overrides)
    const rolePriorities = getRolePriorities(spawn);

    // Coûts approximatifs en énergie pour les rôles basiques utilisés ici
    const roleRequirements = {
        "harvester": Utils.getBodyCost([WORK, CARRY, MOVE]),
        "builder": Utils.getBodyCost([WORK, CARRY, MOVE, TOUGH]),
        "upgrader": Utils.getBodyCost([WORK, CARRY, MOVE]),
        "warrior": Utils.getBodyCost([TOUGH, ATTACK, MOVE])
    };

    // Détection de menaces immédiates dans la room
    const threats = spawn.room.find(FIND_HOSTILE_CREEPS).concat(spawn.room.find(FIND_HOSTILE_STRUCTURES));
    const hasThreats = threats.length > 0;
    if (hasThreats) {
        console.log(`${spawn.name}: detected ${threats.length} threats in room ${spawn.room.name}`);
    }
    else{
        console.log(`${spawn.name}: no threats detected in room ${spawn.room.name}`);
    }
    
    // Choix du meilleur rôle à spawn : on parcourt les priorités et on prend celui
    // avec la priorité la plus élevée que l'on peut payer en énergie.
    let selectedRole = null;
    let maxPriority = -1;
    let energyNeeded = 0;

    for (const [role, priority] of Object.entries(rolePriorities)) {
        // Si des menaces sont présentes, on force la priorité envers les warriors
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

    // Lance le spawn si on a choisi un rôle
    if (selectedRole) {
        console.log(`Spawning ${selectedRole} (Energy: ${spawn.energyAvailable}/${energyNeeded})`);
        CreateCreep(spawn, GameSettings[`Basic${selectedRole}`], selectedRole);
    }

    // Gère la planification des constructions pour ce spawn
    const buildingPriorities = getBuildingPriorities(spawn);

    // On évalue si certains types de bâtiments manquent encore
    const neededBuildings = [];
    const room = spawn.room;

    // Règles simples : si moins d'extensions que le maximum, on en veut
    if (room.find(FIND_STRUCTURES).filter(s => s.structureType == STRUCTURE_EXTENSION).length < GameSettings.maxExtensions) {
        neededBuildings.push(STRUCTURE_EXTENSION);
    }

    // Similaire pour les routes
    if (room.find(FIND_STRUCTURES).filter(s => s.structureType == STRUCTURE_ROAD).length < GameSettings.maxRoads) {
        neededBuildings.push(STRUCTURE_ROAD);
    }

    // Et pour les murs
    if (room.find(FIND_STRUCTURES).filter(s => s.structureType == STRUCTURE_WALL).length < GameSettings.maxWalls) {
        neededBuildings.push(STRUCTURE_WALL);
    }

    // Si le contrôleur est bas niveau, on le marque comme prioritaire (mais
    // il n'est pas construit via createConstructionSite)
    if (room.controller && room.controller.level < 5) {
        neededBuildings.push(STRUCTURE_CONTROLLER);
    }

    // Ordre des bâtiments selon les priorités définies pour le spawn
    const buildingOrder = Object.keys(buildingPriorities).sort((a, b) => buildingPriorities[b] - buildingPriorities[a]);

    // Boucle pour potentiellement créer des sites de construction suivant l'ordre
    for (const buildingKey of buildingOrder) {
        const structureConst = buildingKeyToStructure(buildingKey);
        if (!structureConst) continue;
        // On ne lance une construction que si le spawn a déjà un minimum d'énergie
        if (spawn.energyAvailable >= Utils.getBodyCost([WORK, CARRY, MOVE])) {
            const existingCount = room.find(FIND_STRUCTURES).filter(s => s.structureType == structureConst).length;
            // On récupère le plafond configuré pour ce type de bâtiment
            const maxAllowed = (GameSettings.maxBuildings && GameSettings.maxBuildings[buildingKey] !== undefined)
                ? GameSettings.maxBuildings[buildingKey]
                : (GameSettings[`max${buildingKey.charAt(0).toUpperCase() + buildingKey.slice(1)}`] || 0);
            if (existingCount < maxAllowed) {
                // Demande la création d'un site (CreateStructure s'occupera du placement)
                CreateStructure(spawn, buildingKey);
            }
        }
    }
}


// Fonction appelée à chaque tick par main.js
// Parcourt tous les spawns et exécute la gestion associée.
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
        // Logique principale par spawn
        manageSpawn(spawn);
        // Quelques logs d'état pour aider au debug
        console.log(spawn.name, " consommation estimée: ", EstimerConsommation(spawn));
        console.log(spawn.name, " apport estimé: ", estimateIncome(spawn));
    }

};

// API publique du module
module.exports = 
{
    run,
    setPriority
}