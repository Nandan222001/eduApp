import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { useTheme } from '@/theme';
import {
  ScreenContainer,
  LoadingSpinner,
  EmptyState,
  Card,
} from '@/components/shared';
import { eventsApi } from '@/api/events';
import { AcademicTerm } from '@/types';

export const AcademicYearScreen: React.FC = () => {
  const { theme } = useTheme();
  const [expandedTermId, setExpandedTermId] = useState<number | null>(null);

  const { data: academicYear, isLoading } = useQuery({
    queryKey: ['academicYear'],
    queryFn: async () => {
      const response = await eventsApi.getAcademicYear();
      return response.data;
    },
  });

  const toggleTerm = (termId: number) => {
    setExpandedTermId(prev => (prev === termId ? null : termId));
  };

  const renderTerm = (term: AcademicTerm) => {
    const isExpanded = expandedTermId === term.id;
    const startDate = new Date(term.startDate);
    const endDate = new Date(term.endDate);
    const duration = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <Card key={term.id} style={styles.termCard}>
        <TouchableOpacity onPress={() => toggleTerm(term.id)} activeOpacity={0.7}>
          <View style={styles.termHeader}>
            <View style={styles.termInfo}>
              <View style={styles.termTitleRow}>
                <Text style={[styles.termName, { color: theme.colors.text }]}>
                  {term.name}
                </Text>
                {term.isActive && (
                  <View
                    style={[
                      styles.activeBadge,
                      { backgroundColor: `${theme.colors.success}20` },
                    ]}
                  >
                    <Text style={[styles.activeBadgeText, { color: theme.colors.success }]}>
                      Active
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.termDuration, { color: theme.colors.textSecondary }]}>
                {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
              </Text>
              <Text style={[styles.termDays, { color: theme.colors.textTertiary }]}>
                {duration} days
              </Text>
            </View>
            <MaterialCommunityIcons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={theme.colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.termDetails}>
            <View style={styles.divider} />
            <View style={styles.termStats}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="calendar-start"
                  size={20}
                  color={theme.colors.primary}
                />
                <View style={styles.statContent}>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Start Date
                  </Text>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    {format(startDate, 'MMMM dd, yyyy')}
                  </Text>
                </View>
              </View>

              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="calendar-end"
                  size={20}
                  color={theme.colors.error}
                />
                <View style={styles.statContent}>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    End Date
                  </Text>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    {format(endDate, 'MMMM dd, yyyy')}
                  </Text>
                </View>
              </View>

              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="calendar-range"
                  size={20}
                  color={theme.colors.secondary}
                />
                <View style={styles.statContent}>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Duration
                  </Text>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    {Math.floor(duration / 7)} weeks, {duration % 7} days
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </Card>
    );
  };

  const renderHoliday = (holiday: any) => {
    const startDate = new Date(holiday.startDate);
    const endDate = new Date(holiday.endDate);
    const isMultiDay = holiday.startDate !== holiday.endDate;

    return (
      <View key={holiday.id} style={styles.holidayItem}>
        <View
          style={[
            styles.holidayIcon,
            { backgroundColor: `${theme.colors.success}20` },
          ]}
        >
          <MaterialCommunityIcons
            name="beach"
            size={24}
            color={theme.colors.success}
          />
        </View>
        <View style={styles.holidayInfo}>
          <Text style={[styles.holidayName, { color: theme.colors.text }]}>
            {holiday.title}
          </Text>
          <Text style={[styles.holidayDate, { color: theme.colors.textSecondary }]}>
            {isMultiDay
              ? `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`
              : format(startDate, 'MMM dd, yyyy')}
          </Text>
          {holiday.description && (
            <Text style={[styles.holidayDescription, { color: theme.colors.textTertiary }]}>
              {holiday.description}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingSpinner />
      </ScreenContainer>
    );
  }

  if (!academicYear) {
    return (
      <ScreenContainer>
        <EmptyState
          icon="calendar-blank"
          title="No Academic Year"
          description="Academic year information is not available"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Academic Year {academicYear.name}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {format(new Date(academicYear.startDate), 'MMM dd, yyyy')} -{' '}
              {format(new Date(academicYear.endDate), 'MMM dd, yyyy')}
            </Text>
          </View>
        </View>

        <Card style={styles.overviewCard}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <View
                style={[
                  styles.overviewIcon,
                  { backgroundColor: `${theme.colors.primary}20` },
                ]}
              >
                <MaterialCommunityIcons
                  name="calendar-multiple"
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={[styles.overviewValue, { color: theme.colors.text }]}>
                {academicYear.terms.length}
              </Text>
              <Text style={[styles.overviewLabel, { color: theme.colors.textSecondary }]}>
                Terms
              </Text>
            </View>

            <View style={styles.overviewItem}>
              <View
                style={[
                  styles.overviewIcon,
                  { backgroundColor: `${theme.colors.success}20` },
                ]}
              >
                <MaterialCommunityIcons
                  name="beach"
                  size={24}
                  color={theme.colors.success}
                />
              </View>
              <Text style={[styles.overviewValue, { color: theme.colors.text }]}>
                {academicYear.holidays.length}
              </Text>
              <Text style={[styles.overviewLabel, { color: theme.colors.textSecondary }]}>
                Holidays
              </Text>
            </View>

            <View style={styles.overviewItem}>
              <View
                style={[
                  styles.overviewIcon,
                  { backgroundColor: `${theme.colors.secondary}20` },
                ]}
              >
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={24}
                  color={theme.colors.secondary}
                />
              </View>
              <Text style={[styles.overviewValue, { color: theme.colors.text }]}>
                {Math.ceil(
                  (new Date(academicYear.endDate).getTime() -
                    new Date(academicYear.startDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}
              </Text>
              <Text style={[styles.overviewLabel, { color: theme.colors.textSecondary }]}>
                Total Days
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Terms</Text>
          {academicYear.terms.map(renderTerm)}
        </View>

        {academicYear.holidays.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Holidays & Breaks
            </Text>
            <Card style={styles.holidaysCard}>
              {academicYear.holidays.map(renderHoliday)}
            </Card>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  overviewCard: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  termCard: {
    marginBottom: 12,
  },
  termHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  termInfo: {
    flex: 1,
  },
  termTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  termName: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  termDuration: {
    fontSize: 14,
    marginBottom: 2,
  },
  termDays: {
    fontSize: 12,
  },
  termDetails: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginBottom: 16,
  },
  termStats: {
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  holidaysCard: {
    padding: 16,
  },
  holidayItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  holidayIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  holidayInfo: {
    flex: 1,
  },
  holidayName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  holidayDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  holidayDescription: {
    fontSize: 12,
  },
});
