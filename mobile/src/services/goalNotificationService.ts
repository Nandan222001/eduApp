import * as Notifications from 'expo-notifications';
import { goalsApi, Goal } from '@api/goals';
import { format, addDays, startOfWeek } from 'date-fns';

class GoalNotificationService {
  async scheduleWeeklyGoalDigest(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      const nextMonday = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7);
      nextMonday.setHours(9, 0, 0, 0);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Weekly Goal Digest',
          body: 'Time to review your goals and set new milestones for the week!',
          data: { type: 'goal_digest' },
        },
        trigger: {
          weekday: 2,
          hour: 9,
          minute: 0,
          repeats: true,
        },
      });

      console.log('Weekly goal digest scheduled successfully');
    } catch (error) {
      console.error('Failed to schedule weekly goal digest:', error);
    }
  }

  async sendGoalReminderNotification(goal: Goal): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🎯 Goal Reminder: ${goal.title}`,
          body: `Current progress: ${goal.progress}%. Keep going!`,
          data: { type: 'goal_reminder', goalId: goal.id },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send goal reminder:', error);
    }
  }

  async sendMilestoneCompletionNotification(goalTitle: string, milestoneTitle: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Milestone Achieved!',
          body: `You completed "${milestoneTitle}" for goal "${goalTitle}"`,
          data: { type: 'milestone_completion' },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send milestone completion notification:', error);
    }
  }

  async sendGoalCompletionNotification(goalTitle: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏆 Goal Completed!',
          body: `Congratulations! You achieved your goal: "${goalTitle}"`,
          data: { type: 'goal_completion' },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send goal completion notification:', error);
    }
  }

  async sendGoalDeadlineNotification(goal: Goal, daysRemaining: number): Promise<void> {
    try {
      let body = '';
      if (daysRemaining === 0) {
        body = `Your goal "${goal.title}" is due today!`;
      } else if (daysRemaining === 1) {
        body = `Your goal "${goal.title}" is due tomorrow!`;
      } else {
        body = `Your goal "${goal.title}" is due in ${daysRemaining} days.`;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Goal Deadline Approaching',
          body,
          data: { type: 'goal_deadline', goalId: goal.id },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send goal deadline notification:', error);
    }
  }

  async scheduleGoalReminders(goals: Goal[]): Promise<void> {
    try {
      for (const goal of goals) {
        if (goal.status !== 'active') continue;

        const targetDate = new Date(goal.targetDate);
        const now = new Date();
        const daysRemaining = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysRemaining === 7 || daysRemaining === 3 || daysRemaining === 1) {
          const trigger = new Date(targetDate);
          trigger.setDate(trigger.getDate() - daysRemaining);
          trigger.setHours(9, 0, 0, 0);

          if (trigger > now) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '⏰ Goal Deadline Approaching',
                body: `Your goal "${goal.title}" is due in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`,
                data: { type: 'goal_deadline', goalId: goal.id },
              },
              trigger,
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to schedule goal reminders:', error);
    }
  }

  async generateWeeklyDigestContent(): Promise<string> {
    try {
      const activeGoalsResponse = await goalsApi.getGoals('active');
      const activeGoals = activeGoalsResponse.data || [];
      const completedGoalsResponse = await goalsApi.getGoals('completed');
      const completedGoals = completedGoalsResponse.data || [];

      let digest = '📊 Weekly Goal Digest\n\n';

      if (completedGoals.length > 0) {
        digest += `🎉 Goals Completed This Week: ${completedGoals.length}\n`;
        completedGoals.slice(0, 3).forEach(goal => {
          digest += `   • ${goal.title}\n`;
        });
        digest += '\n';
      }

      if (activeGoals.length > 0) {
        digest += `🎯 Active Goals: ${activeGoals.length}\n`;
        const goalsNeedingAttention = activeGoals.filter(g => g.progress < 30);
        if (goalsNeedingAttention.length > 0) {
          digest += '\n⚠️ Goals Needing Attention:\n';
          goalsNeedingAttention.slice(0, 3).forEach(goal => {
            digest += `   • ${goal.title} (${goal.progress}%)\n`;
          });
        }
      }

      if (activeGoals.length === 0 && completedGoals.length === 0) {
        digest += 'You have no goals set. Start setting goals to track your progress!';
      }

      return digest;
    } catch (error) {
      console.error('Failed to generate weekly digest:', error);
      return 'Unable to generate weekly digest at this time.';
    }
  }

  async cancelAllGoalNotifications(): Promise<void> {
    try {
      const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const goalNotifications = allNotifications.filter(
        n => n.content.data?.type?.includes('goal')
      );

      for (const notification of goalNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      console.log('All goal notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel goal notifications:', error);
    }
  }
}

export const goalNotificationService = new GoalNotificationService();
