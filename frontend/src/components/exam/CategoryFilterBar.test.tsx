import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CategoryFilterBar from './CategoryFilterBar';
import { Question } from '../../types/exam';

const questions = [
  { type: 'qcm', category: 'BDD', question_text: 'q1', correct_answer: 'a', explanation: 'e' },
  { type: 'qcm', category: 'BDD', question_text: 'q2', correct_answer: 'a', explanation: 'e' },
  { type: 'qcm', category: 'React', question_text: 'q3', correct_answer: 'a', explanation: 'e' },
] as unknown as Question[];

describe('CategoryFilterBar', () => {
  it('affiche les catégories et le compteur par catégorie', () => {
    render(
      <CategoryFilterBar
        availableCategories={['Toutes', 'BDD', 'React']}
        selectedCategory="Toutes"
        onCategoryChange={() => {}}
        questions={questions}
        type="qcm"
      />
    );
    expect(screen.getByText('BDD')).toBeInTheDocument();
    // 2 questions de catégorie BDD
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('déclenche onCategoryChange au clic sur une catégorie', () => {
    const onChange = vi.fn();
    render(
      <CategoryFilterBar
        availableCategories={['Toutes', 'BDD']}
        selectedCategory="Toutes"
        onCategoryChange={onChange}
        questions={questions}
        type="qcm"
      />
    );
    fireEvent.click(screen.getByText('BDD'));
    expect(onChange).toHaveBeenCalledWith('BDD');
  });
});
