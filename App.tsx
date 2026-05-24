// App.tsx
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import WelcomeScreen from './src/screens/welcome.js';
import SignupScreen from './src/screens/signup.js';
import LoginScreen from './src/screens/login.js';
import AuthLoadingScreen from './src/screens/AuthLoadingScreen';
import HomeScreen from './src/screens/homescreen.js';
import ProfileScreen from './src/screens/profile.js';
import TestingLogScreen from './src/screens/testinglog.js';
import WaxLogScreen from './src/screens/waxinglog.js';
import SkiInfo from './src/screens/skiInfo.js';
import AddSkiForm from './src/screens/newSki.js';
import RoleSelectScreen from './src/screens/roleSelect.js';
import CoachDashboardScreen from './src/screens/coachDashboard.js';
import AthleteDetailScreen from './src/screens/athleteDetail.js';
import {AuthProvider} from './src/context/AuthContext';
import ErrorBoundary from './src/components/ErrorBoundary';

const Stack = createStackNavigator();

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="AuthLoading">
            <Stack.Screen
              name="AuthLoading"
              component={AuthLoadingScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Signup"
              component={SignupScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="TestingLog"
              component={TestingLogScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="WaxLog"
              component={WaxLogScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="SkiInfo"
              component={SkiInfo}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="newSki"
              component={AddSkiForm}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="RoleSelect"
              component={RoleSelectScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="CoachDashboard"
              component={CoachDashboardScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="AthleteDetail"
              component={AthleteDetailScreen}
              options={{headerShown: false}}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
