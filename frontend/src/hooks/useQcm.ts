import { useState } from 'react';

/** Gère l'état du QCM et du mode jury : sélections, validation, catégorie, réponses révélées. */
export function useQcm() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');
  const [selectedChoices, setSelectedChoices] = useState<{ [key: number]: string }>({});
  const [validatedQuestions, setValidatedQuestions] = useState<{ [key: number]: boolean }>({});
  const [revealedAnswers, setRevealedAnswers] = useState<{ [key: string]: boolean }>({});

  const resetSelections = () => {
    setSelectedChoices({});
    setValidatedQuestions({});
    setRevealedAnswers({});
  };

  const handleQcmSelect = (qIdx: number, choice: string) => {
    if (validatedQuestions[qIdx]) return; // Cannot modify after validation
    setSelectedChoices((prev) => ({ ...prev, [qIdx]: choice }));
    setValidatedQuestions((prev) => ({ ...prev, [qIdx]: true }));
  };

  const toggleAnswer = (key: string) => {
    setRevealedAnswers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    resetSelections();
  };

  return {
    selectedCategory,
    selectedChoices,
    validatedQuestions,
    revealedAnswers,
    resetSelections,
    handleQcmSelect,
    toggleAnswer,
    handleCategoryChange,
  };
}
