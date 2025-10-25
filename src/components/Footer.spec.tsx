import { render, screen } from '@testing-library/react';
import Footer from './Footer';
import { describe, it, expect } from 'vitest';

describe('Footer', () => {
  it('should render the terms and privacy policy links', () => {
    render(<Footer />);

    const termsLink = screen.getByRole('link', { name: /利用規約/i });
    expect(termsLink).toBeInTheDocument();

    const privacyLink = screen.getByRole('link', { name: /プライバシーポリシー/i });
    expect(privacyLink).toBeInTheDocument();
  });
});
