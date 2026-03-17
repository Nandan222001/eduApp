import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text, Card, Badge, Icon } from '@rneui/themed';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useQuery } from '@tanstack/react-query';
import { format, isPast, parseISO } from 'date-fns';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { StudentTabScreenProps } from '@types';
import { assignmentsApi, AssignmentDetail } from '../../api/assignments';
import { LoadingState, ErrorState, EmptyState } from '../../components';

const Tab = createMaterialTopTabNavigator();

type Props = StudentTabScreenProps<'Assignments'>;

const AssignmentCard: React.FC<{
  assignment: AssignmentDetail;
  onPress: () => void;
}> = ({ assignment, onPress }) => {
  const getStatusBadge = () => {
    const statusConfig = {
      pending: { color: COLORS.warning, text: 'Pending' },
      submitted: { color: COLORS.info, text: 'Submitted' },
      graded: { color: COLORS.success, text: 'Graded' },
      overdue: { color: COLORS.error, text: 'Overdue' },
    };

    const config = statusConfig[assignment.status];
    return <Badge value={config.text} badgeStyle={{ backgroundColor: config.color }} />;
  };

  const getDueDateColor = () => {
    if (assignment.status === 'graded' || assignment.status === 'submitted') {
      return COLORS.textSecondary;
    }
    
    const dueDate = parseISO(assignment.dueDate);
    const now = new Date();
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (isPast(dueDate)) return COLORS.error;
    if (hoursUntilDue < 24) return COLORS.warning;
    return COLORS.textSecondary;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card containerStyle={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.assignmentTitle} numberOfLines={1}>
              {assignment.title}
            </Text>
            <Text style={styles.subjectText}>{assignment.subject}</Text>
          </View>
          {getStatusBadge()}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Icon name="calendar" type="feather" size={16} color={getDueDateColor()} />
            <Text style={[styles.infoText, { color: getDueDateColor() }]}>
              Due: {format(parseISO(assignment.dueDate), 'MMM dd, yyyy h:mm a')}
            </Text>
          </View>

          {assignment.teacherName && (
            <View style={styles.infoRow}>
              <Icon name="user" type="feather" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{assignment.teacherName}</Text>
            </View>
          )}

          {assignment.totalMarks !== undefined && (
            <View style={styles.infoRow}>
              <Icon name="award" type="feather" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>
                {assignment.obtainedMarks !== undefined
                  ? `${assignment.obtainedMarks}/${assignment.totalMarks} marks`
                  : `Total: ${assignment.totalMarks} marks`}
              </Text>
            </View>
          )}
        </View>

        {assignment.description && (
          <Text style={styles.descriptionText} numberOfLines={2}>
            {assignment.description}
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const AssignmentsList: React.FC<{
  status?: 'pending' | 'submitted' | 'graded' | 'overdue';
  navigation: any;
}> = ({ status, navigation }) => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['assignments', status],
    queryFn: async () => {
      const response = await assignmentsApi.getAssignments({ status });
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAssignmentPress = (assignmentId: number) => {
    navigation.navigate('AssignmentDetail', { assignmentId: assignmentId.toString() });
  };

  if (isLoading && !refreshing) {
    return <LoadingState message="Loading assignments..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load assignments"
        message={(error as any)?.message || 'Please check your connection and try again'}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon="clipboard"
        title="No assignments found"
        message={
          status === 'pending'
            ? 'You have no pending assignments'
            : status === 'submitted'
            ? 'You have not submitted any assignments yet'
            : status === 'graded'
            ? 'No graded assignments available'
            : 'No assignments available'
        }
      />
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <AssignmentCard
          assignment={item}
          onPress={() => handleAssignmentPress(item.id)}
        />
      )}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
    />
  );
};

const PendingTab: React.FC<{ navigation: any }> = ({ navigation }) => {
  return <AssignmentsList status="pending" navigation={navigation} />;
};

const SubmittedTab: React.FC<{ navigation: any }> = ({ navigation }) => {
  return <AssignmentsList status="submitted" navigation={navigation} />;
};

const GradedTab: React.FC<{ navigation: any }> = ({ navigation }) => {
  return <AssignmentsList status="graded" navigation={navigation} />;
};

export const AssignmentsScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarLabelStyle: {
            fontSize: FONT_SIZES.sm,
            fontWeight: '600',
            textTransform: 'none',
          },
          tabBarIndicatorStyle: {
            backgroundColor: COLORS.primary,
            height: 3,
          },
          tabBarStyle: {
            backgroundColor: COLORS.background,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          },
        }}
      >
        <Tab.Screen name="Pending">
          {() => <PendingTab navigation={navigation} />}
        </Tab.Screen>
        <Tab.Screen name="Submitted">
          {() => <SubmittedTab navigation={navigation} />}
        </Tab.Screen>
        <Tab.Screen name="Graded">
          {() => <GradedTab navigation={navigation} />}
        </Tab.Screen>
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  assignmentTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  subjectText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  cardBody: {
    marginBottom: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  descriptionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
