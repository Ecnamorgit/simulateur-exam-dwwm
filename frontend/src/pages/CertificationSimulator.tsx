import React, { useState, useEffect } from 'react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import Separator from '../components/Separator';
import './CertificationSimulator.css';
import { User, HelpCircle, MessageCircle } from 'lucide-react';
import { DWWM_QUESTIONS } from '../data/dwwmQuestions';
import { Question, Task } from '../types/exam';
import { useExamTimer } from '../hooks/useExamTimer';
import { useTts } from '../hooks/useTts';
import { useQcm } from '../hooks/useQcm';
import { useDossier } from '../hooks/useDossier';
import { useInteractiveExam } from '../hooks/useInteractiveExam';
import { useSoutenance } from '../hooks/useSoutenance';
import JuryMode from '../components/exam/JuryMode';
import QcmTab from '../components/exam/QcmTab';
import InteractiveExaminer from '../components/exam/InteractiveExaminer';
import DossierChecker from '../components/exam/DossierChecker';
import KanbanBoard from '../components/exam/KanbanBoard';
import OwaspTab from '../components/exam/OwaspTab';
import TabNav from '../components/exam/TabNav';
import SimulatorHeader from '../components/exam/SimulatorHeader';
import ExamOverview from '../components/exam/ExamOverview';
import { useAuth } from '../hooks/useAuth';
import EntretienTechnique from '../components/exam/EntretienTechnique';
import QuestionnairePro from '../components/exam/QuestionnairePro';
import EntretienFinal from '../components/exam/EntretienFinal';
import ExamBlancBilan from '../components/exam/ExamBlancBilan';
import { ExamPartId } from '../data/examParts';
import { useExamBlanc, nextExamPart } from '../hooks/useExamBlanc';

type TabId = 'epreuve' | 'oral' | 'dossier' | 'agile' | 'owasp' | 'entretien-technique' | 'questionnaire' | 'entretien-final' | 'examen-blanc-bilan';

const CertificationSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('epreuve');
  const [simulationMode, setSimulationMode] = useState<'jury' | 'qcm' | 'interactive'>('jury');
  const [questions, setQuestions] = useState<Question[]>(DWWM_QUESTIONS);
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Maquettage adaptatif Figma (CCP1)', points: 5, status: 'backlog' },
    { id: '2', title: 'Schémas conceptuel et logique (MCD/MLD) (CCP2)', points: 8, status: 'progress' },
    { id: '3', title: 'Intégration du hachage Bcrypt et CORS (CCP2)', points: 5, status: 'done' },
    { id: '4', title: 'Mise en place du workflow CI/CD (DevOps)', points: 3, status: 'backlog' },
  ]);

  const auth = useAuth();
  const { transcript, isListening, hasSupport, startListening, stopListening, clearTranscript } = useSpeechRecognition();

  const timer = useExamTimer(35 * 60);
  const { ttsEnabled, setTtsEnabled, speak } = useTts();
  const qcm = useQcm();
  const dossier = useDossier({ onQuestionsLoaded: setQuestions, onReset: qcm.resetSelections });
  const interactive = useInteractiveExam({ questions, speak, transcript, clearTranscript });
  const soutenance = useSoutenance({
    speak, transcript, clearTranscript, isListening, hasSupport, startListening, stopListening,
    selectedFile: dossier.selectedFile, setQuestions, timer,
  });

  const moveTask = (id: string, direction: 'forward' | 'backward') => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === id) {
          const statusOrder: ('backlog' | 'progress' | 'done')[] = ['backlog', 'progress', 'done'];
          const currentIndex = statusOrder.indexOf(task.status);
          const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
          if (nextIndex >= 0 && nextIndex < statusOrder.length) {
            return { ...task, status: statusOrder[nextIndex] };
          }
        }
        return task;
      })
    );
  };

  const examBlanc = useExamBlanc();

  const startExamPart = (id: ExamPartId) => {
    if (id === 'soutenance') {
      setActiveTab('oral');
      setSimulationMode('jury');
    } else {
      setActiveTab(id);
    }
  };

  // En mode examen blanc : enregistre le score de l'épreuve et passe à la suivante
  // (ou affiche le bilan global après la 4e épreuve).
  const handlePartComplete = (id: ExamPartId, score: number) => {
    if (!examBlanc.active) return;
    examBlanc.record(id, score);
    const next = nextExamPart(id);
    if (next) startExamPart(next);
    else setActiveTab('examen-blanc-bilan');
  };

  const startExamBlanc = () => {
    examBlanc.start();
    setActiveTab('oral');
    setSimulationMode('jury');
  };

  // Complétion de la soutenance (le rapport vit dans le hook soutenance).
  useEffect(() => {
    if (examBlanc.active && soutenance.soutenanceReport && examBlanc.results.soutenance === undefined) {
      handlePartComplete('soutenance', soutenance.soutenanceReport.overall_score);
    }
    /* eslint-disable-next-line */
  }, [soutenance.soutenanceReport]);

  // Derived question sets and scores
  const filteredQuestions = qcm.selectedCategory === 'Toutes'
    ? questions
    : questions.filter((q) => (q as any).category === qcm.selectedCategory);
  const qcmQuestions = filteredQuestions.filter((q) => q.type === 'qcm');
  const juryQuestions = filteredQuestions.filter((q) => q.type === 'jury');
  const availableCategories = ['Toutes', ...Array.from(new Set(questions.map((q) => (q as any).category).filter(Boolean)))];
  const answeredCount = Object.keys(qcm.validatedQuestions).length;
  const correctCount = qcmQuestions.reduce((acc, q, idx) => (qcm.selectedChoices[idx] === q.correct_answer ? acc + 1 : acc), 0);

  return (
    <div className="simulator-page">
      <SimulatorHeader auth={auth} />

      {/* Navigation tabs */}
      <TabNav
        tabs={[
          { id: 'epreuve', label: "Déroulé de l'épreuve" },
          { id: 'oral', label: "Simulateur d'Oral & QCM" },
          { id: 'dossier', label: 'Validation de Dossier' },
          { id: 'agile', label: 'Backlog Agile' },
          { id: 'owasp', label: 'OWASP & Sécurité' },
        ]}
        activeTab={activeTab}
        onSelect={(id) => setActiveTab(id as TabId)}
      />

      <Separator width="300px" margin="32px auto" />

      {/* Déroulé de l'épreuve (page d'accueil) */}
      {activeTab === 'epreuve' && (
        <ExamOverview onStartPart={startExamPart} onStartExamBlanc={startExamBlanc} authKey={auth.email ?? ''} />
      )}

      {/* Oral & QCM tab */}
      {activeTab === 'oral' && (
        <section className="tab-content fade-in">
          <div className="mode-toggle-container">
            <div className="mode-toggle-pill">
              <button className={`mode-toggle-btn ${simulationMode === 'jury' ? 'active' : ''}`} onClick={() => setSimulationMode('jury')}>
                <User size={16} style={{ marginRight: '8px' }} />
                Jury
              </button>
              <button className={`mode-toggle-btn ${simulationMode === 'qcm' ? 'active' : ''}`} onClick={() => setSimulationMode('qcm')}>
                <HelpCircle size={16} style={{ marginRight: '8px' }} />
                QCM
              </button>
              <button className={`mode-toggle-btn ${simulationMode === 'interactive' ? 'active' : ''}`} onClick={() => setSimulationMode('interactive')}>
                <MessageCircle size={16} style={{ marginRight: '8px' }} />
                Entretien IA
              </button>
            </div>
          </div>

          {simulationMode === 'jury' ? (
            <JuryMode
              showSoutenanceModal={soutenance.showSoutenanceModal}
              setShowSoutenanceModal={soutenance.setShowSoutenanceModal}
              soutenanceStarted={soutenance.soutenanceStarted}
              evaluatingSoutenance={soutenance.evaluatingSoutenance}
              soutenanceReport={soutenance.soutenanceReport}
              accumulatedTranscript={soutenance.accumulatedTranscript}
              handleStartSoutenanceClick={soutenance.handleStartSoutenanceClick}
              confirmStartSoutenance={soutenance.confirmStartSoutenance}
              submitSoutenancePresentation={soutenance.submitSoutenancePresentation}
              resetSoutenance={soutenance.resetSoutenance}
              startSoutenanceNow={soutenance.startSoutenanceNow}
              timeLeft={timer.timeLeft}
              timerRunning={timer.timerRunning}
              transcript={transcript}
              isListening={isListening}
              hasSupport={hasSupport}
              startListening={startListening}
              stopListening={stopListening}
              clearTranscript={clearTranscript}
              selectedFile={dossier.selectedFile}
              handleFileChange={dossier.handleFileChange}
              questions={questions}
              juryQuestions={juryQuestions}
              selectedCategory={qcm.selectedCategory}
              availableCategories={availableCategories}
              onCategoryChange={qcm.handleCategoryChange}
              revealedAnswers={qcm.revealedAnswers}
              toggleAnswer={qcm.toggleAnswer}
            />
          ) : simulationMode === 'qcm' ? (
            <QcmTab
              qcmQuestions={qcmQuestions}
              questions={questions}
              selectedChoices={qcm.selectedChoices}
              validatedQuestions={qcm.validatedQuestions}
              handleQcmSelect={qcm.handleQcmSelect}
              correctCount={correctCount}
              answeredCount={answeredCount}
              selectedFile={dossier.selectedFile}
              selectedCategory={qcm.selectedCategory}
              availableCategories={availableCategories}
              onCategoryChange={qcm.handleCategoryChange}
            />
          ) : simulationMode === 'interactive' ? (
            <InteractiveExaminer
              interactiveStarted={interactive.interactiveStarted}
              chatMessages={interactive.chatMessages}
              interactiveQuestionIdx={interactive.interactiveQuestionIdx}
              interactiveScore={interactive.interactiveScore}
              interactiveTotal={interactive.interactiveTotal}
              isEvaluating={interactive.isEvaluating}
              candidateInput={interactive.candidateInput}
              setCandidateInput={interactive.setCandidateInput}
              sessionComplete={interactive.sessionComplete}
              chatEndRef={interactive.chatEndRef}
              maxInteractiveQuestions={interactive.maxInteractiveQuestions}
              interactiveJuryQuestions={interactive.interactiveJuryQuestions}
              startInteractiveSession={interactive.startInteractiveSession}
              submitAnswer={interactive.submitAnswer}
              ttsEnabled={ttsEnabled}
              setTtsEnabled={setTtsEnabled}
              hasSupport={hasSupport}
              isListening={isListening}
              startListening={startListening}
              stopListening={stopListening}
              transcript={transcript}
            />
          ) : null}
        </section>
      )}

      {activeTab === 'dossier' && (
        <DossierChecker
          selectedFile={dossier.selectedFile}
          analyzing={dossier.analyzing}
          analysisResult={dossier.analysisResult}
          handleFileChange={dossier.handleFileChange}
        />
      )}

      {activeTab === 'agile' && <KanbanBoard tasks={tasks} moveTask={moveTask} />}

      {activeTab === 'owasp' && <OwaspTab />}

      {activeTab === 'entretien-technique' && (
        <EntretienTechnique
          questions={questions}
          speak={speak}
          ttsEnabled={ttsEnabled}
          setTtsEnabled={setTtsEnabled}
          transcript={transcript}
          isListening={isListening}
          hasSupport={hasSupport}
          startListening={startListening}
          stopListening={stopListening}
          clearTranscript={clearTranscript}
          onBack={() => setActiveTab('epreuve')}
          onComplete={examBlanc.active ? (s) => handlePartComplete('entretien-technique', s) : undefined}
        />
      )}

      {activeTab === 'questionnaire' && (
        <QuestionnairePro
          onBack={() => setActiveTab('epreuve')}
          onComplete={examBlanc.active ? (s) => handlePartComplete('questionnaire', s) : undefined}
        />
      )}

      {activeTab === 'entretien-final' && (
        <EntretienFinal
          speak={speak}
          onBack={() => setActiveTab('epreuve')}
          onComplete={examBlanc.active ? (s) => handlePartComplete('entretien-final', s) : undefined}
        />
      )}

      {activeTab === 'examen-blanc-bilan' && (
        <ExamBlancBilan
          results={examBlanc.results}
          onBack={() => { examBlanc.cancel(); setActiveTab('epreuve'); }}
        />
      )}

      {activeTab === 'examen-blanc-bilan' && (
        <ExamBlancBilan results={examBlanc.results} onBack={() => setActiveTab('epreuve')} />
      )}
    </div>
  );
};

export default CertificationSimulator;
