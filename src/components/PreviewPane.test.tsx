import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PreviewPane } from './PreviewPane';

describe('PreviewPane', () => {
  it('renders GFM content without injecting raw script nodes', () => {
    const { container } = render(
      <PreviewPane markdown={'# Hello\n\n<script>alert(1)</script>\n\n- [x] Safe'} onOpenLink={vi.fn()} />,
    );

    expect(screen.getByRole('heading', { name: 'Hello' })).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('blocks javascript links before the open callback', () => {
    const onOpenLink = vi.fn();
    render(<PreviewPane markdown={'[unsafe](javascript:alert(1))'} onOpenLink={onOpenLink} />);

    const link = screen.getByText('unsafe').closest('a');
    expect(link).not.toBeNull();
    expect(link).not.toHaveAttribute('href', expect.stringContaining('javascript:'));
    if (link) fireEvent.click(link);
    expect(onOpenLink).not.toHaveBeenCalled();
  });

  it('delegates safe links to the platform adapter', () => {
    const onOpenLink = vi.fn();
    render(<PreviewPane markdown={'[docs](https://example.com/docs)'} onOpenLink={onOpenLink} />);

    fireEvent.click(screen.getByRole('link', { name: 'docs' }));
    expect(onOpenLink).toHaveBeenCalledWith('https://example.com/docs');
  });
});
