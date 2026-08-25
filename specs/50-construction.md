## Règles de construction

### Définitions et métriques
- Route : chemin construit (road) ou chemin praticable entre deux points.
- Stockage d'énergie : structures de type container ou storage.
- Distance minimale : distance du chemin praticable calculée par l'algorithme A*.
- Tolérance de longueur : un mur ne doit pas augmenter la distance minimale entre deux points de plus de 20%.



## CONST-001
Les murs ne doivent pas empêcher l'accès praticable des creeps aux sources d'énergie. L'accès praticable est défini comme l'existence d'un chemin A* sans obstacles insurmontables entre le point d'entrée et la source.

## CONST-002
Les murs ne doivent pas augmenter la distance minimale (A*) entre un harvester et sa source de plus de 20% par rapport à la distance sans murs. Cette tolérance est configurable mais fixée par défaut à 20%.

## CONST-003
Les constructions doivent prioriser la proximité des structures de stockage d'énergie (container, storage) par rapport aux sources, afin de minimiser la distance de transport d'énergie par les harvesters.

## CONST-004
Des routes doivent être construites entre chaque source et le point de dépôt principal (storage ou container dédié), en privilégiant le chemin le plus court calculé par A* et en tenant compte de la tolérance de longueur.

## CONST-005
Le room controller doit être inclus dans le périmètre défensif (périmètre protégé par des murs) sans pour autant bloquer les accès essentiels (spawn, sources, points de dépôt). 'Inclus' signifie situé à l'intérieur du périmètre, mais les accès doivent rester praticables selon les autres règles.

## CONST-006
Les murs ne doivent pas augmenter la distance minimale (A*) entre le room controller et le Spawn, ni entre le room controller et les sources, de plus de 20% par rapport aux distances sans murs. Cette règle fait partie des vérifications d'accessibilité et utilise la même métrique que CONST-002.

