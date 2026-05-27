// Advisory payload builders.
//
// A race-day advisory is a richer kind of coach → athlete message. It
// rides on top of the existing `messages/{id}` collection: the doc
// looks like a normal message (fromUid, toUid, body, attachedSkiIds,
// read, timestamps), with two extra fields:
//
//   type: 'advisory'
//   advisory: { event, eventDate, conditions?, skiRecommendations[] }
//
// This file just shapes the `advisory` payload + composes it with the
// existing buildMessageCreatePayload so the mobile sendAdvisory and a
// future web compose flow produce structurally identical docs.

const {SKI_TYPES} = require('../types/ski');
const {buildMessageCreatePayload} = require('./messageOperations');

const VALID_ROLES = ['primary', 'backup'];

function trimmedString(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function parseNumberOrNull(value, label) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`${label} must be a number`);
  }
  return n;
}

function isValidISODate(s) {
  if (typeof s !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

/**
 * Validate + shape the inner `advisory` object. Used both by the
 * full message builder below and by tests that want to assert on
 * just the structured side.
 *
 * @param {Object} input
 * @returns {Advisory}
 */
function buildAdvisoryPayload(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Advisory input is required');
  }

  const event = trimmedString(input.event);
  if (!event) {
    throw new Error('Event name is required');
  }
  if (event.length > 120) {
    throw new Error('Event name is too long (120 chars max)');
  }

  const eventDate = trimmedString(input.eventDate);
  if (!eventDate || !isValidISODate(eventDate)) {
    throw new Error('Event date must be in YYYY-MM-DD format');
  }

  const conditions = buildConditions(input.conditions);
  const skiRecommendations = buildRecommendations(input.skiRecommendations);

  const out = {
    event,
    eventDate: eventDate.slice(0, 10), // normalize to yyyy-mm-dd
    skiRecommendations,
  };
  // Only include conditions when at least one field is set — keeps
  // empty advisories from carrying noisy empty objects.
  if (conditions !== null) {
    out.conditions = conditions;
  }
  return out;
}

function buildConditions(raw) {
  if (raw === undefined || raw === null) {
    return null;
  }
  if (typeof raw !== 'object') {
    throw new Error('Advisory conditions must be an object');
  }

  const out = {};
  let touched = false;

  if (raw.snowType !== undefined && raw.snowType !== null && raw.snowType !== '') {
    const v = String(raw.snowType).toLowerCase();
    if (!SKI_TYPES.includes(v)) {
      throw new Error(
        `Snow type must be one of: ${SKI_TYPES.join(', ')}`,
      );
    }
    out.snowType = v;
    touched = true;
  }
  const snowTemp = parseNumberOrNull(raw.snowTemperature, 'Snow temperature');
  if (snowTemp !== null) {
    out.snowTemperature = snowTemp;
    touched = true;
  }
  const airTemp = parseNumberOrNull(raw.airTemperature, 'Air temperature');
  if (airTemp !== null) {
    out.airTemperature = airTemp;
    touched = true;
  }
  const humidity = parseNumberOrNull(raw.humidity, 'Humidity');
  if (humidity !== null) {
    if (humidity < 0 || humidity > 100) {
      throw new Error('Humidity must be between 0 and 100');
    }
    out.humidity = humidity;
    touched = true;
  }
  if (raw.newSnow !== undefined) {
    out.newSnow = !!raw.newSnow;
    touched = true;
  }
  const notes = trimmedString(raw.notes);
  if (notes) {
    out.notes = notes.slice(0, 500);
    touched = true;
  }

  return touched ? out : null;
}

function buildRecommendations(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('Advisory needs at least one ski recommendation');
  }
  const out = [];
  let hasPrimary = false;
  const seen = new Set();

  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      throw new Error('Each ski recommendation must be an object');
    }
    const skiId = trimmedString(item.skiId);
    if (!skiId) {
      throw new Error('Each ski recommendation needs a skiId');
    }
    if (seen.has(skiId)) {
      throw new Error(`Ski ${skiId} listed more than once`);
    }
    seen.add(skiId);

    const role = item.role || 'primary';
    if (!VALID_ROLES.includes(role)) {
      throw new Error(
        `Role must be one of: ${VALID_ROLES.join(', ')}`,
      );
    }
    if (role === 'primary') {
      hasPrimary = true;
    }
    const rec = {skiId, role};
    const notes = trimmedString(item.notes);
    if (notes) {
      rec.notes = notes.slice(0, 300);
    }
    out.push(rec);
  }

  if (!hasPrimary) {
    throw new Error('At least one ski recommendation must be the primary');
  }
  return out;
}

/**
 * Build the full Firestore payload for an advisory message. Composes
 * the standard message builder (fromUid / toUid / body / read) with
 * the structured advisory payload, then tags the doc with
 * type: 'advisory' so the athlete client can switch renderers.
 *
 * @param {Object} args
 * @param {string} args.fromUid
 * @param {string} args.toUid
 * @param {string} args.event
 * @param {string} args.eventDate
 * @param {Object} [args.conditions]
 * @param {Object[]} args.skiRecommendations
 * @param {string} [args.subject]
 * @param {string} [args.body]              optional free-form note
 * @returns {Object}                         ready for messageCollection.add()
 */
function buildAdvisoryMessagePayload(args) {
  const advisory = buildAdvisoryPayload(args);
  const subject =
    args.subject !== undefined && args.subject !== null
      ? args.subject
      : `Race plan: ${advisory.event}`;
  const body = trimmedString(args.body) || advisory.event;

  // skiRecommendations doubles as the attachedSkiIds hint the existing
  // message UI uses to show ski thumbnails on the message preview.
  const attachedSkiIds = advisory.skiRecommendations.map(r => r.skiId);

  const base = buildMessageCreatePayload({
    fromUid: args.fromUid,
    toUid: args.toUid,
    body,
    subject,
    attachedSkiIds,
  });

  return {
    ...base,
    type: 'advisory',
    advisory,
  };
}

module.exports = {
  buildAdvisoryPayload,
  buildAdvisoryMessagePayload,
};
