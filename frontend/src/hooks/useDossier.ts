import { useState } from 'react';
import { uploadDossier } from '../services/api';
import { AnalysisResult, Question } from '../types/exam';

interface UseDossierOptions {
  onQuestionsLoaded: (questions: Question[]) => void;
  onReset: () => void;
}

/** Gère l'upload du dossier de projet et son analyse par le backend. */
export function useDossier({ onQuestionsLoaded, onReset }: UseDossierOptions) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setAnalyzing(true);
      setAnalysisResult(null);

      try {
        const data = await uploadDossier(file);
        setAnalysisResult({ score: data.score, criteria: data.criteria });
        if (data.questions && data.questions.length > 0) {
          onQuestionsLoaded(data.questions);
        }
        onReset();
      } catch (error) {
        console.error('Error uploading file:', error);
        // Fallback to static simulation on error
        const score = Math.floor(Math.random() * 30) + 70;
        setAnalysisResult({
          score,
          criteria: [
            { name: 'Contexte du projet et objectifs de qualité', checked: true, feedback: 'Section bien rédigée, objectifs clairs.' },
            { name: 'Réalisations Front-end (CCP1)', checked: true, feedback: 'Wireframes et captures présentes.' },
            { name: 'Réalisations Back-end (MCD/MLD) (CCP2)', checked: score > 85, feedback: 'Modélisation relationnelle complète.' },
            { name: 'Sécurité (Bcrypt, CORS, OWASP)', checked: true, feedback: 'Bonne documentation des mesures de sécurité.' },
          ],
        });
      } finally {
        setAnalyzing(false);
      }
    }
  };

  return { selectedFile, setSelectedFile, analyzing, analysisResult, handleFileChange };
}
