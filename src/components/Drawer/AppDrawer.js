import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';

import { useAdministrativeStatus } from '../redux/useAdministrativeStatus';
import BookingDetailsScreen from '../screens/BookingDetailsScreen';
import BookingFormScreen from '../screens/BookingFormScreen';
import DepartmentListScreen from '../screens/DepartmentListScreen';
import EditExpenseScreen from '../screens/EditExpenseScreen';
import ExpenseDetailsScreen from '../screens/ExpenseDetailsScreen';
import ExpenseFormScreen from '../screens/ExpenseFormScreen';
import ExpensesListScreen from '../screens/ExpensesListScreen';
import FinanceBookingsScreen from '../screens/FinanceBookingsScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import OrganizationalExpensesScreen from '../screens/OrganizationalExpensesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TeamExpenseDetails from '../screens/TeamExpenseDetailScreen';
import TeamExpensesListScreen from '../screens/TeamExpensesScreen';
import TransferExpenseScreen from '../screens/TransferExpenseScreen';
import UserFormScreen from '../screens/UserFormScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';
import CustomDrawerContent from './CustomDrawerContent';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// Enhanced header configuration
const getHeaderOptions = (navigation, title) => ({
  headerStyle: {
    backgroundColor: COLORS.primary[600],
    elevation: 4,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTintColor: COLORS.background.primary,
  headerTitleStyle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  headerLeft: () => (
    <TouchableOpacity
      onPress={() => navigation.toggleDrawer()}
      style={{
        marginLeft: SPACING.md,
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      }}
      activeOpacity={0.7}
    >
      <MaterialIcons name="menu" size={24} color={COLORS.background.primary} />
    </TouchableOpacity>
  ),
  title,
});

// Stack for bookings
function MyBookingsStack({ navigation }) {
  return (
    <Stack.Navigator
      screenOptions={{
        ...getHeaderOptions(navigation),
        headerBackTitleVisible: false,
        headerBackButtonMenuEnabled: false,
      }}
    >
      <Stack.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={getHeaderOptions(navigation, 'My Bookings')}
      />

      <Stack.Screen
        name="BookingDetails"
        component={BookingDetailsScreen}
        options={getHeaderOptions(navigation, 'Booking Details')}
      />

      <Stack.Screen
        name="AddBooking"
        component={BookingFormScreen}
        options={getHeaderOptions(navigation, 'Add Booking')}
      />
    </Stack.Navigator>
  );
}

function AdministrativeBookingsStack({ navigation }) {
  return (
    <Stack.Navigator
      screenOptions={{
        ...getHeaderOptions(navigation),
        headerBackTitleVisible: false,
        headerBackButtonMenuEnabled: false,
      }}
    >
      <Stack.Screen
        name="FinanceBookings"
        component={FinanceBookingsScreen}
        options={getHeaderOptions(navigation, 'Administrative Bookings')}
      />

      <Stack.Screen
        name="BookingDetails"
        component={BookingDetailsScreen}
        options={getHeaderOptions(navigation, 'Booking Details')}
      />
    </Stack.Navigator>
  );
}

// Stack for expenses
function ExpensesStack({ navigation }) {
  return (
    <Stack.Navigator
      screenOptions={{
        ...getHeaderOptions(navigation),
        headerBackTitleVisible: false,
        headerBackButtonMenuEnabled: false,
      }}
    >
      <Stack.Screen
        name="ExpensesList"
        component={ExpensesListScreen}
        options={getHeaderOptions(navigation, 'My Expenses')}
      />
      <Stack.Screen
        name="ExpenseDetails"
        component={ExpenseDetailsScreen}
        options={getHeaderOptions(navigation, 'Expense Details')}
      />
      <Stack.Screen
        name="AddExpense"
        component={ExpenseFormScreen}
        options={getHeaderOptions(navigation, 'Create Expense')}
      />
      <Stack.Screen
        name="EditExpense"
        component={EditExpenseScreen}
        options={getHeaderOptions(navigation, 'Edit Expense')}
      />
    </Stack.Navigator>
  );
}

// Stack for department management
function DepartmentStack({ navigation }) {
  return (
    <Stack.Navigator
      screenOptions={{
        ...getHeaderOptions(navigation),
        headerBackTitleVisible: false,
        headerBackButtonMenuEnabled: false,
      }}
    >
      <Stack.Screen
        name="DepartmentManagement"
        component={DepartmentListScreen}
        options={getHeaderOptions(navigation, 'Department Management')}
      />
    </Stack.Navigator>
  );
}

function UserStack({ navigation }) {
  return (
    <Stack.Navigator
      screenOptions={{
        ...getHeaderOptions(navigation),
        headerBackTitleVisible: false,
        headerBackButtonMenuEnabled: false,
      }}
    >
      <Stack.Screen
        name="UserManagement"
        component={UserManagementScreen}
        options={getHeaderOptions(navigation, 'User Management')}
      />
      <Stack.Screen
        name="AddUserForm"
        component={UserFormScreen}
        options={getHeaderOptions(navigation, 'Add New User')}
      />
    </Stack.Navigator>
  );
}

function TeamExpensesStack({ navigation }) {
  return (
    <Stack.Navigator
      screenOptions={{
        ...getHeaderOptions(navigation),
        headerBackTitleVisible: false,
        headerBackButtonMenuEnabled: false,
      }}
    >
      <Stack.Screen
        name="TeamExpensesList"
        component={TeamExpensesListScreen}
        options={getHeaderOptions(navigation, 'Team Expenses')}
      />
      <Stack.Screen
        name="TeamExpenseDetails"
        component={TeamExpenseDetails}
        options={getHeaderOptions(navigation, 'Expense Review')}
      />
    </Stack.Navigator>
  );
}

function OrgExpensesStack({ navigation }) {
  return (
    <Stack.Navigator
      screenOptions={{
        ...getHeaderOptions(navigation),
        headerBackTitleVisible: false,
        headerBackButtonMenuEnabled: false,
      }}
    >
      <Stack.Screen
        name="OrgExpensesList"
        component={OrganizationalExpensesScreen}
        options={getHeaderOptions(navigation, 'Organization Expenses')}
      />
      <Stack.Screen
        name="TransferExpense"
        component={TransferExpenseScreen}
        options={getHeaderOptions(navigation, 'Transfer Expense')}
      />
      <Stack.Screen
        name="TeamExpenseDetails"
        component={TeamExpenseDetails}
        options={getHeaderOptions(navigation, 'Expense Review')}
      />
    </Stack.Navigator>
  );
}

// Stack for profile
function ProfileStack({ navigation }) {
  return (
    <Stack.Navigator
      screenOptions={{
        ...getHeaderOptions(navigation),
        headerBackTitleVisible: false,
        headerBackButtonMenuEnabled: false,
      }}
    >
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={getHeaderOptions(navigation, 'My Profile')}
      />
    </Stack.Navigator>
  );
}

// Enhanced Drawer
export default function AppDrawer() {
  const { data: user } = useSelector(state => state.auth); // Get user data from Redux
  const role = user?.role || 'employee'; // Default to employee
  const { isAdministrative, loading } = useAdministrativeStatus();

  if (loading) return null;

  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: COLORS.primary[600],
        drawerActiveTintColor: COLORS.background.primary,
        drawerInactiveTintColor: COLORS.text.secondary,
        drawerInactiveBackgroundColor: 'transparent',
        drawerLabelStyle: {
          fontSize: TYPOGRAPHY.fontSize.base,
          fontWeight: TYPOGRAPHY.fontWeight.medium,
          marginLeft: -SPACING.md,
        },
        drawerItemStyle: {
          borderRadius: BORDER_RADIUS.lg,
          marginHorizontal: SPACING.sm,
          marginVertical: SPACING.xs,
          paddingHorizontal: SPACING.sm,
        },
        drawerStyle: {
          backgroundColor: COLORS.background.primary,
          width: 280,
        },
        overlayColor: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Always visible - My Expenses */}
      <Drawer.Screen
        name="Expenses"
        component={ExpensesStack}
        options={{
          drawerLabel: 'My Expenses',
          drawerIcon: ({ color, size, focused }) => (
            <MaterialIcons
              name="receipt-long"
              size={focused ? size + 2 : size}
              color={color}
            />
          ),
        }}
      />

      {/* Manager and Finance - Team Expenses */}
      {(role === 'manager' || role === 'finance') && (
        <Drawer.Screen
          name="Team Expenses"
          component={TeamExpensesStack}
          options={{
            drawerLabel: 'Team Expenses',
            drawerIcon: ({ color, size, focused }) => (
              <MaterialIcons
                name="groups"
                size={focused ? size + 2 : size}
                color={color}
              />
            ),
          }}
        />
      )}

      {/* Admin only - User Management */}
      {role === 'admin' && (
        <>
          <Drawer.Screen
            name="User Management"
            component={UserStack}
            options={{
              drawerLabel: 'User Management',
              drawerIcon: ({ color, size, focused }) => (
                <MaterialIcons
                  name="admin-panel-settings"
                  size={focused ? size + 2 : size}
                  color={color}
                />
              ),
            }}
          />
          <Drawer.Screen
            name="Department Management"
            component={DepartmentStack}
            options={{
              drawerLabel: 'Department Management',
              drawerIcon: ({ color, size, focused }) => (
                <MaterialIcons
                  name="business"
                  size={focused ? size + 2 : size}
                  color={color}
                />
              ),
            }}
          />
          <Drawer.Screen
            name="Org Expenses"
            component={OrgExpensesStack}
            options={{
              drawerLabel: 'Org Expenses',
              drawerIcon: ({ color, size, focused }) => (
                <MaterialIcons
                  name="corporate-fare"
                  size={focused ? size + 2 : size}
                  color={color}
                />
              ),
            }}
          />
        </>
      )}

      <Drawer.Screen
        name="My Bookings"
        component={MyBookingsStack}
        options={{
          drawerLabel: 'My Bookings',
          drawerIcon: ({ color, size, focused }) => (
            <MaterialIcons
              name="event"
              size={focused ? size + 2 : size}
              color={color}
            />
          ),
        }}
      />

      {isAdministrative && (
        <Drawer.Screen
          name="Administrative Bookings"
          component={AdministrativeBookingsStack}
          options={{
            drawerLabel: 'Administrative Bookings',
            drawerIcon: ({ color, size, focused }) => (
              <MaterialIcons
                name="event-available"
                size={focused ? size + 2 : size}
                color={color}
              />
            ),
          }}
        />
      )}

      {/* Always visible - Profile */}
      <Drawer.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          drawerLabel: 'My Profile',
          drawerIcon: ({ color, size, focused }) => (
            <MaterialIcons
              name="account-circle"
              size={focused ? size + 2 : size}
              color={color}
            />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
