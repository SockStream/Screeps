const { cout } = require('Utils');
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

    console.log("Tick :", Game.time);
    console.log("Nombre de creeps :", Object.keys(Game.creeps).length);
};