/**
 * Handles room construction priorities, roads, and storage/extension placement.
 * Spec: CONST-001, CONST-002, CONST-003, CONST-004
 */
const pathUtil = require('./utils.path');

class ConstructionManager {
  /**
   * Creates a construction manager for one room.
   * @param {Room} room The room to manage.
   * @returns {void}
   */
  constructor(room) {
    this.room = room;
  }

  /**
   * Creates roads and high-priority structures as required by the room strategy.
   * @returns {void}
   */
  run() {
    if (!this.room) {
      return;
    }

    this.ensureRoads();
    this.ensureStorage();
    this.ensureExtensions();
  }

  /**
   * Creates roads along source-to-spawn paths while respecting the tolerance defined in the spec
   * (walls must not increase the minimal path by more than 20%). If the existing path is longer
   * than the allowed tolerance compared to the ideal path (ignoring walls), road creation for that
   * source is skipped and a warning is logged.
   * @returns {void}
   */
  ensureRoads() {
    const spawn = this.room.find(FIND_MY_SPAWNS)[0];
    if (!spawn) {
      return;
    }

    for (const source of this.room.find(FIND_SOURCES)) {
      // compute ideal and current path lengths
      const idealLen = pathUtil.computePathLength(this.room, source.pos, spawn.pos, true);
      const currentLen = pathUtil.computePathLength(this.room, source.pos, spawn.pos, false);

      if (!currentLen || currentLen === 0) {
        // no path currently exists, skip road creation for this source
        console.log(`[CONST] Room ${this.room.name}: no current path between source ${source.id} and spawn, skipping roads.`);
        continue;
      }

      if (currentLen > Math.ceil(idealLen * 1.2)) {
        // violation of the 20% tolerance — log and skip
        console.log(`[CONST] Room ${this.room.name}: path between source ${source.id} and spawn increases by more than 20% due to walls (${currentLen} > ${Math.ceil(idealLen * 1.2)}). Skipping road creation for this source.`);
        continue;
      }

      // proceed to create roads along the current path, skipping wall tiles
      const path = this.room.findPath(source.pos, spawn.pos, {
        ignoreCreeps: true,
        ignoreRoads: false
      });

      for (const step of path) {
        const position = this.room.getPositionAt(step.x, step.y);
        if (!position) {
          continue;
        }

        const terrain = position.lookFor(LOOK_TERRAIN);
        if (terrain.includes('wall')) {
          continue;
        }

        const hasRoad = position.lookFor(LOOK_STRUCTURES).some((structure) => structure.structureType === STRUCTURE_ROAD);
        if (!hasRoad) {
          const result = this.room.createConstructionSite(position.x, position.y, STRUCTURE_ROAD);
          if (result === OK) {
            return;
          }
        }
      }
    }
  }

  /**
   * Creates a storage when the room reaches the required controller level and no storage exists.
   * @returns {void}
   */
  ensureStorage() {
    if (this.room.storage) {
      return;
    }

    if (!this.room.controller || this.room.controller.level < 2) {
      return;
    }

    const hasStorageSite = this.room.find(FIND_CONSTRUCTION_SITES).some((site) => site.structureType === STRUCTURE_STORAGE);
    if (hasStorageSite) {
      return;
    }

    const spawn = this.room.find(FIND_MY_SPAWNS)[0];
    if (!spawn) {
      return;
    }

    const position = this.findNearbyEmptyTile(spawn.pos);
    if (position) {
      this.room.createConstructionSite(position.x, position.y, STRUCTURE_STORAGE);
    }
  }

  /**
   * Creates extension sites around the spawn until the minimum extension threshold is met.
   * @returns {void}
   */
  ensureExtensions() {
    const controllerLevel = this.room.controller ? this.room.controller.level : 0;
    if (controllerLevel < 2) {
      return;
    }

    const existingExtensions = this.room.find(FIND_MY_STRUCTURES, {
      filter: (structure) => structure.structureType === STRUCTURE_EXTENSION
    }).length;

    if (existingExtensions >= 5) {
      return;
    }

    const spawn = this.room.find(FIND_MY_SPAWNS)[0];
    if (!spawn) {
      return;
    }

    const position = this.findNearbyEmptyTile(spawn.pos);
    if (position) {
      this.room.createConstructionSite(position.x, position.y, STRUCTURE_EXTENSION);
    }
  }

  /**
   * Finds a free adjacent tile around a position that can host a new construction site.
   * @param {RoomPosition} position The center to inspect.
   * @returns {RoomPosition|null}
   */
  findNearbyEmptyTile(position) {
    for (let x = position.x - 1; x <= position.x + 1; x += 1) {
      for (let y = position.y - 1; y <= position.y + 1; y += 1) {
        if (x === position.x && y === position.y) {
          continue;
        }

        const tile = this.room.getPositionAt(x, y);
        if (!tile) {
          continue;
        }

        const terrain = tile.lookFor(LOOK_TERRAIN);
        if (terrain.includes('wall')) {
          continue;
        }

        const occupied = tile.lookFor(LOOK_STRUCTURES).length > 0 || tile.lookFor(LOOK_CONSTRUCTION_SITES).length > 0;
        if (!occupied) {
          return tile;
        }
      }
    }

    return null;
  }
}

module.exports = ConstructionManager;
