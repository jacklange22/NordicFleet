const email = require('./email');
const password = require('./password');
const ski = require('./ski');
const waxLog = require('./waxLog');
const testLog = require('./testLog');

module.exports = {
  ...email,
  ...password,
  ...ski,
  ...waxLog,
  ...testLog,
};
