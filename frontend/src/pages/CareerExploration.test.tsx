import { describe, it, expect } from 'vitest';
import { renderWithDemoStudent, screen, userEvent, within, waitFor } from '../../tests/test-utils';
import CareerExploration from './CareerExploration';

describe('CareerExploration', () => {
  it('renders the heading and all career discovery cards by default', () => {
    renderWithDemoStudent(<CareerExploration />);

    expect(screen.getByText('Career Exploration')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Data Scientist')).toBeInTheDocument();
    expect(screen.getByText('UX Designer')).toBeInTheDocument();
    expect(screen.getByText('Marketing Manager')).toBeInTheDocument();
    expect(screen.getByText('Environmental Engineer')).toBeInTheDocument();
    expect(screen.getByText('Financial Analyst')).toBeInTheDocument();
  });

  it('filters career cards by search query', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<CareerExploration />);

    await user.type(screen.getByPlaceholderText('Search careers...'), 'Data');

    expect(screen.getByText('Data Scientist')).toBeInTheDocument();
    expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
    expect(screen.queryByText('UX Designer')).not.toBeInTheDocument();
  });

  it('filters career cards by industry', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<CareerExploration />);

    await user.click(screen.getByRole('combobox', { name: 'Industry' }));
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText('Design'));

    expect(screen.getByText('UX Designer')).toBeInTheDocument();
    expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
    expect(screen.queryByText('Financial Analyst')).not.toBeInTheDocument();
  });

  it('opens the career detail dialog with the day-in-the-life story when Watch Video is clicked', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<CareerExploration />);

    const watchVideoButtons = screen.getAllByRole('button', { name: /Watch Video/i });
    await user.click(watchVideoButtons[0]);

    expect(screen.getByText('A Day in the Life')).toBeInTheDocument();
    expect(
      screen.getByText(/Start the day with team standup/)
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByText('A Day in the Life')).not.toBeInTheDocument();
    });
  });

  it('walks through the skills assessment quiz and shows recommendations at the end', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<CareerExploration />);

    await user.click(screen.getByRole('tab', { name: /Skills Assessment/i }));
    await user.click(screen.getByRole('button', { name: 'Start Assessment' }));

    // "Career Assessment Quiz" also appears as the still-mounted tab's card
    // title behind the dialog, so scope to the dialog itself.
    const assessmentDialog = screen.getByRole('dialog');
    expect(within(assessmentDialog).getByText('Career Assessment Quiz')).toBeInTheDocument();
    expect(
      screen.getByText('Which activity do you enjoy the most?')
    ).toBeInTheDocument();

    // Answer all 4 questions; each answer advances to the next question.
    await user.click(screen.getByText('Solving puzzles and logic problems'));
    expect(
      screen.getByText('What type of work environment do you prefer?')
    ).toBeInTheDocument();

    await user.click(screen.getByText('Collaborative team environment'));
    expect(
      screen.getByText('Which skill would you like to develop further?')
    ).toBeInTheDocument();

    await user.click(screen.getByText('Technical and programming skills'));
    expect(screen.getByText('What motivates you most in a career?')).toBeInTheDocument();

    await user.click(screen.getByText('Making a positive impact'));

    // Last answer closes the assessment dialog and opens the results dialog.
    expect(
      screen.queryByText('Which activity do you enjoy the most?')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Your Career Recommendations')).toBeInTheDocument();
    expect(screen.getByText('95% Match')).toBeInTheDocument();
  });

  it('opens the internship application dialog and can submit it', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<CareerExploration />);

    await user.click(screen.getByRole('tab', { name: /Internship Marketplace/i }));

    expect(screen.getByText('Frontend Developer Intern')).toBeInTheDocument();
    // The "applied" internship (Data Analytics Intern) shows a disabled
    // "View Application" button; "shortlisted" also shows that label but
    // stays enabled.
    const viewApplicationButtons = screen.getAllByRole('button', { name: 'View Application' });
    expect(viewApplicationButtons).toHaveLength(2);
    expect(viewApplicationButtons[0]).toBeDisabled();

    await user.click(screen.getAllByRole('button', { name: 'Apply Now' })[0]);

    expect(screen.getByText('Apply to Frontend Developer Intern')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Submit Application' }));

    await waitFor(() => {
      expect(screen.queryByText('Apply to Frontend Developer Intern')).not.toBeInTheDocument();
    });
  });

  it('shows mentors and opens the mentorship request dialog', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<CareerExploration />);

    await user.click(screen.getByRole('tab', { name: /Mentorship Program/i }));

    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Request Mentorship' })[0]);

    expect(screen.getByText('Request Mentorship from Sarah Johnson')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Send Request' }));

    await waitFor(() => {
      expect(
        screen.queryByText('Request Mentorship from Sarah Johnson')
      ).not.toBeInTheDocument();
    });
  });

  it('deletes a portfolio project', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<CareerExploration />);

    await user.click(screen.getByRole('tab', { name: /Portfolio Builder/i }));

    expect(screen.getByText('E-commerce Website')).toBeInTheDocument();
    expect(screen.getByText('Machine Learning Model')).toBeInTheDocument();

    const deleteButtons = screen.getAllByTestId('DeleteIcon');
    await user.click(deleteButtons[0]);

    expect(screen.queryByText('E-commerce Website')).not.toBeInTheDocument();
    expect(screen.getByText('Machine Learning Model')).toBeInTheDocument();
  });

  it('shows application tracking counts and the partnerships list', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<CareerExploration />);

    await user.click(screen.getByRole('tab', { name: /Application Tracking/i }));

    expect(screen.getByText('Applications Sent')).toBeInTheDocument();
    expect(screen.getAllByText('Shortlisted').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('tab', { name: /Partnership Management/i }));

    expect(screen.getByText('Tech Innovators Inc.')).toBeInTheDocument();
    expect(screen.getByText('Green Solutions Ltd.')).toBeInTheDocument();
    expect(screen.getByText('Finance Corp')).toBeInTheDocument();
  });
});
