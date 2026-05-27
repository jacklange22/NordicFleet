/**
 * Race-day advisory — a structured message a coach sends an athlete
 * about a specific event. Persisted as an optional `advisory` field
 * inside a normal `messages/{id}` doc, with the doc's top-level
 * `type` set to 'advisory' so the athlete UI can branch into the
 * structured renderer instead of the freeform body view.
 *
 * The pattern keeps the existing messages collection (and its
 * firestore rules) intact — no new write path, no new auth surface.
 * sendAdvisory just builds a richer payload and pipes it through
 * the same buildMessageCreatePayload + add() chain that plain
 * messages use.
 *
 * @typedef {'cold'|'universal'|'warm'|'zero'} SkiType
 *
 * @typedef {Object} AdvisoryConditions
 * @property {SkiType}     [snowType]
 * @property {number|null} [snowTemperature]   °C, may be negative
 * @property {number|null} [airTemperature]    °C
 * @property {number|null} [humidity]          0..100
 * @property {boolean}     [newSnow]           true if snow is falling / just fell
 * @property {string}      [notes]             free-form, e.g. "track groomed last night"
 *
 * @typedef {Object} AdvisorySkiRecommendation
 * @property {string} skiId                    athlete's ski doc id
 * @property {'primary'|'backup'} role
 * @property {string} [notes]                  per-ski note from the coach
 *
 * @typedef {Object} Advisory
 * @property {string}                          event              race / event name
 * @property {string}                          eventDate          ISO yyyy-mm-dd
 * @property {AdvisoryConditions}              [conditions]
 * @property {AdvisorySkiRecommendation[]}     skiRecommendations at least one with role='primary'
 *
 * @typedef {Object} AdvisoryInput
 * @property {string}   toUid
 * @property {string}   event
 * @property {string}   eventDate
 * @property {string}   [subject]
 * @property {string}   [body]
 * @property {AdvisoryConditions} [conditions]
 * @property {AdvisorySkiRecommendation[]} skiRecommendations
 */

module.exports = {};
