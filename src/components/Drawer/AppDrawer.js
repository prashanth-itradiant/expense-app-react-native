import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdministrativeStatus } from '../redux/useAdministrativeStatus';
import AdministrativeScreen from '../screens/AdministrativeScreen';
import BookingDetailsScreen from '../screens/BookingDetailsScreen';
import BookingFormScreen from '../screens/BookingFormScreen';
import DashboardScreen from '../screens/DashboardScreen';
import DepartmentListScreen from '../screens/DepartmentListScreen';
import EditExpenseScreen from '../screens/EditExpenseScreen';
import ExpenseDetailsScreen from '../screens/ExpenseDetailsScreen';
import ExpenseFormScreen from '../screens/ExpenseFormScreen';
import ExpensesListScreen from '../screens/ExpensesListScreen';
import FinanceBookingsScreen from '../screens/FinanceBookingsScreen';
import LogsScreen, { LogsHomeScreen } from '../screens/LogsScreen';
import ManageScreen from '../screens/ManageScreen';
import MasterDataScreen from '../screens/MasterDataScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import OrganizationalExpensesScreen from '../screens/OrganizationalExpensesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TeamExpenseDetails from '../screens/TeamExpenseDetailScreen';
import TeamExpensesListScreen from '../screens/TeamExpensesScreen';
import TransferExpenseScreen from '../screens/TransferExpenseScreen';
import UserFormScreen from '../screens/UserFormScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';
import CustomDrawerContent from './CustomDrawerContent';
import AppHeader from '../navigation/AppHeader';
const Drawer = createDrawerNavigator(),
  Stack = createNativeStackNavigator();
const header = (navigation, title, showBack = false) => ({
  header: () => <AppHeader title={title} showBack={showBack} />,
  title,
});
const stack = (initial, screens) => props =>
  (
    <Stack.Navigator screenOptions={{ headerBackTitleVisible: false }}>
      {screens.map(([name, component, title], i) => (
        <Stack.Screen
          key={name}
          name={name}
          component={component}
          options={header(props.navigation, title, i !== 0)}
        />
      ))}
    </Stack.Navigator>
  );
const ExpensesStack = stack('ExpensesList', [
  ['ExpensesList', ExpensesListScreen, 'My Expenses'],
  ['ExpenseDetails', ExpenseDetailsScreen, 'Expense Details'],
  ['AddExpense', ExpenseFormScreen, 'Create Expense'],
  ['EditExpense', EditExpenseScreen, 'Edit Expense'],
]);
const HomeStack = stack('AddExpense', [
  ['AddExpense', ExpenseFormScreen, 'Home'],
  ['ExpenseDetails', ExpenseDetailsScreen, 'Expense Details'],
]);
const TeamStack = stack('TeamExpensesList', [
  ['TeamExpensesList', TeamExpensesListScreen, 'Team Expenses'],
  ['TeamExpenseDetails', TeamExpenseDetails, 'Expense Review'],
]);
const OrgStack = stack('OrgExpensesList', [
  ['OrgExpensesList', OrganizationalExpensesScreen, 'Organization Expenses'],
  ['TransferExpense', TransferExpenseScreen, 'Transfer Expense'],
  ['TeamExpenseDetails', TeamExpenseDetails, 'Expense Review'],
]);
const BookingStack = stack('MyBookings', [
  ['MyBookings', MyBookingsScreen, 'Bookings'],
  ['BookingDetails', BookingDetailsScreen, 'Booking Details'],
  ['AddBooking', BookingFormScreen, 'New Booking'],
]);
const AdminBookingStack = stack('FinanceBookings', [
  ['FinanceBookings', FinanceBookingsScreen, 'Administrative Bookings'],
  ['BookingDetails', BookingDetailsScreen, 'Booking Details'],
]);
const UserStack = stack('UserManagement', [
  ['UserManagement', UserManagementScreen, 'Users'],
  ['AddUserForm', UserFormScreen, 'Add User'],
]);
const ManageStack = stack('ManageHome', [
  ['ManageHome', ManageScreen, 'Manage'],
  ['Clients', MasterDataScreen, 'Clients'],
  ['Categories', MasterDataScreen, 'Categories'],
  ['Department Management', DepartmentListScreen, 'Departments'],
  ['Cost Centers', MasterDataScreen, 'Cost Centers'],
  ['Administrative', AdministrativeScreen, 'Administrative'],
]);
const LogsStack = stack('LogsHome', [
  ['LogsHome', LogsHomeScreen, 'Logs'],
  ['Audit Logs', LogsScreen, 'Audit Logs'],
  ['Security Logs', LogsScreen, 'Security Logs'],
]);
const ProfileStack = stack('ProfileScreen', [
  ['ProfileScreen', ProfileScreen, 'My Profile'],
]);
const direct = (component, title) => props =>
  (
    <Stack.Navigator>
      <Stack.Screen
        component={component}
        name={title}
        options={header(props.navigation, title)}
      />
    </Stack.Navigator>
  );
