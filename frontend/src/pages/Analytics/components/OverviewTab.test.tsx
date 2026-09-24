import { describe, it, expect } from 'vitest';
import { renderWithDemoAdmin, screen } from '../../../../tests/test-utils';
import OverviewTab from './OverviewTab';

describe('OverviewTab', () => {
  it('renders the weekly activity trends heading and chart', () => {
    renderWithDemoAdmin(<OverviewTab />);

    expect(screen.getByText('Weekly Activity Trends')).toBeInTheDocument();
  });
});
