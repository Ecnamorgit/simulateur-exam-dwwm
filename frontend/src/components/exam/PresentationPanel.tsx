import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Minus, Square, ChevronLeft, ChevronRight } from 'lucide-react';
import { loadPresentation, SlideRenderer } from '../../utils/presentationLoader';
import './PresentationPanel.css';

interface Props {
  file: File | null;
  onClose: () => void;
}

/**
 * Panneau flottant (draggable + resizable) affichant les slides du candidat
 * pendant sa soutenance. Contourne les popup blockers en restant dans le DOM
 * principal.
 */
const PresentationPanel: React.FC<Props> = ({ file, onClose }) => {
  const [slides, setSlides] = useState<SlideRenderer[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState({ x: window.innerWidth - 660, y: 80 });
  const [size, setSize] = useState({ w: 640, h: 500 });

  const bodyRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeState = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);

  // Charger le fichier -----------------------------------------------------
  useEffect(() => {
    if (!file) { setSlides([]); return; }
    let cancelled = false;
    setLoading(true); setError(null); setIdx(0);
    loadPresentation([file])
      .then((arr) => { if (!cancelled) { setSlides(arr); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(String(e?.message || e)); setLoading(false); } });
    return () => { cancelled = true; };
  }, [file]);

  // Rendre la slide courante ----------------------------------------------
  useEffect(() => {
    if (!bodyRef.current) return;
    if (!slides.length) return;
    let cancelled = false;
    const container = bodyRef.current;
    container.innerHTML = '<div class="pres-loading">Chargement…</div>';
    slides[idx]()
      .then((el) => {
        if (cancelled) return;
        container.innerHTML = '';
        container.appendChild(el);
      })
      .catch((e) => {
        if (cancelled) return;
        container.innerHTML = `<div class="pres-error">Erreur: ${String(e?.message || e)}</div>`;
      });
    return () => { cancelled = true; };
  }, [slides, idx]);

  // Navigation clavier -----------------------------------------------------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ne pas capturer si l'utilisateur tape dans un input/textarea.
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') setIdx((i) => Math.max(0, i - 1));
      else if (e.key === 'ArrowRight' || e.key === 'PageDown') setIdx((i) => Math.min(slides.length - 1, i + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [slides.length]);

  // Drag -------------------------------------------------------------------
  const onDragMouseDown = (e: React.MouseEvent) => {
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    e.preventDefault();
  };
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (dragState.current) {
        const { startX, startY, origX, origY } = dragState.current;
        const nx = Math.max(0, Math.min(window.innerWidth - 200, origX + (e.clientX - startX)));
        const ny = Math.max(0, Math.min(window.innerHeight - 60, origY + (e.clientY - startY)));
        setPos({ x: nx, y: ny });
      }
      if (resizeState.current) {
        const { startX, startY, origW, origH } = resizeState.current;
        setSize({
          w: Math.max(320, origW + (e.clientX - startX)),
          h: Math.max(240, origH + (e.clientY - startY)),
        });
      }
    };
    const up = () => { dragState.current = null; resizeState.current = null; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    resizeState.current = { startX: e.clientX, startY: e.clientY, origW: size.w, origH: size.h };
    e.preventDefault(); e.stopPropagation();
  }, [size]);

  if (!file) return null;

  return (
    <div
      className={`pres-panel${minimized ? ' minimized' : ''}`}
      style={{ left: pos.x, top: pos.y, width: size.w, height: minimized ? 'auto' : size.h }}
      role="dialog"
      aria-label="Ma présentation"
    >
      <div className="pres-header" onMouseDown={onDragMouseDown}>
        <span className="pres-header-title">🎤 Ma présentation</span>
        <span className="pres-header-file" title={file.name}>{file.name}</span>
        <span className="pres-header-spacer" />
        <button onClick={() => setMinimized(!minimized)} title={minimized ? 'Agrandir' : 'Réduire'}>
          {minimized ? <Square size={14} /> : <Minus size={14} />}
        </button>
        <button onClick={onClose} title="Fermer"><X size={14} /></button>
      </div>

      <div className="pres-body" ref={bodyRef}>
        {loading && <div className="pres-loading">Chargement du fichier…</div>}
        {error && <div className="pres-error">{error}</div>}
        {!loading && !error && !slides.length && <div className="pres-empty">Aucune slide à afficher.</div>}
      </div>

      <div className="pres-footer">
        <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx <= 0}>
          <ChevronLeft size={14} /> Précédent
        </button>
        <span className="counter">{slides.length ? `${idx + 1} / ${slides.length}` : '–'}</span>
        <button onClick={() => setIdx((i) => Math.min(slides.length - 1, i + 1))} disabled={idx >= slides.length - 1}>
          Suivant <ChevronRight size={14} />
        </button>
        <span className="spacer" />
      </div>

      <div className="pres-resize" onMouseDown={onResizeMouseDown} title="Redimensionner" />
    </div>
  );
};

export default PresentationPanel;
