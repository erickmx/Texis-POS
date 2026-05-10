import { render, screen, act } from '@testing-library/react';
import { Sidebar } from '../Sidebar';

// Mock useTranslation for client components
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const trans: Record<string, string> = {
        'sidebar.warehouse': 'ALMACÉN PRINCIPAL',
        'sidebar.overview': 'Vista General',
        'sidebar.catalog': 'Catálogo',
        'sidebar.stock_levels': 'Niveles de Stock',
        'sidebar.analytics': 'Análisis',
        'sidebar.history': 'Historial',
        'sidebar.help': 'Ayuda',
        'sidebar.logout': 'Cerrar Sesión'
      };
      return trans[key] || key;
    },
  }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/es/inventory',
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
});
