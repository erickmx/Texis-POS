import { render, screen } from '@testing-library/react';
import { Card } from '../Card';

describe('Card Component', () => {
  it('should render children correctly', () => {
    render(<Card>Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should apply the surface container lowest background', () => {
    render(<Card>Card</Card>);
    expect(screen.getByText('Card')).toHaveClass('bg-surface-container-lowest');
  });

  it('should apply the ambient shadow', () => {
    render(<Card shadow>Shadow Card</Card>);
    expect(screen.getByText('Shadow Card')).toHaveClass('shadow-ambient');
  });

  it('should apply xl roundedness', () => {
    render(<Card>Rounded Card</Card>);
    expect(screen.getByText('Rounded Card')).toHaveClass('rounded-xl');
  });
});
