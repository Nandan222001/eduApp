import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabParamList } from '../types/navigation';
import { StudentHomeScreen } from '../screens/student/StudentHomeScreen';
import { StudentCoursesScreen } from '../screens/student/StudentCoursesScreen';
import { StudentAssignmentsScreen } from '../screens/student/StudentAssignmentsScreen';
import { StudentProfileScreen } from '../screens/student/StudentProfileScreen';
import { AssignmentDetailScreen } from '../screens/student/AssignmentDetailScreen';
import { AssignmentSubmissionScreen } from '../screens/student/AssignmentSubmissionScreen';
import { CameraScreen } from '../screens/student/CameraScreen';
import { StudyMaterialsScreen } from '../screens/student/StudyMaterialsScreen';
import { SubjectMaterialsScreen } from '../screens/student/SubjectMaterialsScreen';
import { MaterialDetailScreen } from '../screens/student/MaterialDetailScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainTabParamList>();

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="StudentHome"
        component={StudentHomeScreen}
        options={{ headerTitle: 'Home' }}
      />
      <Stack.Screen
        name="AssignmentSubmission"
        component={AssignmentSubmissionScreen}
        options={{ headerTitle: 'Submit Assignment' }}
      />
      <Stack.Screen
        name="CameraScreen"
        component={CameraScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
    </Stack.Navigator>
  );
};

const CoursesStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="StudentCourses"
        component={StudentCoursesScreen}
        options={{ headerTitle: 'My Courses' }}
      />
      <Stack.Screen
        name="StudyMaterialsScreen"
        component={StudyMaterialsScreen}
        options={{ headerTitle: 'Study Materials' }}
      />
      <Stack.Screen
        name="SubjectMaterials"
        component={SubjectMaterialsScreen}
        options={({ route }) => ({
          headerTitle: route.params?.subjectName || 'Materials',
        })}
      />
      <Stack.Screen
        name="MaterialDetail"
        component={MaterialDetailScreen}
        options={{ headerTitle: 'Material Details' }}
      />
    </Stack.Navigator>
  );
};

const AssignmentsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="StudentAssignments"
        component={StudentAssignmentsScreen}
        options={{ headerTitle: 'Assignments' }}
      />
      <Stack.Screen
        name="AssignmentDetail"
        component={AssignmentDetailScreen}
        options={{ headerTitle: 'Assignment Details' }}
      />
      <Stack.Screen
        name="AssignmentSubmission"
        component={AssignmentSubmissionScreen}
        options={{ headerTitle: 'Submit Assignment' }}
      />
      <Stack.Screen
        name="CameraScreen"
        component={CameraScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
    </Stack.Navigator>
  );
};

const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="StudentProfile"
        component={StudentProfileScreen}
        options={{ headerTitle: 'Profile' }}
      />
    </Stack.Navigator>
  );
};

export const StudentNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5EA',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="StudentHome"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} />,
        }}
      />
      <Tab.Screen
        name="StudentCourses"
        component={CoursesStack}
        options={{
          tabBarLabel: 'Courses',
          tabBarIcon: ({ color }) => <TabIcon icon="📚" color={color} />,
        }}
      />
      <Tab.Screen
        name="StudentAssignments"
        component={AssignmentsStack}
        options={{
          tabBarLabel: 'Assignments',
          tabBarIcon: ({ color }) => <TabIcon icon="📝" color={color} />,
        }}
      />
      <Tab.Screen
        name="StudentProfile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const TabIcon: React.FC<{ icon: string; color: string }> = ({ icon }) => {
  return <Text style={{ fontSize: 24 }}>{icon}</Text>;
};
