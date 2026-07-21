/**
 * Chargement du contenu d'une présentation (PDF, PPTX, images) en tableau
 * de fonctions de rendu asynchrones, chacune produisant un HTMLElement à
 * insérer dans un conteneur.
 *
 * Ne dépend d'aucune fenêtre popup — s'exécute dans le document principal
 * pour éviter les blocages par le popup blocker du navigateur.
 */

export type SlideRenderer = () => Promise<HTMLElement>;

const CDN_PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const CDN_PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const CDN_JSZIP = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';

function loadScript(src: string, globalName: string): Promise<any> {
  const w = window as any;
  if (w[globalName]) return Promise.resolve(w[globalName]);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(w[globalName]));
      existing.addEventListener('error', () => reject(new Error('Échec chargement ' + src)));
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.dataset.src = src;
    s.async = true;
    s.onload = () => resolve(w[globalName]);
    s.onerror = () => reject(new Error('Échec chargement ' + src));
    document.head.appendChild(s);
  });
}

async function ensurePdfJs(): Promise<any> {
  const lib = await loadScript(CDN_PDFJS, 'pdfjsLib');
  if (lib.GlobalWorkerOptions && !lib.GlobalWorkerOptions.workerSrc) {
    lib.GlobalWorkerOptions.workerSrc = CDN_PDFJS_WORKER;
  }
  return lib;
}

async function ensureJsZip(): Promise<any> {
  return loadScript(CDN_JSZIP, 'JSZip');
}

async function loadPdf(file: File): Promise<SlideRenderer[]> {
  const pdfjsLib = await ensurePdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const renderers: SlideRenderer[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const pageNum = n;
    renderers.push(async () => {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
      canvas.style.background = 'white';
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      return canvas;
    });
  }
  return renderers;
}

async function loadImages(files: File[]): Promise<SlideRenderer[]> {
  return files.map((f) => async () => {
    return await new Promise<HTMLElement>((resolve, reject) => {
      const img = new Image();
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.background = 'white';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image invalide'));
      img.src = URL.createObjectURL(f);
    });
  });
}

async function loadPptx(file: File): Promise<SlideRenderer[]> {
  const JSZip = await ensureJsZip();
  const buf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);

  const slidePaths = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/)![1], 10);
      const nb = parseInt(b.match(/slide(\d+)/)![1], 10);
      return na - nb;
    });
  if (!slidePaths.length) throw new Error('Aucune slide trouvée dans le fichier PPTX');

  const parsed = await Promise.all(slidePaths.map(async (path) => {
    const numMatch = path.match(/slide(\d+)/);
    const slideNum = numMatch ? numMatch[1] : '0';
    const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
    const slideXml = await zip.file(path)!.async('string');
    const relsXml = zip.file(relsPath) ? await zip.file(relsPath)!.async('string') : '';

    const doc = new DOMParser().parseFromString(slideXml, 'application/xml');
    const textNodes = doc.getElementsByTagName('a:t');
    const texts: string[] = [];
    for (let i = 0; i < textNodes.length; i++) {
      const txt = textNodes[i].textContent || '';
      if (txt.trim()) texts.push(txt);
    }

    const imageRels: Record<string, string> = {};
    if (relsXml) {
      const relsDoc = new DOMParser().parseFromString(relsXml, 'application/xml');
      const rels = relsDoc.getElementsByTagName('Relationship');
      for (let i = 0; i < rels.length; i++) {
        const target = rels[i].getAttribute('Target') || '';
        if (/media\//.test(target)) {
          const id = rels[i].getAttribute('Id')!;
          const clean = target.replace(/^\.\.\//, '');
          imageRels[id] = 'ppt/' + clean;
        }
      }
    }
    const blips = doc.getElementsByTagName('a:blip');
    const imagePaths: string[] = [];
    for (let i = 0; i < blips.length; i++) {
      const rId = blips[i].getAttribute('r:embed');
      if (rId && imageRels[rId]) imagePaths.push(imageRels[rId]);
    }
    return { texts, imagePaths };
  }));

  return parsed.map((slide, idx) => async () => {
    const container = document.createElement('div');
    container.className = 'pres-slide-txt';

    const head = document.createElement('div');
    head.className = 'pres-slide-badge';
    head.textContent = `Slide ${idx + 1}`;
    container.appendChild(head);

    if (slide.texts.length) {
      const h = document.createElement('h2');
      h.textContent = slide.texts[0];
      container.appendChild(h);
      for (let i = 1; i < slide.texts.length; i++) {
        const p = document.createElement('p');
        p.textContent = slide.texts[i];
        container.appendChild(p);
      }
    }

    const imgs = await Promise.all(slide.imagePaths.map(async (p) => {
      const entry = zip.file(p);
      if (!entry) return null;
      const blob = await entry.async('blob');
      const img = document.createElement('img');
      img.src = URL.createObjectURL(blob);
      return img;
    }));
    imgs.forEach((img) => { if (img) container.appendChild(img); });

    if (!slide.texts.length && !imgs.filter(Boolean).length) {
      const em = document.createElement('div');
      em.className = 'pres-slide-empty';
      em.textContent = '(Slide vide ou contenu graphique non supporté)';
      container.appendChild(em);
    }
    return container;
  });
}

