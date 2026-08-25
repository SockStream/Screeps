/**
 * Utility path functions using PathFinder for consistent path-length calculations.
 * Provides a computePathLength(room, startPos, endPos, ignoreWalls) function.
 */

/**
 * Compute the path length between two positions using PathFinder.
 * If ignoreWalls is true, walls are treated as walkable for the purpose of computing an ideal distance.
 * @param {Room} room
 * @param {RoomPosition} startPos
 * @param {RoomPosition} endPos
 * @param {boolean} ignoreWalls
 * @returns {number} path length
 */
function computePathLength(room, startPos, endPos, ignoreWalls) {
  try {
    const res = PathFinder.search(startPos, { pos: endPos, range: 1 }, {
      roomCallback: (roomName) => {
        const rm = Game.rooms[roomName];
        if (!rm) {
          return new PathFinder.CostMatrix();
        }

        const costs = new PathFinder.CostMatrix();

        for (let x = 0; x < 50; x += 1) {
          for (let y = 0; y < 50; y += 1) {
            const t = rm.getTerrain().get(x, y);
            if (t === TERRAIN_MASK_WALL) {
              costs.set(x, y, ignoreWalls ? 1 : 255);
            } else if (t === TERRAIN_MASK_SWAMP) {
              costs.set(x, y, 5);
            }
          }
        }

        rm.find(FIND_STRUCTURES).forEach((s) => {
          if (s.structureType === STRUCTURE_ROAD) return;
          costs.set(s.pos.x, s.pos.y, 255);
        });

        return costs;
      },
      maxOps: 2000
    });

    return res.path ? res.path.length : 0;
  } catch (e) {
    const p = room.findPath(startPos, endPos, { ignoreCreeps: true });
    return p ? p.length : 0;
  }
}

module.exports = { computePathLength };