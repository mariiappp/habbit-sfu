import React from 'react';
import { useFonts } from 'expo-font';
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {

    const [fontsLoaded] = useFonts({
        WixMadeforDisplayMedium: require('./assets/fonts/WixMadeforDisplay/WixMadeforDisplay-Medium.ttf'),
        WixMadeforDisplaySemiBold: require('./assets/fonts/WixMadeforDisplay/WixMadeforDisplay-SemiBold.ttf'),
    });

    if (!fontsLoaded) {
        return null; 
    }

    return (
        <AppNavigator />
    );
}