const icon =
  name =>
  ({ color, size }) =>
    <MaterialIcons name={name} size={Math.min(size, 19)} color={color} />;
export default function AppDrawer() {
  const insets = useSafeAreaInsets();
  const role = useSelector(s => s.auth.role) || 'employee';
  const { isAdministrative, loading } = useAdministrativeStatus();
  if (loading) return null;
  const common = {
    headerShown: false,
    drawerActiveBackgroundColor: '#182B59',
    drawerActiveTintColor: '#FFF',
    drawerInactiveTintColor: '#4F5B70',
    drawerLabelStyle: {
      fontSize: 12,
      fontWeight: '500',
      marginLeft: 0,
      flexShrink: 1,
      lineHeight: 12,
    },
    drawerItemStyle: {
      borderRadius: 8,
      marginHorizontal: 4,
      marginVertical: 2,
      height:45,
      paddingVertical: 0,
      paddingHorizontal: 12,
    },
    drawerStyle: { width: 250, backgroundColor: '#FFF' },
    drawerType: 'front',
    sceneStyle: { paddingBottom: insets.bottom, backgroundColor: '#F7F8FB' },
  };
  return (
    <Drawer.Navigator
      drawerContent={p => <CustomDrawerContent {...p} />}
      screenOptions={common}
    >
      {role === 'admin' ? (
        <Drawer.Screen
          name="Users"
          component={UserStack}
          options={{ drawerIcon: icon('people-outline') }}
        />
      ) : (
        <Drawer.Screen
          name="Dashboard"
          component={direct(DashboardScreen, 'Dashboard')}
          options={{ drawerIcon: icon('bar-chart') }}
        />
      )}
      {role !== 'admin' && (
        <Drawer.Screen
          name="Home"
          component={HomeStack}
          options={{ drawerIcon: icon('home') }}
        />
      )}
      <Drawer.Screen
        name={role === 'employee' ? 'History' : 'My Expenses'}
        component={ExpensesStack}
        options={{
          drawerIcon: icon(role === 'employee' ? 'history' : 'description'),
        }}
      />
      {(role === 'manager' || role === 'finance') && (
        <Drawer.Screen
          name="Team Expenses"
          component={TeamStack}
          options={{ drawerIcon: icon('groups') }}
        />
      )}
      {role === 'admin' && (
        <Drawer.Screen
          name="Org Expenses"
          component={OrgStack}
          options={{ drawerIcon: icon('description') }}
        />
      )}
      <Drawer.Screen
        name="Bookings"
        component={BookingStack}
        options={{ drawerIcon: icon('flight-takeoff') }}
      />
      {role === 'admin' && (
        <Drawer.Screen
          name="Dashboard"
          component={direct(DashboardScreen, 'Dashboard')}
          options={{ drawerIcon: icon('bar-chart') }}
        />
      )}
      {role === 'admin' && (
        <Drawer.Screen
          name="Manage"
          component={ManageStack}
          options={{ drawerIcon: icon('settings') }}
        />
      )}
      {role === 'admin' && (
        <Drawer.Screen
          name="Logs"
          component={LogsStack}
          options={{ drawerIcon: icon('monitor-heart') }}
        />
      )}
      {isAdministrative && (
        <Drawer.Screen
          name="Administrative Bookings"
          component={AdminBookingStack}
          options={{ drawerIcon: icon('admin-panel-settings') }}
        />
      )}
      <Drawer.Screen
        name="Notifications"
        component={direct(NotificationsScreen, 'Notifications')}
        options={{ drawerIcon: icon('notifications-none') }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileStack}
        options={{ drawerIcon: icon('person-outline') }}
      />
    </Drawer.Navigator>
  );
}
