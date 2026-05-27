const skiBrands = require('./skiBrands');
const snowTypes = require('./snowTypes');
const surfaceTypes = require('./surfaceTypes');
const binderTypes = require('./binderTypes');
const waxDictionary = require('./waxDictionary');
const skiModels = require('./skiModels');
const seedData = require('./seedData.json');

module.exports = {
  ...skiBrands,
  ...snowTypes,
  ...surfaceTypes,
  ...binderTypes,
  ...waxDictionary,
  ...skiModels,
  seedData,
};
