import React, { useState } from 'react';
import { useFonts } from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';

import LoginScreen from './src/screens/Auth/LoginScreen';
import TabNavigator from './src/navigation/TabNavigator';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [fontsLoaded] = useFonts({
    WixMadeforDisplayMedium: require('./assets/fonts/WixMadeforDisplay/WixMadeforDisplay-Medium.ttf'),
    WixMadeforDisplaySemiBold: require('./assets/fonts/WixMadeforDisplay/WixMadeforDisplay-SemiBold.ttf'),
    WixMadeforDisplayBold: require('./assets/fonts/WixMadeforDisplay/WixMadeforDisplay-Bold.ttf'),
    AlumniSans: require('./assets/fonts/AlumniSans-ExtraBold.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <TabNavigator />
      ) : (
        <LoginScreen onLogin={() => setIsLoggedIn(true)} />
      )}
    </NavigationContainer>
  );
}