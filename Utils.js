/* Utils.js
 * Petites fonctions utilitaires utilisées par le reste du code.
 * - bodyCost : map du coût en énergie par part de creep
 * Les fonctions exportées sont commentées individuellement ci-dessous.
 */
const bodyCost = {
    [MOVE]: 50,
    [WORK]: 100,
    [CARRY]: 50,
    [ATTACK]: 80,
    [RANGED_ATTACK]: 150,
    [HEAL]: 250,
    [CLAIM]: 600,
    [TOUGH]: 10
};

/**
* @param {pos} pos1
* @param {pos} pos2
*/
// Calcul de la distance Manhattan (distance en grille 4-voisin)
// pos1 et pos2 doivent être des objets avec x et y.
function Manhattan(pos1, pos2)
{
    //console.log("pos1: ",pos1.x, ",", pos1.y);
    //console.log("pos2: ",pos2.x, ",", pos2.y);
    var distance = Math.abs( pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
    //console.log("Manhattan ==> ",distance);
    return distance;
}

// Génère un nom aléatoire lisible préfixé par 'prefix'.
function randomName(prefix) {
    return `${prefix}_${Math.random().toString(36).substring(2, 8)}`;
}

// Calcule le coût total en énergie d'un tableau de parts.
// Le paramètre 'body' peut être :
// - un tableau de constantes (ex: [WORK, CARRY, MOVE])
// - un tableau de parties d'un creep (ex: creep.body, où chaque élément est {type: WORK, hits: ...})
// La fonction supporte les deux formes.
function getBodyCost(body) {

    let cost = 0;

    for (const part of body) {
        const key = (part && typeof part === 'object' && part.type !== undefined) ? part.type : part;
        cost += bodyCost[key] || 0;
    }
    return cost;
}

// Export des utilitaires utilisés par d'autres modules
module.exports = {
    Manhattan,
    bodyCost,
    getBodyCost,
    randomName
};