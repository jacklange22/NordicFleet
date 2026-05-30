// App.tsx
import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import WelcomeScreen from './src/screens/welcome.js';
import SignupScreen from './src/screens/signup.js';
import LoginScreen from './src/screens/login.js';
import ForgotPasswordScreen from './src/screens/forgotPassword.js';
import AuthLoadingScreen from './src/screens/AuthLoadingScreen';
import HomeScreen from './src/screens/homescreen.js';
import ProfileScreen from './src/screens/profile.js';
import SettingsScreen from './src/screens/settings.js';
import TestingLogScreen from './src/screens/testinglog.js';
import WaxLogScreen from './src/screens/waxinglog.js';
import SkiInfo from './src/screens/skiInfo.js';
import AddSkiForm from './src/screens/newSki.js';
import ScanSkiScreen from './src/screens/scanSki.js';
import RoleSelectScreen from './src/screens/roleSelect.js';
import CoachDashboardScreen from './src/screens/coachDashboard.js';
import AthleteDetailScreen from './src/screens/athleteDetail.js';
import MessagesScreen from './src/screens/messages.js';
import MessageDetailScreen from './src/screens/messageDetail.js';
import ComposeAdvisoryScreen from './src/screens/composeAdvisory.js';
import WaxTruckScreen from './src/screens/waxTruck.js';
import WaxTestSetupScreen from './src/screens/waxTestSetup.js';
import WaxTestRunnerScreen from './src/screens/waxTestRunner.js';
import {AuthProvider} from './src/context/AuthContext';
import {ModeProvider} from './src/context/ModeContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import Toast from 'react-native-toast-message';
import {toastConfig} from './src/components/ui/toastConfig';
import {colors} from './src/theme';
import {trace} from './src/services/devTrace';

// TEMPORARY freeze diagnostics (PHONE_FREEZE_DEBUG_STEPS.md): the deepest
// active route name, for the navigator onStateChange trace.
const getActiveRouteName = (state: any): string | undefined => {
  if (!state || typeof state.index !== 'number') {
    return undefined;
  }
  const route = state.routes[state.index];
  return route?.state ? getActiveRouteName(route.state) : route?.name;
};

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.red,
  },
};

const Stack = createStackNavigator();

const App = () => {
  React.useEffect(() => {
    trace('app-mounted');
  }, []);
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <AuthProvider>
          <ModeProvider>
          <NavigationContainer
            theme={navTheme}
            onReady={() => trace('navigator-ready')}
            onStateChange={state => trace('route', getActiveRouteName(state))}>
            <Stack.Navigator
              initialRouteName="AuthLoading"
              screenOptions={{
                headerShown: false,
                cardStyle: {backgroundColor: colors.bg},
              }}>
              <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
              />
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="TestingLog" component={TestingLogScreen} />
              <Stack.Screen name="WaxLog" component={WaxLogScreen} />
              <Stack.Screen name="SkiInfo" component={SkiInfo} />
              <Stack.Screen name="newSki" component={AddSkiForm} />
              <Stack.Screen name="ScanSki" component={ScanSkiScreen} />
              <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
              <Stack.Screen
                name="CoachDashboard"
                component={CoachDashboardScreen}
              />
              <Stack.Screen
                name="AthleteDetail"
                component={AthleteDetailScreen}
              />
              <Stack.Screen name="Messages" component={MessagesScreen} />
              <Stack.Screen
                name="MessageDetail"
                component={MessageDetailScreen}
              />
              <Stack.Screen
                name="ComposeAdvisory"
                component={ComposeAdvisoryScreen}
              />
              <Stack.Screen name="WaxTruck" component={WaxTruckScreen} />
              <Stack.Screen
                name="WaxTestSetup"
                component={WaxTestSetupScreen}
              />
              <Stack.Screen
                name="WaxTestRunner"
                component={WaxTestRunnerScreen}
              />
            </Stack.Navigator>
          </NavigationContainer>
          </ModeProvider>
        </AuthProvider>
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

export default App;
