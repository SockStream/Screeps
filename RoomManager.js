/**
 * Manages room-level priorities, memory initialization, and delegation to the specialist managers.
 * Spec: PRIORITY-001, PRIORITY-005, PRIORITY-006, PRIORITY-008
 */
class RoomManager {
  /**
   * Creates a room manager bound to a single room.
   * @param {Room} room The room to manage.
   * @returns {void}
   */
  constructor(room) {
    this.room = room;
    this.memory = room.memory || (room.memory = {});
  }

  /**
   * Ensures that the room owns the memory structure required by the current rules.
   * @returns {void}
   */
  ensureMemory() {
    const sourceCount = this.room.find(FIND_SOURCES).length;

    this.memory.priority = this.memory.priority || {
      default: ['harvester', 'builder', 'upgrader', 'defender', 'attacker'],
      danger: ['harvester', 'defender', 'attacker', 'builder', 'upgrader']
    };

    this.memory.targets = this.memory.targets || {
      harvester: Math.max(2, sourceCount * 2),
      builder: Math.max(1, sourceCount),
      upgrader: 2,
      defender: 0,
      attacker: 0
    };

    this.memory.alert = this.memory.alert || {
      hostileDetected: false,
      safeMode: false
    };
  }

  /**
   * Runs the room-level turn by first initializing memory and then delegating to spawn, construction, and combat logic.
   * @returns {void}
   */
  run() {
    if (!this.room) {
      return;
    }

    this.ensureMemory();

    const SpawnManager = require('./SpawnManager');
    const ConstructionManager = require('./ConstructionManager');
    const CombatManager = require('./CombatManager');

    new SpawnManager(this.room).run();
    new ConstructionManager(this.room).run();
    new CombatManager(this.room).run();
  }
}

module.exports = RoomManager;
