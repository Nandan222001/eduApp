import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { useTheme } from '@/theme';
import {
  ScreenContainer,
  LoadingSpinner,
  EmptyState,
  Calendar,
  CalendarLegend,
  EventCard,
  Button,
  Card,
  CountdownTimer,
} from '@/components/shared';
import { eventsApi } from '@/api/events';
import { CalendarService } from '@/services/calendarService';
import { EventReminderService } from '@/services/eventReminderService';
import { Event, EventType, EventStatus, CalendarViewMode, RSVPStatus } from '@/types';

export const EventsScreen: React.FC = () => {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<CalendarViewMode>(CalendarViewMode.MONTH);
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<EventType[]>([]);

  const { data: eventsData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['events', currentMonth],
    queryFn: async () => {
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const response = await eventsApi.getEventsByDateRange(startDate, endDate);
      return response.data;
    },
  });

  const { data: upcomingEvents, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ['upcomingEvents'],
    queryFn: async () => {
      const response = await eventsApi.getUpcomingEvents(10);
      return response.data;
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: number; status: RSVPStatus }) => {
      return eventsApi.rsvpToEvent(eventId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingEvents'] });
      setShowEventModal(false);
      Alert.alert('Success', 'RSVP updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update RSVP');
    },
  });

  const filteredEvents = useMemo(() => {
    if (!eventsData) return [];
    if (selectedFilters.length === 0) return eventsData;
    return eventsData.filter(event => selectedFilters.includes(event.type));
  }, [eventsData, selectedFilters]);

  const eventsForSelectedDate = useMemo(() => {
    if (!filteredEvents) return [];
    return filteredEvents.filter(event => event.startDate === selectedDate);
  }, [filteredEvents, selectedDate]);

  const handleDayPress = (date: string) => {
    setSelectedDate(date);
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev =>
      direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  const handleEventPress = (event: Event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleSyncToCalendar = async (event: Event) => {
    try {
      const deviceEventId = await CalendarService.syncEventToDeviceCalendar(event);
      if (deviceEventId) {
        Alert.alert('Success', 'Event synced to your device calendar');
      } else {
        Alert.alert('Error', 'Failed to sync event. Please check calendar permissions.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to sync event to calendar');
    }
  };

  const handleSetReminder = async (event: Event) => {
    try {
      const notificationId = await EventReminderService.scheduleMultipleReminders(event, [
        60,
        1440,
      ]);
      if (notificationId.length > 0) {
        Alert.alert('Success', 'Reminders set for this event');
      } else {
        Alert.alert('Error', 'Failed to set reminders. Please check notification permissions.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to set reminders');
    }
  };

  const handleRSVP = (status: RSVPStatus) => {
    if (!selectedEvent) return;
    rsvpMutation.mutate({ eventId: selectedEvent.id, status });
  };

  const toggleFilter = (type: EventType) => {
    setSelectedFilters(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const renderFilterChips = () => {
    const filterOptions = [
      { type: EventType.EXAM, label: 'Exams', icon: 'pencil' },
      { type: EventType.ASSIGNMENT, label: 'Assignments', icon: 'clipboard-text' },
      { type: EventType.PARENT_TEACHER_MEETING, label: 'PT Meetings', icon: 'account-group' },
      { type: EventType.SCHOOL_EVENT, label: 'Events', icon: 'school' },
      { type: EventType.HOLIDAY, label: 'Holidays', icon: 'beach' },
      { type: EventType.SPORTS_DAY, label: 'Sports', icon: 'basketball' },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filterOptions.map(option => {
          const isSelected = selectedFilters.includes(option.type);
          return (
            <TouchableOpacity
              key={option.type}
              onPress={() => toggleFilter(option.type)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={option.icon}
                size={16}
                color={isSelected ? theme.colors.textInverse : theme.colors.text}
              />
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: isSelected ? theme.colors.textInverse : theme.colors.text,
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderViewModeToggle = () => (
    <View style={styles.viewModeToggle}>
      {[
        { mode: CalendarViewMode.MONTH, icon: 'calendar-month', label: 'Month' },
        { mode: CalendarViewMode.AGENDA, icon: 'view-agenda', label: 'List' },
      ].map(item => (
        <TouchableOpacity
          key={item.mode}
          onPress={() => setViewMode(item.mode)}
          style={[
            styles.viewModeButton,
            {
              backgroundColor:
                viewMode === item.mode ? theme.colors.primary : theme.colors.surface,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={20}
            color={viewMode === item.mode ? theme.colors.textInverse : theme.colors.text}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEventModal = () => {
    if (!selectedEvent) return null;

    return (
      <Modal
        visible={showEventModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Event Details
              </Text>
              <TouchableOpacity onPress={() => setShowEventModal(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <EventCard event={selectedEvent} showCountdown />

              {selectedEvent.metadata?.subjectName && (
                <View style={styles.metadataRow}>
                  <MaterialCommunityIcons
                    name="book-open-variant"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={[styles.metadataText, { color: theme.colors.text }]}>
                    {selectedEvent.metadata.subjectName}
                  </Text>
                </View>
              )}

              {selectedEvent.organizerName && (
                <View style={styles.metadataRow}>
                  <MaterialCommunityIcons
                    name="account"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={[styles.metadataText, { color: theme.colors.text }]}>
                    Organized by {selectedEvent.organizerName}
                  </Text>
                </View>
              )}

              {selectedEvent.maxAttendees && (
                <View style={styles.metadataRow}>
                  <MaterialCommunityIcons
                    name="account-multiple"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={[styles.metadataText, { color: theme.colors.text }]}>
                    {selectedEvent.currentAttendees || 0} / {selectedEvent.maxAttendees}{' '}
                    attendees
                  </Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <Button
                  title="Sync to Calendar"
                  icon="calendar-sync"
                  variant="outline"
                  size="small"
                  onPress={() => handleSyncToCalendar(selectedEvent)}
                  fullWidth
                />
                <Button
                  title="Set Reminder"
                  icon="bell-ring"
                  variant="outline"
                  size="small"
                  onPress={() => handleSetReminder(selectedEvent)}
                  fullWidth
                />
              </View>

              {selectedEvent.requiresRSVP && (
                <View style={styles.rsvpSection}>
                  <Text style={[styles.rsvpTitle, { color: theme.colors.text }]}>
                    RSVP
                  </Text>
                  <View style={styles.rsvpButtons}>
                    <Button
                      title="Accept"
                      icon="check"
                      variant="secondary"
                      size="small"
                      onPress={() => handleRSVP(RSVPStatus.ACCEPTED)}
                      style={styles.rsvpButton}
                    />
                    <Button
                      title="Maybe"
                      icon="help"
                      variant="outline"
                      size="small"
                      onPress={() => handleRSVP(RSVPStatus.MAYBE)}
                      style={styles.rsvpButton}
                    />
                    <Button
                      title="Decline"
                      icon="close"
                      variant="danger"
                      size="small"
                      onPress={() => handleRSVP(RSVPStatus.DECLINED)}
                      style={styles.rsvpButton}
                    />
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderCalendarView = () => (
    <View>
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={() => handleMonthChange('prev')}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: theme.colors.text }]}>
          {format(currentMonth, 'MMMM yyyy')}
        </Text>
        <TouchableOpacity onPress={() => handleMonthChange('next')}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={28}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      <Calendar
        events={filteredEvents}
        onDayPress={handleDayPress}
        selectedDate={selectedDate}
        current={format(currentMonth, 'yyyy-MM-dd')}
      />

      <CalendarLegend />

      {eventsForSelectedDate.length > 0 && (
        <View style={styles.selectedDateSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Events on {format(new Date(selectedDate), 'MMM dd, yyyy')}
          </Text>
          {eventsForSelectedDate.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => handleEventPress(event)}
              showCountdown
            />
          ))}
        </View>
      )}
    </View>
  );

  const renderAgendaView = () => (
    <FlatList
      data={filteredEvents}
      keyExtractor={item => item.id.toString()}
      renderItem={({ item }) => (
        <EventCard event={item} onPress={() => handleEventPress(item)} showCountdown />
      )}
      contentContainerStyle={styles.agendaList}
      ListEmptyComponent={
        <EmptyState
          icon="calendar-blank"
          title="No Events"
          description="No events found for the selected period"
        />
      }
    />
  );

  if (isLoadingEvents || isLoadingUpcoming) {
    return (
      <ScreenContainer>
        <LoadingSpinner />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Events & Calendar</Text>
        {renderViewModeToggle()}
      </View>

      {renderFilterChips()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {upcomingEvents && upcomingEvents.length > 0 && (
          <Card style={styles.upcomingCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Upcoming Events
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.upcomingScroll}
            >
              {upcomingEvents.slice(0, 5).map(event => (
                <TouchableOpacity
                  key={event.id}
                  onPress={() => handleEventPress(event)}
                  style={styles.upcomingEventCard}
                >
                  <View
                    style={[
                      styles.upcomingEventContent,
                      { backgroundColor: theme.colors.surface },
                    ]}
                  >
                    <Text
                      style={[styles.upcomingEventTitle, { color: theme.colors.text }]}
                      numberOfLines={2}
                    >
                      {event.title}
                    </Text>
                    <Text
                      style={[
                        styles.upcomingEventDate,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {format(new Date(event.startDate), 'MMM dd')}
                    </Text>
                    <CountdownTimer event={event} compact />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Card>
        )}

        {viewMode === CalendarViewMode.MONTH ? renderCalendarView() : renderAgendaView()}
      </ScrollView>

      {renderEventModal()}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  viewModeToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  upcomingCard: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  upcomingScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  upcomingEventCard: {
    marginRight: 12,
    width: 150,
  },
  upcomingEventContent: {
    padding: 12,
    borderRadius: 12,
    minHeight: 100,
  },
  upcomingEventTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  upcomingEventDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
  },
  selectedDateSection: {
    padding: 16,
  },
  agendaList: {
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    padding: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  metadataText: {
    fontSize: 14,
  },
  modalActions: {
    gap: 12,
    marginTop: 16,
  },
  rsvpSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  rsvpTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  rsvpButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  rsvpButton: {
    flex: 1,
  },
});
