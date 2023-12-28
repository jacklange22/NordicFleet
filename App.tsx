// App.tsx
import React from 'react';
import { useEffect } from 'react';
import analytics from '@react-native-firebase/analytics';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from './src/screens/welcome.js';
import SignupScreen from './src/screens/signup.js';
import LoginScreen from './src/screens/login.js';
import AuthLoadingScreen from './src/screens/AuthLoadingScreen'; // Import the AuthLoadingScreen
import HomeScreen from './src/screens/homescreen.js';
import ProfileScreen from './src/screens/profile.js';
import TestingLogScreen from './src/screens/testinglog.js';
import testingdata from './src/testingdata.json';
import SkisInputFields from './src/screens/inputfieldscreen.js';
import WaxLogScreen from './src/screens/waxinglog.js';
import SkiInfo from './src/screens/skiInfo.js';
import AddSkiForm from './src/screens/newSki.js';
import firebase from '@react-native-firebase/app';





const Stack = createStackNavigator();

const App = () => {
  
  
//console.log(firebase.app().name);  // default app should log "DEFAULT"

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        {/* Set Welcome as the initial route */}
        {/* If you are ready to use AuthLoadingScreen, you can uncomment these lines*/}
        <Stack.Screen
          name="AuthLoading"
          component={AuthLoadingScreen}
          options={{ headerShown: false }}
        />
        
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }}/>
        {/* Uncomment these lines when you're ready to add these screens*/}
        <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="TestingLog" component={TestingLogScreen} options={{ headerShown: false }}/> 
        <Stack.Screen name="WaxLog" component={WaxLogScreen} options={{ headerShown: false }}/> 
        <Stack.Screen name="SkiInfo" component={SkiInfo} options={{ headerShown: false }}/>  
        <Stack.Screen name="newSki" component={AddSkiForm} options={{headerShown:false}}/>  

        {/* Other screens would go here */}
        {/*<Stack.Screen name="Input" component={SkisInputFields} options={{ headerShown: false }}/>*/}
      </Stack.Navigator>
      
    </NavigationContainer>
  );
};

export default App;
