import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from './BottomNav';

export default function ScreenLayout({
  children,
  navigation,
  activeScreen,
  backgroundColor = '#ffffff',
}) {
  return (
    <View style={[styles.root, { backgroundColor }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.content}>{children}</View>
      </SafeAreaView>

      <BottomNav navigation={navigation} activeScreen={activeScreen} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});