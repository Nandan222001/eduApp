import { describe, it, expect, vi, beforeAll } from 'vitest';
import { renderWithDemoStudent, screen, waitFor, userEvent, within } from '../../tests/test-utils';
import AIStudyBuddy from './AIStudyBuddy';

// jsdom does not implement scrollIntoView; the component calls it from a ref
// on every message-list update, which otherwise throws inside a useEffect.
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

// chart.js needs a real canvas 2D context and ResizeObserver, neither of which
// jsdom provides; its async resize/update callbacks fire after test cleanup
// and crash unrelated tests. The chart isn't the behavior under test here, so
// it's replaced with a lightweight stand-in.
vi.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mock-line-chart" />,
}));

describe('AIStudyBuddy', () => {
  it('renders the morning briefing, chat, and study plan', () => {
    renderWithDemoStudent(<AIStudyBuddy />);

    expect(screen.getByText('AI Study Buddy')).toBeInTheDocument();
    expect(screen.getByText('Morning Briefing')).toBeInTheDocument();
    expect(
      screen.getByText("Hello! I'm your AI Study Buddy. How can I help you today?")
    ).toBeInTheDocument();

    // Today's study plan starts with 5 seeded tasks, none completed
    expect(screen.getByText("Today's Study Plan")).toBeInTheDocument();
    expect(screen.getByText('0/5 tasks completed')).toBeInTheDocument();
    expect(screen.getByText('Complete Chapter 5 exercises')).toBeInTheDocument();
  });

  it('sends a chat message and receives an AI reply', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<AIStudyBuddy />);

    const input = screen.getByPlaceholderText('Ask me anything about your studies...');
    await user.type(input, 'How do I prepare for my exam');
    await user.keyboard('{Enter}');

    expect(screen.getByText('How do I prepare for my exam')).toBeInTheDocument();
    // Input clears after sending
    expect(input).toHaveValue('');

    await waitFor(
      () => {
        expect(
          screen.getByText(/Preparing for an exam\? I recommend creating a study schedule/)
        ).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('completes a task, updates progress, and shows an achievement popup', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<AIStudyBuddy />);

    expect(screen.getByText('0%')).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    expect(screen.getByText('1/5 tasks completed')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();

    // An achievement toast should appear
    await waitFor(() => {
      expect(
        screen.getByText(/Task Master!|Consistent Learner!?|Focus Champion!?/)
      ).toBeInTheDocument();
    });
  });

  it('opens the mood dialog and updates the selected mood', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<AIStudyBuddy />);

    expect(screen.getByText('Current mood: neutral')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /How are you feeling\?/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('How are you feeling today?')).toBeInTheDocument();

    const goodOption = within(dialog).getByRole('button', { name: 'good' });
    await user.click(goodOption);

    await waitFor(() => {
      expect(screen.getByText('Current mood: good')).toBeInTheDocument();
    });
  });
});
