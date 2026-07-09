/**
 * Convertit récursivement les clés snake_case (convention base de données)
 * en camelCase (convention attendue par le frontend), pour toute la donnée
 * renvoyée par l'API.
 *
 * Accepte : instances Sequelize (via toJSON), objets bruts, tableaux,
 * valeurs primitives, Date. Ne modifie jamais l'objet d'origine.
 */
function snakeToCamelKey(key) {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function toCamelCase(input) {
  if (input === null || input === undefined) return input;

  // Instances Sequelize -> représentation JSON brute d'abord
  if (typeof input.toJSON === 'function') {
    input = input.toJSON();
  }

  if (Array.isArray(input)) {
    return input.map((item) => toCamelCase(item));
  }

  if (input instanceof Date) {
    return input;
  }

  if (typeof input === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(input)) {
      result[snakeToCamelKey(key)] = toCamelCase(value);
    }
    return result;
  }

  return input;
}

module.exports = { toCamelCase, snakeToCamelKey };
