import { render, screen } from '@testing-library/react';
import { StatsCards } from '../StatsCards';

describe('StatsCards Component', () => {
  it('should render total items count correctly', () => {
    render(<StatsCards totalItems={1284} lowStockCount={12} />);
    expect(screen.getByText('TOTAL ITEMS')).toBeInTheDocument();
    expect(screen.getByText('1,284')).toBeInTheDocument();
  });

  it('should render low stock count correctly', () => {
    render(<StatsCards totalItems={1284} lowStockCount={12} />);
    expect(screen.getByText('LOW STOCK')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});
