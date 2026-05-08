import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

import DashboardScreen from '../screens/DashboardScreen';
import SearchScreen from '../screens/SearchScreen';
import GroupsScreen from '../screens/GroupsScreen';
import FriendsScreen from '../screens/FriendsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GameArenaScreen from '../screens/GameArenaScreen';
import AdminCardsScreen from '../screens/admin/AdminCardsScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';

import type { RootStackParamList, AuthStackParamList, MainTabParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: TabIconName; inactive: TabIconName; label: string }> = {
  Dashboard: { active: 'home', inactive: 'home-outline', label: 'Home' },
  Search:    { active: 'search', inactive: 'search-outline', label: 'Search' },
  Groups:    { active: 'shield', inactive: 'shield-outline', label: 'Squads' },
  Friends:   { active: 'people', inactive: 'people-outline', label: 'Allies' },
  History:   { active: 'book', inactive: 'book-outline', label: 'History' },
  Profile:   { active: 'person', inactive: 'person-outline', label: 'Profile' },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => {
        const cfg = TAB_ICONS[route.name];
        return {
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#080808',
            borderTopColor: 'rgba(255,255,255,0.07)',
            borderTopWidth: 1,
            height: 80,
            paddingBottom: 16,
            paddingTop: 10,
          },
          tabBarActiveTintColor: Colors.gold,
          tabBarInactiveTintColor: 'rgba(161,161,170,0.5)',
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 0.3,
            marginTop: 2,
          },
          tabBarLabel: cfg?.label ?? route.name,
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Ionicons
                name={focused ? cfg?.active : cfg?.inactive}
                size={22}
                color={color}
              />
              {focused && (
                <View style={{
                  position: 'absolute',
                  bottom: -6,
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: Colors.gold,
                }} />
              )}
            </View>
          ),
        };
      }}
    >
      <MainTab.Screen name="Dashboard" component={DashboardScreen} />
      <MainTab.Screen name="Search" component={SearchScreen} />
      <MainTab.Screen name="Groups" component={GroupsScreen} />
      <MainTab.Screen name="Friends" component={FriendsScreen} />
      <MainTab.Screen name="History" component={HistoryScreen} />
      <MainTab.Screen name="Profile" component={ProfileScreen} />
    </MainTab.Navigator>
  );
}

export default function AppNavigator() {
  const { loading, token } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.gold, fontSize: 28, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1, marginBottom: 24 }}>
          SONA CHANDI
        </Text>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <RootStack.Screen name="Main" component={MainTabNavigator} />
            <RootStack.Screen
              name="GameArena"
              component={GameArenaScreen}
              options={{ presentation: 'fullScreenModal' }}
            />
            <RootStack.Screen name="AdminCards" component={AdminCardsScreen} />
            <RootStack.Screen name="AdminUsers" component={AdminUsersScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
