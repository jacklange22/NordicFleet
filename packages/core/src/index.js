// @nordicfleet/core — shared business logic for the NordicFleet platform.
//
// Pure JS; no React Native, no Firebase SDK dependencies. Imported by
// apps/mobile and apps/web.
//
// Re-export structure:
//   types/        runtime exports + JSDoc typedefs
//   validation/   pure-function validators (email, password, ski input, etc.)
//   constants/    wax dictionary, ski brands, snow / surface / binder enums,
//                 seed data JSON
//   services/     payload builders (no Firestore — just shaping)

module.exports = {
  ...require('./types'),
  ...require('./validation'),
  ...require('./constants'),
  ...require('./services'),
};
