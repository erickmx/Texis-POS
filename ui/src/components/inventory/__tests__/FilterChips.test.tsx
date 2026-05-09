import { render, screen } from '@testing-library/react';
import { FilterChips } from '../FilterChips';

const mockCategories = ['Notebooks', 'Fine Pens', 'Desk Organizers', 'Adhesives'];

describe('FilterChips Component', () => {
  it('should render all category chips', () => {
    render(<FilterChips categories={mockCategories} selectedCategory="Notebooks" onSelect={() => { }} />);
    expect(screen.getByText('Notebooks')).toBeInTheDocument();
    expect(screen.getByText('Fine Pens')).toBeInTheDocument();
  });

  it('should highlight the selected category', () => {
    render(<FilterChips categories={mockCategories} selectedCategory="Notebooks" onSelect={() => { }} />);
    const notebookChip = screen.getByText('Notebooks').closest('button');
    // Selected chip should have primary container background
    expect(notebookChip).toHaveClass('bg-primary-container');
  });
});