/**
 * Extrait tout le texte d'un fichier de présentation (PDF ou PPTX) sous forme
 * d'une chaîne unique — utilisée pour l'envoyer à l'examinateur IA en
 * parallèle du dossier écrit et de la transcription orale.
 * Les images ne sont pas analysées ; seules les zones de texte comptent.
 */
export async function extractPresentationText(file: File): Promise<string> {
  const lower = (file.name || '').toLowerCase();

  if (lower.endsWith('.pdf') || file.type === 'application/pdf') {
    const pdfjsLib = await ensurePdfJs();
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const chunks: string[] = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      const text = content.items.map((it: any) => (typeof it.str === 'string' ? it.str : '')).join(' ');
      chunks.push(`--- Slide ${n} ---\n${text.trim()}`);
    }
    return chunks.join('\n\n');
  }

  if (lower.endsWith('.pptx') || file.type.includes('presentationml')) {
    const JSZip = await ensureJsZip();
    const buf = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buf);
    const slidePaths = Object.keys(zip.files)
      .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => {
        const na = parseInt(a.match(/slide(\d+)/)![1], 10);
        const nb = parseInt(b.match(/slide(\d+)/)![1], 10);
        return na - nb;
      });
    const chunks: string[] = [];
    for (let i = 0; i < slidePaths.length; i++) {
      const xml = await zip.file(slidePaths[i])!.async('string');
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      const nodes = doc.getElementsByTagName('a:t');
      const parts: string[] = [];
      for (let j = 0; j < nodes.length; j++) {
        const t = (nodes[j].textContent || '').trim();
        if (t) parts.push(t);
      }
      chunks.push(`--- Slide ${i + 1} ---\n${parts.join('\n')}`);
    }
    return chunks.join('\n\n');
  }

  // Images ou format non-textuel : rien à extraire.
  return '';
}

/**
 * Retourne un tableau de « renderers » pour chaque slide du fichier fourni.
 * Le type est déduit de l'extension (.pdf, .pptx) ou du MIME (image/*).
 */
export async function loadPresentation(files: File[]): Promise<SlideRenderer[]> {
  if (!files.length) return [];
  const f = files[0];
  const lower = (f.name || '').toLowerCase();

  if (lower.endsWith('.pdf') || f.type === 'application/pdf') {
    return loadPdf(f);
  }
  if (lower.endsWith('.pptx') || f.type.includes('presentationml')) {
    return loadPptx(f);
  }
  if (f.type.startsWith('image/')) {
    return loadImages(files);
  }
  throw new Error('Format non supporté. Utilisez PDF, PPTX ou images.');
}
