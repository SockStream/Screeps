/**
 * Controls creep behavior for harvesting, upgrading, building, and defense.
 * Spec: HARV-001, HARV-002, HARV-003, HARV-004, HARV-005, HARV-006, HARV-007, PRIORITY-003, PRIORITY-004
 */
class CreepManager {
  /**
   * Runs the behavior loop for creeps in the selected room.
   * @param {Room} [room] The room to process. If omitted, all rooms are processed.
   * @returns {void}
   */
  static run(room) {
    const creeps = Object.values(Game.creeps).filter((creep) => !room || creep.room.name === room.name);

    for (const creep of creeps) {
      switch (creep.memory.role) {
        case 'harvester':
          this.runHarvester(creep);
          break;
        case 'builder':
          this.runBuilder(creep);
          break;
        case 'upgrader':
          this.runUpgrader(creep);
          break;
        case 'defender':
          this.runDefender(creep);
          break;
        case 'attacker':
          this.runAttacker(creep);
          break;
        default:
          this.runUpgrader(creep);
      }
    }
  }

  /**
   * Makes a harvester collect energy from its assigned source and deposit it once it crosses the threshold.
   * @param {Creep} creep The harvester to act on.
   * @returns {void}
   */
  static runHarvester(creep) {
    const usedEnergy = creep.store.getUsedCapacity(RESOURCE_ENERGY);
    const threshold = creep.store.getCapacity() * 0.8;

    if (!creep.memory.sourceId) {
      creep.memory.sourceId = this.assignSourceId(creep);
    }

    if (usedEnergy >= threshold) {
      const target = this.getDepositTarget(creep);
      if (target) {
        const result = creep.transfer(target, RESOURCE_ENERGY);
        if (result === ERR_NOT_IN_RANGE) {
          creep.moveTo(target);
        }
        return;
      }
    }

    let source = this.findAssignedSource(creep);
    if (!source || !this.canReachSource(creep, source)) {
      const nextSourceId = this.assignSourceId(creep, source && source.id);
      if (nextSourceId) {
        creep.memory.sourceId = nextSourceId;
        source = Game.getObjectById(nextSourceId) || null;
      }
    }

    if (!source) {
      return;
    }

    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
      creep.moveTo(source);
    }
  }

  /**
   * Checks whether a harvester has a valid path to a source.
   * @param {Creep} creep The harvester to evaluate.
   * @param {Source} source The source to verify.
   * @returns {boolean}
   */
  static canReachSource(creep, source) {
    if (!source) {
      return false;
    }

    const path = creep.room.findPath(creep.pos, source.pos, {
      ignoreCreeps: true,
      ignoreRoads: false
    });

    return path.length > 0;
  }

  /**
   * Assigns a harvester to a source with a maximum of two harvesters per source.
   * @param {Creep} creep The harvester requesting a source.
   * @param {string} [currentSourceId] The currently assigned source to avoid re-using unreachable sources.
   * @returns {string|null}
   */
  static assignSourceId(creep, currentSourceId) {
    const sources = creep.room.find(FIND_SOURCES);

    for (const source of sources) {
      if (source.id === currentSourceId) {
        continue;
      }

      const assigned = Object.values(Game.creeps).filter((candidate) =>
        candidate.memory.role === 'harvester' &&
        candidate.memory.sourceId === source.id &&
        candidate.room.name === creep.room.name &&
        candidate.id !== creep.id
      ).length;

      if (assigned < 2) {
        return source.id;
      }
    }

    return sources[0] ? sources[0].id : null;
  }

  /**
   * Resolves the assigned source object for a harvester.
   * @param {Creep} creep The harvester whose source is inspected.
   * @returns {Source|null}
   */
  static findAssignedSource(creep) {
    if (!creep.memory.sourceId) {
      return null;
    }

    return Game.getObjectById(creep.memory.sourceId) || null;
  }

  /**
   * Finds the nearest source from the creep position.
   * @param {Creep} creep The creep locating a source.
   * @returns {Source|null}
   */
  static findNearestSource(creep) {
    const sources = creep.room.find(FIND_SOURCES);
    return creep.pos.findClosestByPath(sources) || sources[0] || null;
  }

  /**
   * Selects the best deposit target for a harvester following the defined priorities.
   * @param {Creep} creep The harvester looking for a deposit target.
   * @returns {Structure|null}
   */
  static getDepositTarget(creep) {
    const structures = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        if (![STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_CONTAINER, STRUCTURE_STORAGE].includes(structure.structureType)) {
          return false;
        }
        return structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
      }
    });

    const priority = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_CONTAINER, STRUCTURE_STORAGE];
    for (const type of priority) {
      const target = structures.find((structure) => structure.structureType === type);
      if (target) {
        return target;
      }
    }

    return null;
  }

  /**
   * Makes an upgrader collect energy and upgrade the controller when it has capacity.
   * @param {Creep} creep The upgrader to act on.
   * @returns {void}
   */
  static runUpgrader(creep) {
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      const source = this.findEnergySource(creep);
      if (!source) {
        return;
      }

      if (creep.withdraw(source, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
      }
      return;
    }

    const controller = creep.room.controller;
    if (!controller) {
      return;
    }

    if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
      creep.moveTo(controller);
    }
  }

  /**
   * Makes a builder gather energy and work on the first available construction site.
   * @param {Creep} creep The builder to act on.
   * @returns {void}
   */
  static runBuilder(creep) {
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      const source = this.findEnergySource(creep);
      if (!source) {
        return;
      }

      if (creep.withdraw(source, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
      }
      return;
    }

    const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
    if (site) {
      if (creep.build(site) === ERR_NOT_IN_RANGE) {
        creep.moveTo(site);
      }
      return;
    }

    const controller = creep.room.controller;
    if (!controller) {
      return;
    }

    if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
      creep.moveTo(controller);
    }
  }

  /**
   * Selects the most suitable available energy storage for non-harvester creeps.
   * @param {Creep} creep The creep scanning for a source.
   * @returns {Structure|null}
   */
  static findEnergySource(creep) {
    const structures = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        if (![STRUCTURE_STORAGE, STRUCTURE_CONTAINER, STRUCTURE_SPAWN, STRUCTURE_EXTENSION].includes(structure.structureType)) {
          return false;
        }
        return structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
      }
    });

    const priority = [STRUCTURE_STORAGE, STRUCTURE_CONTAINER, STRUCTURE_SPAWN, STRUCTURE_EXTENSION];
    for (const type of priority) {
      const target = structures.find((structure) => structure.structureType === type);
      if (target) {
        return target;
      }
    }

    return null;
  }

  /**
   * Attacks the nearest hostile creep while defending the room.
   * @param {Creep} creep The defender to command.
   * @returns {void}
   */
  static runDefender(creep) {
    const target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
    if (!target) {
      return;
    }

    if (creep.attack(target) === ERR_NOT_IN_RANGE) {
      creep.moveTo(target);
    }
  }

  /**
   * Attacks the nearest hostile creep during an offensive phase.
   * @param {Creep} creep The attacker to command.
   * @returns {void}
   */
  static runAttacker(creep) {
    const target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
    if (!target) {
      return;
    }

    if (creep.attack(target) === ERR_NOT_IN_RANGE) {
      creep.moveTo(target);
    }
  }
}

module.exports = CreepManager;
