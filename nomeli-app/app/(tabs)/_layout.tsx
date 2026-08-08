import { View, Pressable, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { TabIcon } from '../../src/components/TabIcon';
import { color, radius, shadow } from '../../src/theme/tokens';

function ScanTabButton() {
  const router = useRouter();
  return (
    <View style={styles.scanButtonWrap} pointerEvents="box-none">
      <Pressable
        testID="scan-tab-button"
        onPress={() => router.push('/scan')}
        style={({ pressed }) => [styles.scanButton, pressed && { opacity: 0.85 }]}
      >
        <TabIcon name="camera" color={color.white} size={24} />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.avocadoDark,
        tabBarInactiveTintColor: color.inkFaint,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color: c }) => <TabIcon name="home" color={String(c)} /> }}
      />
      <Tabs.Screen
        name="kitchen"
        options={{ title: 'Kitchen', tabBarIcon: ({ color: c }) => <TabIcon name="kitchen" color={String(c)} /> }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: '',
          tabBarIcon: () => null,
          tabBarButton: () => <ScanTabButton />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
          },
        })}
      />
      <Tabs.Screen
        name="plan"
        options={{ title: 'Plan', tabBarIcon: ({ color: c }) => <TabIcon name="calendar" color={String(c)} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color: c }) => <TabIcon name="user" color={String(c)} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: color.surface,
    borderTopWidth: 0,
    height: 84,
    paddingTop: 8,
    paddingBottom: 24,
    ...shadow.soft,
  },
  tabLabel: { fontSize: 11, fontWeight: '600' },
  scanButtonWrap: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  scanButton: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: color.avocadoDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: color.background,
    ...shadow.soft,
  },
});
