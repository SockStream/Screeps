// main.js : point d'entrée exécuté à chaque tick par Screeps
// Appelle le ColonyManager pour gérer tous les spawns
const { cout } = require('./Utils');
const ColonyManager = require('./ColonyManager');

module.exports.loop = function () {

    // Code exécuté à chaque tick
    ColonyManager.run();
    const spawn = Game.spawns["Spawn1"];

    if (!spawn) {
        console.log("Spawn1 introuvable");
        return;
    }

    const room = spawn.room;

    // Logs utiles pour suivre l'état du monde
    console.log("Tick :", Game.time);
    console.log("Nombre de creeps :", Object.keys(Game.creeps).length);
};