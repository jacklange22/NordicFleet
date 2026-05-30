/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {installGlobalErrorHandler} from './src/services/reportError';
import {trace} from './src/services/devTrace';

// Capture otherwise-unhandled JS errors through the PII-safe funnel,
// preserving the default handler (dev red-box still shows).
installGlobalErrorHandler();

trace('js-bundle-loaded');

AppRegistry.registerComponent(appName, () => App);
