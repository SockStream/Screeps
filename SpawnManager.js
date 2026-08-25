/**
 * Decides which creeps must be spawned next according to room priority and current demand.
 * Spec: SPAWN-001, SPAWN-002, SPAWN-003, SPAWN-004, PRIORITY-002
 */
class SpawnManager {
  /**
   * Creates a spawn manager for a specific room.
   * @param {Room} room The room whose spawns are managed.
   * @returns {void}
   */
  constructor(room) {
    this.room = room;
    this.memory = room.memory || (room.memory = {});
  }

  /**
   * Returns the active role priority order for the room.
   * @returns {string[]}
   */
  getPriorityOrder() {
    const controller = this.room.controller;
    const hasThreat = this.room.find(FIND_HOSTILE_CREEPS).length > 0 || (controller && controller.safeMode > 0);
    return hasThreat ? this.memory.priority.danger : this.memory.priority.default;
  }

  /**
   * Counts the currently active creeps with a role in this room.
   * @param {string} role The role to count.
   * @returns {number}
   */
  countRole(role) {
    return Object.values(Game.creeps).filter((creep) => creep.memory.role === role && creep.room.name === this.room.name).length;
  }

  /**
   * Returns the desired target population for a role.
   * @param {string} role The role to evaluate.
   * @returns {number}
   */
  getTargetCount(role) {
    const targets = this.memory.targets || { harvester: 2, builder: 1, upgrader: 2, defender: 0, attacker: 0 };

    if (role === 'harvester') {
      return Math.max(targets.harvester || 2, this.room.find(FIND_SOURCES).length * 2);
    }

    if (role === 'upgrader') {
      const controller = this.room.controller;
      const minimum = controller && controller.my ? Math.max(1, this.room.find(FIND_SOURCES).length) : 0;
      return Math.max(targets.upgrader || minimum, minimum);
    }

    return targets[role] || 0;
  }

  /**
   * Computes the total cost of a body array.
   * @param {string[]} body The body parts to value.
   * @returns {number}
   */
  getBodyCost(body) {
    return (body || []).reduce((total, part) => total + (BODYPART_COST[part] || 0), 0);
  }

  /**
   * Builds the largest valid body for a role within the room budget.
   * @param {string} role The role to spawn.
   * @param {number} maxEnergy The maximum energy available for spawning.
   * @returns {string[]}
   */
  buildBody(role, maxEnergy) {
    const templateMap = {
      harvester: [WORK, WORK, CARRY, MOVE],
      builder: [WORK, CARRY, MOVE, MOVE],
      upgrader: [WORK, CARRY, MOVE, MOVE],
      defender: [TOUGH, TOUGH, MOVE, MOVE],
      attacker: [ATTACK, MOVE, MOVE]
    };

    const template = templateMap[role] || templateMap.harvester;
    const body = [];
    const budget = Math.min(maxEnergy, this.room.energyAvailable);

    for (const part of template) {
      const candidate = body.concat(part);
      if (this.getBodyCost(candidate) > budget) {
        break;
      }
      body.push(part);
    }

    return body.length > 0 ? body : [WORK];
  }

  /**
   * Builds the list of roles that still need to be spawned in priority order.
   * @returns {string[]}
   */
  getSpawnOrder() {
    const order = [];
    for (const role of this.getPriorityOrder()) {
      if (this.countRole(role) < this.getTargetCount(role)) {
        order.push(role);
      }
    }
    return order;
  }

  /**
   * Attempts to spawn the highest-priority missing role for the room.
   * @returns {void}
   */
  run() {
    const spawns = this.room.find(FIND_MY_SPAWNS);
    if (spawns.length === 0) {
      return;
    }

    const order = this.getSpawnOrder();
    if (order.length === 0) {
      return;
    }

    for (const spawn of spawns) {
      if (spawn.spawning) {
        continue;
      }

      for (const role of order) {
        const body = this.buildBody(role, this.room.energyCapacityAvailable);
        const cost = this.getBodyCost(body);

        if (cost > this.room.energyAvailable) {
          continue;
        }

        const name = `${role}_${Game.time}`;
        const result = spawn.spawnCreep(body, name, { memory: { role } });
        if (result === OK) {
          return;
        }
      }
    }
  }
}

module.exports = SpawnManager;
