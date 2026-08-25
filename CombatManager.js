/**
 * Processes hostile detections and coordinates room defense priorities.
 * Spec: PRIORITY-007, PRIORITY-008, 60-combat.md
 */
class CombatManager {
  /**
   * Creates a combat manager for a single room.
   * @param {Room} room The room to defend.
   * @returns {void}
   */
  constructor(room) {
    this.room = room;
  }

  /**
   * Triggers defensive responses only when hostiles are detected and safe mode is not active.
   * @returns {void}
   */
  run() {
    if (!this.room) {
      return;
    }

    const hostiles = this.room.find(FIND_HOSTILE_CREEPS);
    if (hostiles.length === 0) {
      return;
    }

    const controller = this.room.controller;
    if (controller && controller.safeMode > 0) {
      return;
    }

    this.room.memory.targets = this.room.memory.targets || {};
    this.room.memory.targets.defender = Math.max(this.room.memory.targets.defender || 0, hostiles.length);

    const defenders = Object.values(Game.creeps).filter((creep) => creep.memory.role === 'defender' && creep.room.name === this.room.name);
    for (const defender of defenders) {
      const target = defender.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
      if (!target) {
        continue;
      }

      const result = defender.attack(target);
      if (result === ERR_NOT_IN_RANGE) {
        defender.moveTo(target);
      }
    }
  }
}

module.exports = CombatManager;
