import React from 'react';
import CategoryFilterBar from './CategoryFilterBar';
import { Question } from '../../types/exam';

interface Props {
  qcmQuestions: Question[];
  questions: Question[];
  selectedChoices: { [key: number]: string };
  validatedQuestions: { [key: number]: boolean };
  handleQcmSelect: (qIdx: number, choice: string) => void;
  correctCount: number;
  answeredCount: number;
  selectedFile: File | null;
  selectedCategory: string;
  availableCategories: string[];
  onCategoryChange: (cat: string) => void;
}

/** Mode QCM d'entraînement technique (sous-onglet de « Simulateur d'Oral & QCM »). */
const QcmTab: React.FC<Props> = ({
  qcmQuestions, questions, selectedChoices, validatedQuestions, handleQcmSelect,
  correctCount, answeredCount, selectedFile, selectedCategory, availableCategories, onCategoryChange,
}) => (
  <div className="card-soft qcm-container">
    <div className="qcm-header-box">
      <div>
        <h3 className="card-title">QCM d'Entraînement Technique</h3>
        <p className="card-subtitle">
          {selectedFile ? `Questions personnalisées pour le projet : ${selectedFile.name}` : `${qcmQuestions.length} questions — ${selectedCategory === 'Toutes' ? 'tous domaines' : selectedCategory}`}
        </p>
      </div>
      {answeredCount > 0 && (
        <div className="qcm-score-badge">
          Score : {correctCount} / {answeredCount}
        </div>
      )}
    </div>

    <CategoryFilterBar
      availableCategories={availableCategories}
      selectedCategory={selectedCategory}
      onCategoryChange={onCategoryChange}
      questions={questions}
      type="qcm"
    />

    <div className="qcm-questions-list">
      {qcmQuestions.map((q, idx) => {
        const isAnswered = validatedQuestions[idx];
        const userAnswer = selectedChoices[idx];

        return (
          <div key={idx} className="qcm-question-card">
            <div className="qcm-question-text">
              <span className="qcm-number">{idx + 1}.</span> {q.question_text}
            </div>

            <div className="qcm-choices-grid">
              {q.choices?.map((choice, cIdx) => {
                let choiceClass = 'qcm-choice-btn';
                if (isAnswered) {
                  if (choice === q.correct_answer) {
                    choiceClass += ' correct';
                  } else if (choice === userAnswer) {
                    choiceClass += ' incorrect';
                  } else {
                    choiceClass += ' disabled';
                  }
                } else if (userAnswer === choice) {
                  choiceClass += ' selected';
                }

                return (
                  <button
                    key={cIdx}
                    className={choiceClass}
                    onClick={() => handleQcmSelect(idx, choice)}
                    disabled={isAnswered}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div className="qcm-explanation-box fade-in">
                <strong>Explication :</strong> {q.explanation}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

export default QcmTab;
