import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkThemeEnabled, setDarkThemeEnabled] = useState(false);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.topTitle}>Профиль</Text>

        <View style={styles.headerBlock}>
          <Text style={styles.userName}>Иван Иванов</Text>

          <View style={styles.tagsRow}>
            <StaticTag text="ИКИТ" />
            <StaticTag text="1 курс" />
            <StaticTag text="Программная инженерия" />
          </View>
        </View>

        <View style={styles.settingsBlock}>
          <SettingCard
            title="Уведомления"
            value={notificationsEnabled}
            onToggle={() => setNotificationsEnabled((prev) => !prev)}
          />
          
        </View>
      </View>
    </SafeAreaView>
  );
}

function StaticTag({ text }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{text}</Text>
    </View>
  );
}

function SettingCard({ title, value, onToggle }) {
  return (
    <View style={styles.settingCard}>
      <Text style={styles.settingTitle}>{title}</Text>

      <TouchableOpacity
        style={[styles.switchTrack, value && styles.switchTrackActive]}
        activeOpacity={0.85}
        onPress={onToggle}
      >
        <View
          style={[
            styles.switchThumb,
            value && styles.switchThumbActive,
          ]}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  topTitle: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 50,
  },

  headerBlock: {
    marginBottom: 50,
  },
  userName: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 16,
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#111111',
    backgroundColor: '#FFFFFF',
  },
  tagText: {
    fontSize: 12,
    color: '#111111',
    fontFamily: 'WixMadeforDisplayMedium',
  },

  settingsBlock: {
    gap: 16,
  },

  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 8,
  },
  settingTitle: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
  },

  switchTrack: {
    width: 30,
    height: 18,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#F83603',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchTrackActive: {
    backgroundColor: '#F83603',
  },
  switchThumb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F83603',
    alignSelf: 'flex-start',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
    borderColor: '#FFFFFF',
  },
});