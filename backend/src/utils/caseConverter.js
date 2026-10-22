/**
 * Convertit les clés snake_case de la base (id_utilisateur...) en camelCase
 * (idUtilisateur...), qui est le format utilisé par le frontend.
 * Marche sur les instances Sequelize, les objets, les tableaux et les dates,
 * et ne modifie pas l'objet d'origine.
 */
function snakeToCamelKey(key) {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function toCamelCase(input) {
  if (input === null || input === undefined) return input;

  // Pour une instance Sequelize, on passe d'abord par toJSON()
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
