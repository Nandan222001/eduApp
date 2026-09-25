import { describe, it, expect } from 'vitest';
import { renderWithDemoAdmin, screen, userEvent, within } from '../../tests/test-utils';
import AcademicStructure from './AcademicStructure';

describe('AcademicStructure', () => {
  it('renders the page header and the Academic Year tab by default', () => {
    renderWithDemoAdmin(<AcademicStructure />);

    expect(screen.getByText('Academic Structure Configuration')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Academic Year & Terms' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByText('Academic Years')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Academic Year/i })).toBeInTheDocument();
  });

  it('switches to the Grades & Sections tab', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AcademicStructure />);

    await user.click(screen.getByRole('tab', { name: 'Grades & Sections' }));

    expect(screen.getByText('Grades')).toBeInTheDocument();
    expect(screen.queryByText('Academic Years')).not.toBeInTheDocument();
  });

  it('switches to the Subjects, Timetable Builder, Exam Schedules, and Grading Scheme tabs', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AcademicStructure />);

    await user.click(screen.getByRole('tab', { name: 'Subjects' }));
    expect(within(screen.getByRole('tabpanel')).getByText('Subjects')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Timetable Builder' }));
    expect(within(screen.getByRole('tabpanel')).getByText('Timetable')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Exam Schedules' }));
    expect(within(screen.getByRole('tabpanel')).getByText('Exam Schedule')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Grading Scheme' }));
    expect(
      within(screen.getByRole('tabpanel')).getByText('Grading Scheme Configuration')
    ).toBeInTheDocument();
  });

  it('opens the Add Academic Year dialog', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AcademicStructure />);

    await user.click(screen.getByRole('button', { name: /Add Academic Year/i }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByLabelText('Academic Year Name')).toBeInTheDocument();
  });
});
