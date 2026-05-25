const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

/**
 * Metro configuration — npm-workspaces flavored.
 * https://reactnative.dev/docs/metro
 *
 * Metro needs to:
 *   1. Watch the workspace root so changes in packages/core/ trigger reload.
 *   2. Resolve from both the app's own node_modules and the hoisted root
 *      node_modules. npm workspaces hoists by default; without this Metro
 *      can't find react / react-native / Firebase RN modules.
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    // Disable the default haste map's symlink walking — workspaces use
    // node_modules/@nordicfleet/* symlinks that the haste map would
    // otherwise duplicate.
    disableHierarchicalLookup: false,
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
