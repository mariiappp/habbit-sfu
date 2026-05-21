import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFonts } from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';

import LoginScreen from './src/screens/Auth/LoginScreen';
import TabNavigator from './src/navigation/TabNavigator';
import { getToken, setToken } from './src/storage/tokenStorage';
import { fetchMoodleUser } from './src/api/moodle';
import { addScreenTimeSeconds } from './src/storage/screenTimeStorage';

export default function App() {
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const sessionStartRef = useRef(Date.now());

  const [fontsLoaded] = useFonts({
    WixMadeforDisplayMedium: require('./assets/fonts/WixMadeforDisplay/WixMadeforDisplay-Medium.ttf'),
    WixMadeforDisplaySemiBold: require('./assets/fonts/WixMadeforDisplay/WixMadeforDisplay-SemiBold.ttf'),
    WixMadeforDisplayBold: require('./assets/fonts/WixMadeforDisplay/WixMadeforDisplay-Bold.ttf'),
    AlumniSans: require('./assets/fonts/AlumniSans-ExtraBold.ttf'),
  });

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await getToken();
        setAccessToken(storedToken);
      } catch (error) {
        console.warn('Failed to load stored token:', error);
      } finally {
        setIsAuthLoading(false);
      }
    };

    loadToken();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const now = Date.now();
      const wasActive = appStateRef.current === 'active';
      const isActive = nextState === 'active';

      if (wasActive && !isActive && sessionStartRef.current) {
        const seconds = (now - sessionStartRef.current) / 1000;
        addScreenTimeSeconds(seconds).catch(() => {});
      }

      if (isActive) {
        sessionStartRef.current = now;
      }

      appStateRef.current = nextState;
    });

    return () => {
      const now = Date.now();
      if (appStateRef.current === 'active' && sessionStartRef.current) {
        const seconds = (now - sessionStartRef.current) / 1000;
        addScreenTimeSeconds(seconds).catch(() => {});
      }
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!accessToken) {
        setProfile(null);
        return;
      }
      setIsProfileLoading(true);
      try {
        const user = await fetchMoodleUser(accessToken);
        if (isMounted) {
          setProfile(user);
        }
      } catch (error) {
        console.warn('Failed to load profile:', error);
        if (isMounted) {
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  const handleLoginSuccess = async (token) => {
    await setToken(token);
    setAccessToken(token);
  };

  if (!fontsLoaded || isAuthLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      {accessToken ? (
        <TabNavigator
          accessToken={accessToken}
          profile={profile}
          isProfileLoading={isProfileLoading}
        />
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </NavigationContainer>
  );
}
