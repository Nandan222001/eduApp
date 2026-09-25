import { describe, it, expect, vi } from 'vitest';
import { renderWithDemoAdmin, screen, userEvent, within } from '../../tests/test-utils';
import AdminMerchandiseManager from './AdminMerchandiseManager';

// chart.js needs a real canvas 2D context, which jsdom doesn't provide; the
// charts aren't the behavior under test here.
vi.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mock-line-chart" />,
  Doughnut: () => <div data-testid="mock-doughnut-chart" />,
}));

describe('AdminMerchandiseManager', () => {
  it('renders the Store Settings tab by default with the enabled state', () => {
    renderWithDemoAdmin(<AdminMerchandiseManager />);

    expect(screen.getByText('Merchandise Store Manager')).toBeInTheDocument();
    expect(screen.getByText('Store Configuration')).toBeInTheDocument();
    expect(screen.getByText('Store is active and visible to students/parents')).toBeInTheDocument();
  });

  it('toggles the store enabled switch and flips the status alert', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AdminMerchandiseManager />);

    await user.click(screen.getByRole('checkbox', { name: 'Enable Merchandise Store' }));

    expect(screen.getByText('Store is disabled and not accessible')).toBeInTheDocument();
    expect(
      screen.queryByText('Store is active and visible to students/parents')
    ).not.toBeInTheDocument();
  });

  it('lists seeded products, toggles availability, and deletes a product', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AdminMerchandiseManager />);

    await user.click(screen.getByRole('tab', { name: 'Product Catalog' }));

    expect(screen.getByText('Products (2)')).toBeInTheDocument();
    expect(screen.getByText('School Logo T-Shirt')).toBeInTheDocument();
    expect(screen.getByText('Sports Jersey')).toBeInTheDocument();

    const row = screen.getByText('School Logo T-Shirt').closest('tr') as HTMLElement;
    expect(within(row).getByText('Available')).toBeInTheDocument();

    // Toggle availability off
    const visibilityButtons = within(row).getAllByRole('button');
    await user.click(visibilityButtons[0]);
    expect(within(row).getByText('Unavailable')).toBeInTheDocument();

    // Delete the product entirely
    await user.click(visibilityButtons[2]);
    expect(screen.queryByText('School Logo T-Shirt')).not.toBeInTheDocument();
    expect(screen.getByText('Products (1)')).toBeInTheDocument();
  });

  it('adds a new product through the Add Product dialog', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AdminMerchandiseManager />);

    await user.click(screen.getByRole('tab', { name: 'Product Catalog' }));
    await user.click(screen.getByRole('button', { name: /Add Product/i }));

    expect(await screen.findByText('Add New Product')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Product Name'), 'Water Bottle');
    await user.type(screen.getByLabelText('Base Price'), '15');

    await user.click(screen.getByRole('button', { name: 'Add Product' }));

    expect(screen.getByText('Products (3)')).toBeInTheDocument();
    expect(screen.getByText('Water Bottle')).toBeInTheDocument();
  });

  it('shows the revenue analytics tab with totals and top selling products', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AdminMerchandiseManager />);

    await user.click(screen.getByRole('tab', { name: 'Revenue Analytics' }));

    expect(screen.getByText('$15,847.5')).toBeInTheDocument();
    expect(screen.getByText('127')).toBeInTheDocument();
    expect(screen.getByText('Top Selling Products')).toBeInTheDocument();
    expect(screen.getByText('School Backpack')).toBeInTheDocument();
  });
});
