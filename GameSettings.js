/* GameSettings.js
 * Fichier de configuration centralisé pour valeurs par défaut.
 * Modifiez ces constantes pour ajuster le comportement global du colony manager.
 */

// Nombre maximal d'harvesters souhaités (valeur par défaut)
const max_Harvester = 2;
// Seuils et paramètres divers
const min_Energy_per_turn = 10;
// Temps planifié (en ticks) pour répartir le coût de construction dans les estimations
const Construction_time_planned = 150;

// Comptes maximum autorisés par type de structure (par room)
const maxExtensions = 5;
const maxRoads = 100;
const maxWalls = 200;

// Map utilisée par ColonyManager pour vérifier les plafonds
const maxBuildings = {
    extension: maxExtensions,
    road: maxRoads,
    wall: maxWalls,
    controller: 1 // placeholder, le contrôleur n'est pas 'construit' via createConstructionSite
};

// Corps de base (body) pour chaque rôle. Ajuster selon votre stratégie.
const BasicHarvester = [WORK, CARRY, MOVE];
const BasicBuilder = [WORK, CARRY, MOVE, MOVE];
const BasicUpgrader = [WORK, CARRY, MOVE];
const BasicWarrior = [TOUGH, ATTACK, MOVE, MOVE];

// Export des réglages
module.exports =
{
    max_Harvester,
    min_Energy_per_turn,
    Construction_time_planned,
    maxExtensions,
    maxRoads,
    maxWalls,
    maxBuildings,
    BasicHarvester,
    BasicBuilder,
    BasicUpgrader,
    BasicWarrior
}