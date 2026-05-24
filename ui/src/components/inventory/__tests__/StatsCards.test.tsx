import { render, screen } from '@testing-library/react';
import { StatsCards } from '../StatsCards';

jest.mock('@/lib/api/hooks/useStats', () => ({
  useStats: () => ({ total: 42, lowStockCount: 3, isLoading: false, error: null }),
}));

jest.mock('@/i18n/client', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'inventory.total_items': 'TOTAL DE ARTÍCULOS',
        'inventory.low_stock': 'STOCK BAJO',
      };
      return translations[key] || key;
    },
  }),
}));

describe('StatsCards Component', () => {
  it('should render localized labels and counts', () => {
    render(<StatsCards lng="es" />);
    expect(screen.getByText('TOTAL DE ARTÍCULOS')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('STOCK BAJO')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
