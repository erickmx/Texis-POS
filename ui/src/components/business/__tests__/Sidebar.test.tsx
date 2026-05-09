import { render, screen } from '@testing-library/react';
import { Sidebar } from '../Sidebar';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/inventory',
}));

describe('Sidebar Component', () => {
  it('should render the branding logo and title', () => {
    render(<Sidebar />);
    expect(screen.getByText('Talavera Folio')).toBeInTheDocument();
    expect(screen.getByText('MAIN WAREHOUSE')).toBeInTheDocument();
  });

  it('should render all primary navigation links', () => {
    render(<Sidebar />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Catalog')).toBeInTheDocument();
    expect(screen.getByText('Stock Levels')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('should highlight the active link based on pathname', () => {
    render(<Sidebar />);
    const catalogLink = screen.getByText('Catalog').closest('div');
    // Active state in design uses surface_container_low background
    expect(catalogLink).toHaveClass('bg-surface-container-low');
  });

  it('should render secondary actions (Help, Logout)', () => {
    render(<Sidebar />);
    expect(screen.getByText('Help')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});
