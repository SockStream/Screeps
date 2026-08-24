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
function Manhattan(pos1, pos2)
{
    console.log("pos1: ",pos1.x, ",", pos1.y);
    console.log("pos2: ",pos2.x, ",", pos2.y);
    var distance = Math.abs( pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
    console.log("Manhattan ==> ",distance);
    return distance;
}

function randomName(prefix) {
    return `${prefix}_${Math.random().toString(36).substring(2, 8)}`;
}

function getBodyCost(body) {

    let cost = 0;

    for (const part of body) {
        cost += bodyCost[part.type];
    }
    return cost;
}

module.exports = {
    Manhattan,
    bodyCost,
    getBodyCost,
    randomName
};