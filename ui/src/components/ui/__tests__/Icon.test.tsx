import { render, screen } from '@testing-library/react';
import { Icon } from '../Icon';
import { Package } from 'lucide-react';

describe('Icon Component', () => {
  it('should render the lucide icon correctly', () => {
    const { container } = render(<Icon icon={Package} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should apply the correct size class', () => {
    const { container } = render(<Icon icon={Package} size={24} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('should apply the primary color by default', () => {
    const { container } = render(<Icon icon={Package} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('text-primary');
  });
});
