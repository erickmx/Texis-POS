import { render, screen, act } from '@testing-library/react';
import { StatsCards } from '../StatsCards';

// Mock server side useTranslation
jest.mock('@/i18n/server', () => ({
  useTranslation: () => Promise.resolve({
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
  it('should render localized labels and counts', async () => {
    await act(async () => {
      render(await StatsCards({ totalItems: 1284, lowStockCount: 12, lng: 'es' }) as any);
    });
    expect(screen.getByText('TOTAL DE ARTÍCULOS')).toBeInTheDocument();
    expect(screen.getByText('1,284')).toBeInTheDocument();
    expect(screen.getByText('STOCK BAJO')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});
