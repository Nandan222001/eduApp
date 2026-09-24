import { describe, it, expect, vi } from 'vitest';
import { renderWithDemoStudent, screen, waitFor, userEvent } from '../../tests/test-utils';
import AccessibilityDemo from './AccessibilityDemo';

describe('AccessibilityDemo', () => {
  it('renders the form, icon buttons, table, and keyboard shortcuts sections', () => {
    renderWithDemoStudent(<AccessibilityDemo />);

    expect(screen.getByText('Accessibility Features Demo')).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add new item' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open modal dialog' })).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('fills the form and shows a live region message after submit', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<AccessibilityDemo />);

    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    await user.type(nameInput, 'Alex Johnson');
    await user.type(emailInput, 'alex@example.com');

    expect(nameInput).toHaveValue('Alex Johnson');
    expect(emailInput).toHaveValue('alex@example.com');

    await user.click(screen.getByRole('button', { name: 'Submit form' }));

    await waitFor(() => {
      expect(screen.getByText('Your information has been saved')).toBeInTheDocument();
    });
  });

  it('opens and closes the accessible modal', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<AccessibilityDemo />);

    expect(screen.queryByText('Accessible Modal Dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open modal dialog' }));

    expect(await screen.findByText('Accessible Modal Dialog')).toBeInTheDocument();
    expect(
      screen.getByText(/This is an accessible modal dialog with focus trap enabled/)
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByText('Accessible Modal Dialog')).not.toBeInTheDocument();
    });
  });

  it('calls the announce utility when an icon button is clicked', async () => {
    const user = userEvent.setup();
    const announceSpy = vi.spyOn(await import('../utils/accessibility'), 'announceToScreenReader');

    renderWithDemoStudent(<AccessibilityDemo />);
    await user.click(screen.getByRole('button', { name: 'Delete item' }));

    expect(announceSpy).toHaveBeenCalledWith('Delete button clicked', 'polite');
    announceSpy.mockRestore();
  });
});
