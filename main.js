/**
 * Bootstraps the Screeps bot every tick by cleaning dead creep memory and delegating work to room-level managers.
 * Spec: 00-overview.md, 01-architecture.md, 90-priorities.md
 * @returns {void}
 */
function loop() {
  Memory.rooms = Memory.rooms || {};
  Memory.creeps = Memory.creeps || {};

  for (const creepName in Memory.creeps) {
    if (!Game.creeps[creepName]) {
      delete Memory.creeps[creepName];
    }
  }

  for (const room of Object.values(Game.rooms)) {
    const RoomManager = require('./RoomManager');
    const roomManager = new RoomManager(room);
    roomManager.run();
  }

  for (const room of Object.values(Game.rooms)) {
    const CreepManager = require('./CreepManager');
    CreepManager.run(room);
  }
}

module.exports.loop = loop;
