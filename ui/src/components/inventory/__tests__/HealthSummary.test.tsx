import { render, screen, act } from '@testing-library/react';
import { HealthSummary } from '../HealthSummary';

// Mock client side useTranslation
jest.mock('@/i18n/client', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const trans: Record<string, string> = {
        'inventory.health_summary.title': 'Resumen de Salud',
        'inventory.health_summary.optimized': 'Tus niveles están un <1>{{score}}% optimizados</1>.',
        'inventory.health_summary.urgent_reorder': 'Hay <1>{{count}} artículos</1> urgentes.',
        'inventory.health_summary.view_urgent': 'VER PEDIDOS'
      };
      return trans[key] || key;
    },
  }),
}));

describe('HealthSummary Component', () => {
  it('should render translated metrics', () => {
    render(<HealthSummary optimizationScore={94} urgentItemsCount={12} lng="es" />);
    expect(screen.getByText('Resumen de Salud')).toBeInTheDocument();
    expect(screen.getByText(/94% optimized/i)).toBeInTheDocument();
    expect(screen.getByText(/12 items/i)).toBeInTheDocument();
  });
});
