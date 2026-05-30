/**
 * Shared shape definitions for editor JSDoc autocompletion.
 *
 * These aren't runtime types - they're typedef hints. If you swap to
 * TypeScript later, this file's contents move into `types.ts` interfaces.
 */

/**
 * @typedef {Object} Profile
 * @property {string} uid
 * @property {string|null} email
 * @property {string|null} displayName
 * @property {number|null} weight
 * @property {number|null} height
 * @property {string|null} team
 * @property {string|null} location
 * @property {*} [createdAt]
 * @property {*} [updatedAt]
 */

/**
 * @typedef {Object} Ski
 * @property {string} id
 * @property {string} name
 * @property {string} brand
 * @property {string} model
 * @property {'classic'|'skate'} technique
 * @property {'cold'|'universal'|'warm'|'zero'} type
 * @property {string} build
 * @property {string} base
 * @property {string} grind
 * @property {number|null} length
 * @property {number|null} flex
 * @property {number|null} year
 * @property {string} notes
 * @property {boolean} retired
 * @property {string|null} [seedId]
 * @property {*} [createdAt]
 * @property {*} [updatedAt]
 */

/**
 * @typedef {Object} WaxLog
 * @property {string} id
 * @property {string} skiId
 * @property {*} date
 * @property {string|null} binder
 * @property {number} kickLayers
 * @property {string|null} kickWax
 * @property {number} glideLayers
 * @property {string[]} glideWaxes
 * @property {string} notes
 * @property {*} [createdAt]
 */

/**
 * @typedef {Object} TestLog
 * @property {string} id
 * @property {string} skiId
 * @property {*} date
 * @property {number|null} temperature
 * @property {number|null} humidity
 * @property {'old'|'new'|'manmade'|null} snowType
 * @property {'hardpack'|'powder'|'corduroy'|'slush'|null} surface
 * @property {string|null} glideWax
 * @property {string|null} kickWax
 * @property {number} glideRating
 * @property {number|null} kickRating
 * @property {number|null} stabilityRating
 * @property {number|null} climbingRating
 * @property {string} notes
 * @property {*} [createdAt]
 */

// Empty export so the file is treated as a module and the typedefs are
// pickable from JSDoc imports.
export {};
