module.exports.loop = function () {

    // Code exécuté à chaque tick

    const spawn = Game.spawns["Spawn1"];

    if (!spawn) {
        console.log("Spawn1 introuvable");
        return;
    }

    console.log("Tick :", Game.time);
    console.log("Nombre de creeps :", Object.keys(Game.creeps).length);
};