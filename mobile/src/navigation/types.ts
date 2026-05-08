export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Search: undefined;
  Groups: undefined;
  Friends: undefined;
  History: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  GameArena: { groupId: number; currentUserId: number; groupMembers: any[] };
  AdminCards: undefined;
  AdminUsers: undefined;
};
