import { render, screen, act } from '@testing-library/react';
import { Sidebar } from '../Sidebar';

let currentLng = 'es';

const es: Record<string, string> = {
  'sidebar.warehouse': 'ALMACÉN PRINCIPAL', 'sidebar.overview': 'Vista General',
  'sidebar.catalog': 'Catálogo', 'sidebar.stock_levels': 'Niveles de Stock',
  'sidebar.special_requests': 'Pedidos Especiales',
};
const en: Record<string, string> = {
  'sidebar.warehouse': 'MAIN WAREHOUSE', 'sidebar.overview': 'Overview',
  'sidebar.catalog': 'Catalog', 'sidebar.stock_levels': 'Stock Levels',
  'sidebar.special_requests': 'Special Requests',
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => (currentLng === 'en' ? en : es)[key] || key,
  }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => `/${currentLng}/inventory`,
}));

describe('Sidebar Component', () => {
  it('should render the branding logo and title', () => {
    render(<Sidebar lng="es" />);
    expect(screen.getByText('Talavera Folio')).toBeInTheDocument();
    expect(screen.getByText('ALMACÉN PRINCIPAL')).toBeInTheDocument();
  });

  it('should render all primary navigation links', () => {
    render(<Sidebar lng="es" />);
    expect(screen.getByText('Vista General')).toBeInTheDocument();
    expect(screen.getByText('Catálogo')).toBeInTheDocument();
    expect(screen.getByText('Niveles de Stock')).toBeInTheDocument();
  });

  it('should highlight the active link based on pathname', () => {
    render(<Sidebar lng="es" />);
    const catalogLink = screen.getByText('Catálogo').closest('div');
    expect(catalogLink).toHaveClass('bg-[#f1f6ff]');
  });

  it('should render the special requests nav link with Spanish label.', () => {
    currentLng = 'es';
    render(<Sidebar lng="es" />);
    expect(screen.getByText('Pedidos Especiales')).toBeInTheDocument();
  });

  it('should render the special requests nav link with English label.', () => {
    currentLng = 'en';
    render(<Sidebar lng="en" />);
    expect(screen.getByText('Special Requests')).toBeInTheDocument();
    currentLng = 'es'; // reset
  });
});
