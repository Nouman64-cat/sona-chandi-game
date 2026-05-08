import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.navBackground,
          borderTopColor: Colors.borderPrimary,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarShowLabel: false,
        tabBarIcon: ({ color, size }) => {
          const iconSize = 24;
          if (route.name === 'Dashboard')
            return <Ionicons name="home" size={iconSize} color={color} />;
          if (route.name === 'Search')
            return <Ionicons name="search" size={iconSize} color={color} />;
          if (route.name === 'Groups')
            return <Ionicons name="shield" size={iconSize} color={color} />;
          if (route.name === 'Friends')
            return <Ionicons name="people" size={iconSize} color={color} />;
          if (route.name === 'History')
            return <Ionicons name="book" size={iconSize} color={color} />;
          if (route.name === 'Profile')
            return <Ionicons name="person" size={iconSize} color={color} />;
          return <Ionicons name="home" size={iconSize} color={color} />;
        },
      })}
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
