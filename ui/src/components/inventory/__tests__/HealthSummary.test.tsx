import { render, screen } from '@testing-library/react';
import { HealthSummary } from '../HealthSummary';

describe('HealthSummary Component', () => {
  it('should render health metrics correctly', () => {
    render(<HealthSummary optimizationScore={94} urgentItemsCount={12} />);
    const paragraph = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'p' && (element?.textContent?.includes('Your stock levels are 94% optimized') ?? false);
    });
    expect(paragraph).toBeInTheDocument();
    expect(paragraph.textContent).toContain('There are 12 items');
  });

  it('should render the action button', () => {
    render(<HealthSummary optimizationScore={94} urgentItemsCount={12} />);
    expect(screen.getByRole('button', { name: /VIEW URGENT ORDERS/i })).toBeInTheDocument();
  });
});
