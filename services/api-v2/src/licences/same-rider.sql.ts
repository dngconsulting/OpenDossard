const SQL_ALIAS = /^[a-z_][a-z0-9_]*$/i;

/**
 * Condition SQL : les licences d'alias `a` et `b` appartiennent au même coureur.
 *
 * Même année de naissance (non vide) + même nom et prénom, sans tenir compte des
 * accents, de la casse ni des espaces de bord. Une année vide d'un côté ne
 * correspond jamais. Ce ne sont que des égalités : Postgres peut les traiter
 * par hachage (hash join) sur de gros volumes.
 *
 * Utilise les noms de colonnes SQL : à employer dans une requête brute ou un
 * sous-select, avec des alias de la table `licence`.
 */
export function sameRiderCondition(a: string, b: string): string {
  // Les alias sont interpolés dans le SQL : on n'accepte que des identifiants.
  for (const alias of [a, b]) {
    if (!SQL_ALIAS.test(alias)) {
      throw new Error(`Alias SQL invalide : ${alias}`);
    }
  }
  return `(
    TRIM(${a}.birth_year) <> ''
    AND TRIM(${a}.birth_year) = TRIM(${b}.birth_year)
    AND LOWER(unaccent(TRIM(${a}.name))) = LOWER(unaccent(TRIM(${b}.name)))
    AND LOWER(unaccent(TRIM(${a}.first_name))) = LOWER(unaccent(TRIM(${b}.first_name)))
  )`;
}
