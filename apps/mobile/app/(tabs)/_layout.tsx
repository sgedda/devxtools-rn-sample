import { SymbolView } from 'expo-symbols';
import { Link, Tabs } from 'expo-router';
import { TouchableOpacity, Platform, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { DataSourcePill } from '@/components/DataSourcePill';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        headerShown: true,
        headerTitleStyle: {
          fontSize: 17,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'list.bullet',
                android: 'list',
                web: 'list',
              }}
              tintColor={color}
              size={24}
            />
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <DataSourcePill />
              <Link href="/modal" asChild>
                <TouchableOpacity
                  style={{
                    marginRight: Platform.OS === 'ios' ? 16 : 20,
                    padding: 8,
                    minWidth: 44,
                    minHeight: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Add task"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <SymbolView
                    name={{
                      ios: 'plus',
                      android: 'add',
                      web: 'add',
                    }}
                    tintColor={Colors[colorScheme].tint}
                    size={22}
                  />
                </TouchableOpacity>
              </Link>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'info.circle',
                android: 'info',
                web: 'info',
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
