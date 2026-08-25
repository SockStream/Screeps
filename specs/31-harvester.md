# Harvester

## Objectif

Les harvesters assurent l'approvisionnement en énergie de la room.

## HARV-001
Chaque harvester doit être affecté à une source.

## HARV-002
Une source peut accueillir au maximum 2 harvesters.

## Comportement

## HARV003
Un harvester doit retourner déposer son énergie lorsque son inventaire atteint 80%.

## HARV-004
La priorité pour déposer l'énergie d'un harvester est : Spawn, Extension, Container

## HARV005
Un harvester qui a un inventaire rempli à moins de 80% doit aller chercher de l'énergie à la source la plus proche en tenant compte des routes qui peuvent exister

## HARV-006
Un harvester qui n'a pas de sourceId en mémoire doit avoir une source assignée

## HARV-007
Si un harvester n'arrive pas à aller vers sa source assignée, alors il doit changer de source