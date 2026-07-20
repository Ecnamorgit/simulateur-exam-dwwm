import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TabNav from './TabNav';

describe('TabNav', () => {
  const tabs = [
    { id: 'a', label: 'Onglet A' },
    { id: 'b', label: 'Onglet B' },
  ];

  it('affiche tous les onglets et marque l’actif', () => {
    render(<TabNav tabs={tabs} activeTab="a" onSelect={() => {}} />);
    expect(screen.getByText('Onglet A')).toHaveClass('active');
    expect(screen.getByText('Onglet B')).not.toHaveClass('active');
  });

  it('appelle onSelect avec l’id au clic', () => {
    const onSelect = vi.fn();
    render(<TabNav tabs={tabs} activeTab="a" onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Onglet B'));
    expect(onSelect).toHaveBeenCalledWith('b');
  });
});
