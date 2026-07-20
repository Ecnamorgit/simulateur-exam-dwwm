import React from 'react';
import { Task } from '../../types/exam';

interface Props {
  tasks: Task[];
  moveTask: (id: string, direction: 'forward' | 'backward') => void;
}

/** Tableau Kanban de gestion de projet agile (onglet Backlog Agile). */
const KanbanBoard: React.FC<Props> = ({ tasks, moveTask }) => (
  <section className="tab-content fade-in">
    <div className="card-soft page-intro-card">
      <h3 className="card-title">Gestion de Projet Agile (Kanban)</h3>
      <p className="card-subtitle">
        Simulez la planification de votre projet. Les compétences de conduite de projet et d'agilité sont cruciales pour le CCP2.
      </p>
    </div>

    <div className="kanban-board">
      <div className="kanban-column">
        <h4 className="column-title">Backlog (À faire)</h4>
        <div className="column-list">
          {tasks.filter((t) => t.status === 'backlog').map((task) => (
            <div key={task.id} className="kanban-card">
              <div className="task-title">{task.title}</div>
              <div className="task-footer">
                <span className="task-points">{task.points} pts</span>
                <button className="btn-small" onClick={() => moveTask(task.id, 'forward')}>Commencer →</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="kanban-column">
        <h4 className="column-title">En Cours</h4>
        <div className="column-list">
          {tasks.filter((t) => t.status === 'progress').map((task) => (
            <div key={task.id} className="kanban-card">
              <div className="task-title">{task.title}</div>
              <div className="task-footer">
                <span className="task-points">{task.points} pts</span>
                <div className="task-actions">
                  <button className="btn-small-sec" onClick={() => moveTask(task.id, 'backward')}>← Retour</button>
                  <button className="btn-small" onClick={() => moveTask(task.id, 'forward')}>Valider →</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="kanban-column">
        <h4 className="column-title">Validé</h4>
        <div className="column-list">
          {tasks.filter((t) => t.status === 'done').map((task) => (
            <div key={task.id} className="kanban-card task-done">
              <div className="task-title">{task.title}</div>
              <div className="task-footer">
                <span className="task-points">{task.points} pts</span>
                <button className="btn-small-sec" onClick={() => moveTask(task.id, 'backward')}>← En cours</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default KanbanBoard;
