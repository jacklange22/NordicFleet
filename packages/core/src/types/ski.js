/**
 * @typedef {'classic'|'skate'} SkiTechnique
 *
 * @typedef {'cold'|'universal'|'warm'|'zero'} SkiType
 *
 * A ski document at `users/{uid}/skis/{skiId}`.
 *
 * @typedef {Object} Ski
 * @property {string}        id
 * @property {string}        name
 * @property {string}        brand
 * @property {string}        [model]
 * @property {SkiTechnique}  technique
 * @property {SkiType}       type
 * @property {string}        [build]
 * @property {string}        [base]
 * @property {string}        [grind]
 * @property {number|null}   [length]        cm
 * @property {number|null}   [flex]          kg (nordic ski hardness)
 * @property {number|null}   [year]
 * @property {string}        [notes]
 * @property {boolean}       retired
 * @property {string|null}   [seedId]        marks docs created from seedData.json
 * @property {*}             [createdAt]
 * @property {*}             [updatedAt]
 */

/**
 * @typedef {Object} SkiInput
 * @property {string}        name
 * @property {string}        [brand]
 * @property {string}        [model]
 * @property {SkiTechnique}  technique
 * @property {SkiType}       type
 * @property {string}        [build]
 * @property {string}        [base]
 * @property {string}        [grind]
 * @property {number|string|null} [length]
 * @property {number|string|null} [flex]
 * @property {number|null}   [year]
 * @property {string}        [notes]
 * @property {boolean}       [retired]
 * @property {string|null}   [seedId]
 */

const SKI_TECHNIQUES = Object.freeze(['classic', 'skate']);
const SKI_TYPES = Object.freeze(['cold', 'universal', 'warm', 'zero']);

module.exports = {SKI_TECHNIQUES, SKI_TYPES};
