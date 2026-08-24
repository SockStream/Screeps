# Instructions Agent

## Avant modification

1. Identifier la spécification concernée.
2. Lire les règles associées.
3. Identifier les fichiers de code concernés.
4. Vérifier les dépendances.
5. Si deux spécifications semblent contradictoires, ne pas choisir arbitrairement. Signaler le conflit et demander une décision.

## Modification

- Respecter les spécifications.
- Ne pas modifier une règle fonctionnelle sans demande explicite.
- Préserver l'architecture existante.
- Éviter les modifications sans rapport avec la tâche.
- Si le code actuel ne respecte pas la spécification, modifier le code pour respecter la spécification. Ne pas modifier la spécification pour justifier le comportement actuel du code.
- Ne jamais modifier une spécification pour résoudre un problème d'implémentation.
- Ne pas effectuer de refactoring qui n'est pas nécessaire à la tâche demandée.

## Après modification

- Vérifier les erreurs.
- Lancer les tests disponibles.
- Vérifier les règles concernées.
- Vérifier que les modifications n'introduisent pas de contradiction avec les autres spécifications connues.

## Documentation

- Toute nouvelle fonctionnalité doit avoir sa spécification dans `specs/`.
- Toute modification d'une règle existante doit modifier la spécification correspondante.
- Le code doit être commenté lorsque la logique n'est pas évidente.
- Les commentaires doivent expliquer les choix et la logique importante, et non simplement décrire le code.
- Le code doit contenir la référence à la spécification utilisée pour générer ou modifier ce code.
- Les références aux spécifications doivent utiliser leur identifiant lorsqu'un identifiant existe.

## Gestion du contexte

Ne pas lire tous les fichiers de `specs/` systématiquement.

Pour chaque tâche :

1. Lire `00-overview.md`.
2. Identifier les spécifications concernées.
3. Lire uniquement ces spécifications.
4. Identifier les fichiers de code nécessaires.
5. Lire uniquement les fichiers de code nécessaires.

Lire l'ensemble du projet uniquement si la tâche nécessite explicitement une analyse globale.

## Gestion des spécifications

- Ne jamais modifier une spécification sans demande explicite de l'utilisateur, sauf lorsqu'une nouvelle fonctionnalité ou une modification fonctionnelle nécessite sa création ou sa mise à jour.
- Lorsqu'une spécification doit être modifiée, conserver les règles existantes qui ne sont pas concernées.
- Ne pas supprimer une règle sans demande explicite.
- Si une règle doit être supprimée ou remplacée, signaler clairement cette modification.