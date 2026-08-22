const bodyCost = {
    MOVE: 50,
    WORK: 100,
    CARRY: 50,
    ATTACK: 80,
    RANGED_ATTACK: 150,
    HEAL: 250,
    CLAIM: 600,
    TOUGH: 10
};

function randomName(prefix) {
    return `${prefix}_${Math.random().toString(36).substring(2, 8)}`;
}

function getBodyCost(body) {

    let cost = 0;

    for (const part of body) {
        cost += bodyCost[part];
    }

    return cost;
}

module.exports = {
    bodyCost,
    getBodyCost,
    randomName
};