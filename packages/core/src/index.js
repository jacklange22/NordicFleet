// @nordicfleet/core — shared business logic for the NordicFleet platform.
//
// Phase A1 stub: this re-exports everything from the submodules. Submodules
// are added incrementally in Phase A2 + A3:
//   - types/        JSDoc typedefs (Profile, Ski, WaxLog, TestLog, Message, etc.)
//   - validation/   Pure-function validators (email, password, sk, log inputs)
//   - constants/    Wax dictionary, ski brands, snow types, etc.
//   - services/     Payload builders (no Firestore — just shaping)
//
// Imported by apps/mobile and apps/web. Pure JS; no React Native, no Firebase
// SDK dependencies at this layer.

module.exports = {};
