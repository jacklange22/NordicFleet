// Curated wax dictionary. Phase E populates this with ~200-400 real entries
// from Swix / Toko / Star / Holmenkol / Vauhti / Rode / Briko-Maplus.
//
// Until then this exports an empty list plus the helper functions so the
// typeahead UI can be wired without depending on the data being final.

const WAX_DICTIONARY = Object.freeze([]);

/**
 * Filter the dictionary for typeahead matches.
 *
 * @param {string} query       lowercased substring search
 * @param {Object} [opts]
 * @param {import('../types/wax').WaxType} [opts.type]   restrict to type
 * @param {number} [opts.limit]                          cap result count
 * @returns {import('../types/wax').Wax[]}
 */
function searchWaxes(query, opts = {}) {
  const q = (query || '').trim().toLowerCase();
  const limit = opts.limit || 30;
  let candidates = WAX_DICTIONARY;
  if (opts.type) {
    candidates = candidates.filter(w => w.type === opts.type);
  }
  if (!q) {
    return candidates.slice(0, limit);
  }
  const matches = [];
  for (const wax of candidates) {
    if (wax.fullName.toLowerCase().includes(q)) {
      matches.push(wax);
      continue;
    }
    if (wax.searchKeywords.some(k => k.includes(q))) {
      matches.push(wax);
    }
  }
  return matches.slice(0, limit);
}

/**
 * Look up a single wax by its stable id.
 * @param {string} id
 * @returns {import('../types/wax').Wax | null}
 */
function getWaxById(id) {
  if (!id) {
    return null;
  }
  return WAX_DICTIONARY.find(w => w.id === id) || null;
}

module.exports = {WAX_DICTIONARY, searchWaxes, getWaxById};
