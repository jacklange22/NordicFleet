/**
 * A curated wax dictionary entry (see constants/waxDictionary.js).
 *
 * @typedef {'kick'|'glide'|'binder'|'base'|'klister'} WaxType
 *
 * @typedef {Object} TempRange
 * @property {number} min   inclusive
 * @property {number} max   inclusive
 * @property {'C'|'F'} unit
 *
 * @typedef {Object} Wax
 * @property {string}    id              kebab-case stable identifier ('swix-vr40-blue')
 * @property {string}    manufacturer    canonical name ('Swix')
 * @property {string}    product         product line / SKU ('VR40')
 * @property {string}    [variant]       color / temp band ('Blue')
 * @property {WaxType}   type
 * @property {string}    fullName        display string ('Swix VR40 Blue')
 * @property {string[]}  searchKeywords  lowercase terms that should match this entry
 * @property {TempRange|null} [tempRange]
 * @property {Object|null}    [humidityRange]
 * @property {string|null}    [notes]
 */

const WAX_TYPES = Object.freeze([
  'kick',
  'glide',
  'binder',
  'base',
  'klister',
]);

module.exports = {WAX_TYPES};
