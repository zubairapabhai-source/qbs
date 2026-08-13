import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useApp } from '../../src/store/useApp';
import { t } from '../../src/i18n/strings';
import { colors } from '../../src/theme';

export default function TabsLayout() {
  const lang = useApp((s) => s.lang);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.divider,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 86 : 70,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.silverHi,
        tabBarInactiveTintColor: colors.silverDim,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabDaily', lang),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'moon' : 'moon-outline'} color={color} size={focused ? 26 : 24} />
          ),
        }}
      />
      <Tabs.Screen
        name="atoz"
        options={{
          title: t('tabAtoz', lang),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} color={color} size={focused ? 26 : 24} />
          ),
        }}
      />
      <Tabs.Screen
        name="recite"
        options={{
          title: lang === 'en' ? 'Recite' : lang === 'ar' ? 'تلاوة' : 'تلاوت',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'mic' : 'mic-outline'} color={color} size={focused ? 26 : 24} />
          ),
        }}
      />
      <Tabs.Screen
        name="scientists"
        options={{
          title: t('tabScientists', lang),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'flask' : 'flask-outline'} color={color} size={focused ? 26 : 24} />
          ),
        }}
      />
      <Tabs.Screen
        name="sheikh"
        options={{
          title: t('tabSheikh', lang),
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.sheikhIcon}>
              <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} color={color} size={focused ? 26 : 24} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  sheikhIcon: { position: 'relative' },
});
