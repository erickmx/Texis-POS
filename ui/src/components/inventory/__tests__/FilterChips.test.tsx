import { render, screen, act } from '@testing-library/react';
import { FilterChips } from '../FilterChips';

const mockCategories = ['Notebooks', 'Fine Pens'];

// Mock useTranslation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const trans: Record<string, string> = {
        'inventory.categories.notebooks': 'Libretas',
        'inventory.categories.fine_pens': 'Plumas Finas',
      };
      return trans[key] || key;
    },
  }),
}));

describe('FilterChips Component', () => {
  it('should render translated category chips', () => {
    render(<FilterChips categories={mockCategories} selectedCategory="Notebooks" onSelect={() => { }} lng="es" />);
    expect(screen.getByText('Libretas')).toBeInTheDocument();
    expect(screen.getByText('Plumas Finas')).toBeInTheDocument();
  });

  it('should highlight the selected category', () => {
    render(<FilterChips categories={mockCategories} selectedCategory="Notebooks" onSelect={() => { }} lng="es" />);
    const notebookChip = screen.getByText('Libretas').closest('button');
    expect(notebookChip).toHaveClass('bg-primary-container');
  });
});
