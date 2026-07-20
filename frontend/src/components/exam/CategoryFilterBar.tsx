import React from 'react';
import { Filter } from 'lucide-react';
import { Question } from '../../types/exam';

interface Props {
  availableCategories: string[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  questions: Question[];
  type: 'qcm' | 'jury';
}

/** Barre de filtres par catégorie, partagée entre le mode QCM et le mode Jury. */
const CategoryFilterBar: React.FC<Props> = ({ availableCategories, selectedCategory, onCategoryChange, questions, type }) => (
  <div className="category-filter-bar">
    <Filter size={14} className="filter-icon" />
    <div className="category-pills-scroll">
      {availableCategories.map((cat) => (
        <button
          key={cat}
          className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
          onClick={() => onCategoryChange(cat)}
        >
          {cat}
          {cat !== 'Toutes' && (
            <span className="category-count">
              {questions.filter((q) => q.type === type && (q as any).category === cat).length}
            </span>
          )}
        </button>
      ))}
    </div>
  </div>
);

export default CategoryFilterBar;
