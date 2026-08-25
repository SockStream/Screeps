# Architecture

## Boucle principale

`main.js` est responsable uniquement de la coordination
des différents managers.

## Managers

Chaque domaine fonctionnel possède son propre manager.

Exemples :

- RoomManager
- SpawnManager
- CreepManager

## Règle

Un manager ne doit pas directement gérer la logique appartenant à un autre domaine.

## Mémoire

Les données persistantes doivent être stockées dans `Memory`.

Les objets Screeps ne doivent pas être sérialisés directement.