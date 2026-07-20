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
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setAnalyzing(true);
      setAnalysisResult(null);
      setError('');

      try {
        const data = await uploadDossier(file);
        setAnalysisResult({ score: data.score, criteria: data.criteria });
        if (data.questions && data.questions.length > 0) {
          onQuestionsLoaded(data.questions);
        }
        onReset();
      } catch (err) {
        console.error('Error uploading file:', err);
        // Aucune donnée simulée : on affiche une vraie erreur.
        setAnalysisResult(null);
        setError("L'analyse du dossier a échoué. Vérifiez que le serveur est démarré, puis réessayez.");
      } finally {
        setAnalyzing(false);
      }
    }
  };

  return { selectedFile, setSelectedFile, analyzing, analysisResult, error, handleFileChange };
}
