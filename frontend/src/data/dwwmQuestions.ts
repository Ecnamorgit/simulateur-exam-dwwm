export interface Question {
  type: 'qcm' | 'jury';
  category: string;
  question_text: string;
  choices?: string[] | null;
  correct_answer: string;
  explanation: string;
}

export const QUESTION_CATEGORIES = [
  'Toutes',
  'HTML/CSS/Responsive',
  'JavaScript/DOM',
  'React/Frameworks',
  'UX/UI/Maquettage',
  'Accessibilité',
  'BDD/SQL/Modélisation',
  'API REST/Back-end',
  'Auth/Sécurité',
  'OWASP/Sécurité Web',
  'RGPD/CNIL',
  'DevOps/CI-CD',
  'Agilité/Scrum',
  'Tests',
  'Veille Technologique',
] as const;

export const DWWM_QUESTIONS: Question[] = [

  // ═══════════════════════════════════════════════════════════════
  //  CCP1 — HTML / CSS / RESPONSIVE
  // ═══════════════════════════════════════════════════════════════

  {
    type: 'qcm',
    category: 'HTML/CSS/Responsive',
    question_text: "Quelle balise HTML5 sémantique est la plus appropriée pour le contenu principal d'une page ?",
    choices: ['<div id="main">', '<main>', '<section>', '<article>'],
    correct_answer: '<main>',
    explanation: "La balise <main> représente le contenu principal du <body> d'un document. Il ne doit y avoir qu'un seul <main> visible par page. Elle améliore l'accessibilité et le référencement."
  },
  {
    type: 'qcm',
    category: 'HTML/CSS/Responsive',
    question_text: "Quelle propriété CSS permet de créer une mise en page en grille bidimensionnelle (lignes ET colonnes) ?",
    choices: ['display: flex', 'display: grid', 'display: inline-block', 'display: table'],
    correct_answer: 'display: grid',
    explanation: "CSS Grid est un système de mise en page bidimensionnel (lignes et colonnes simultanément). Flexbox est unidimensionnel (ligne OU colonne). Grid est idéal pour les layouts de page complets."
  },
  {
    type: 'qcm',
    category: 'HTML/CSS/Responsive',
    question_text: "En responsive design, que signifie l'approche « Mobile First » ?",
    choices: [
      "Concevoir d'abord la version desktop puis l'adapter au mobile.",
      "Écrire les styles de base pour mobile, puis utiliser des media queries min-width pour les écrans plus grands.",
      "Utiliser uniquement des unités en pourcentage pour les largeurs.",
      "Développer une application mobile native avant le site web."
    ],
    correct_answer: "Écrire les styles de base pour mobile, puis utiliser des media queries min-width pour les écrans plus grands.",
    explanation: "Le Mobile First consiste à coder d'abord pour les petits écrans (styles par défaut), puis à enrichir progressivement avec @media (min-width: ...) pour les tablettes et desktops. C'est l'approche recommandée par Google."
  },
  {
    type: 'qcm',
    category: 'HTML/CSS/Responsive',
    question_text: "Quelle est la différence principale entre les unités CSS « em » et « rem » ?",
    choices: [
      "Il n'y a aucune différence, ce sont des alias.",
      "em est relatif à la taille de police de l'élément parent, rem est relatif à la taille de police de l'élément racine (html).",
      "em est pour les marges, rem est pour les paddings.",
      "rem est une unité obsolète remplacée par em."
    ],
    correct_answer: "em est relatif à la taille de police de l'élément parent, rem est relatif à la taille de police de l'élément racine (html).",
    explanation: "rem (root em) est toujours relatif au font-size de <html>, ce qui le rend prévisible. em est relatif au parent, ce qui peut créer des effets de cascade imprévus lors de l'imbrication."
  },
  {
    type: 'jury',
    category: 'HTML/CSS/Responsive',
    question_text: "Expliquez la différence entre Flexbox et CSS Grid. Dans quels cas utiliseriez-vous l'un plutôt que l'autre ?",
    correct_answer: "Flexbox est unidimensionnel (ligne OU colonne) — idéal pour les barres de navigation, les alignements simples. CSS Grid est bidimensionnel (lignes ET colonnes) — idéal pour les layouts de page complets, les galeries.",
    explanation: "Flexbox excelle pour distribuer de l'espace dans une seule direction. Grid permet de contrôler les deux axes simultanément. En pratique, on les combine : Grid pour la structure de page, Flexbox pour les composants internes."
  },
  {
    type: 'jury',
    category: 'HTML/CSS/Responsive',
    question_text: "Pourquoi utiliser des balises HTML sémantiques plutôt que des <div> partout ?",
    correct_answer: "Les balises sémantiques (header, nav, main, article, section, footer) donnent du sens au contenu pour les lecteurs d'écran, les moteurs de recherche et la maintenabilité du code.",
    explanation: "Le HTML sémantique améliore l'accessibilité (les lecteurs d'écran naviguent par landmarks), le SEO (Google comprend la structure), et la lisibilité du code pour les développeurs."
  },

  // ═══════════════════════════════════════════════════════════════
  //  CCP1 — JAVASCRIPT / DOM / ASYNCHRONE
  // ═══════════════════════════════════════════════════════════════

  {
    type: 'qcm',
    category: 'JavaScript/DOM',
    question_text: "Quelle est la différence entre « let », « const » et « var » en JavaScript ES6+ ?",
    choices: [
      "Il n'y a aucune différence, ce sont des synonymes.",
      "var a une portée de fonction, let et const ont une portée de bloc. const empêche la réaffectation.",
      "let et const sont des types de données, var est un mot-clé de déclaration.",
      "const crée une variable immuable dont on ne peut modifier aucune propriété."
    ],
    correct_answer: "var a une portée de fonction, let et const ont une portée de bloc. const empêche la réaffectation.",
    explanation: "var est « function-scoped » et souffre du hoisting. let et const sont « block-scoped » (limités aux accolades {}). const empêche la réaffectation de la variable, mais les propriétés d'un objet const restent mutables."
  },
  {
    type: 'qcm',
    category: 'JavaScript/DOM',
    question_text: "Que retourne l'expression typeof null en JavaScript ?",
    choices: ['"null"', '"undefined"', '"object"', '"boolean"'],
    correct_answer: '"object"',
    explanation: "C'est un bug historique de JavaScript depuis sa création en 1995. typeof null retourne 'object' alors que null n'est pas un objet. Ce comportement est conservé pour ne pas casser le web existant."
  },
  {
    type: 'qcm',
    category: 'JavaScript/DOM',
    question_text: "Quel mécanisme JavaScript permet de gérer les opérations asynchrones de manière lisible avec les mots-clés async/await ?",
    choices: [
      'Les callbacks',
      'Les Promises (Promesses)',
      'Les Web Workers',
      'Les événements DOM'
    ],
    correct_answer: 'Les Promises (Promesses)',
    explanation: "async/await est du sucre syntaxique au-dessus des Promises. Une fonction async retourne toujours une Promise. await met en pause l'exécution jusqu'à la résolution de la Promise, rendant le code asynchrone lisible comme du code synchrone."
  },
  {
    type: 'qcm',
    category: 'JavaScript/DOM',
    question_text: "Quelle méthode JavaScript permet de faire une requête HTTP vers une API et retourne une Promise ?",
    choices: ['XMLHttpRequest()', 'fetch()', 'request()', 'http.get()'],
    correct_answer: 'fetch()',
    explanation: "L'API Fetch est l'interface moderne native du navigateur pour effectuer des requêtes HTTP. Elle retourne une Promise qui se résout avec un objet Response. XMLHttpRequest est l'ancienne méthode, plus verbeuse."
  },
  {
    type: 'jury',
    category: 'JavaScript/DOM',
    question_text: "Expliquez ce qu'est le DOM (Document Object Model) et comment JavaScript interagit avec lui.",
    correct_answer: "Le DOM est une représentation arborescente en mémoire du document HTML. JavaScript peut le manipuler via des méthodes comme querySelector, createElement, addEventListener pour modifier dynamiquement le contenu et réagir aux interactions utilisateur.",
    explanation: "Le navigateur parse le HTML et construit un arbre d'objets (le DOM). Chaque élément HTML devient un nœud. JavaScript accède à cet arbre pour lire, ajouter, modifier ou supprimer des éléments, et attacher des écouteurs d'événements."
  },
  {
    type: 'jury',
    category: 'JavaScript/DOM',
    question_text: "Quelle est la différence entre une fonction synchrone et une fonction asynchrone en JavaScript ? Donnez un exemple concret.",
    correct_answer: "Une fonction synchrone bloque l'exécution jusqu'à sa fin. Une fonction asynchrone (async/await, Promises, callbacks) permet de lancer une opération (ex: appel API fetch) sans bloquer le thread principal, le résultat étant traité ultérieurement.",
    explanation: "JavaScript est mono-thread. Les opérations longues (réseau, fichiers) sont déléguées au navigateur/Node.js qui les exécute en arrière-plan. Le callback ou la Promise est invoqué quand l'opération est terminée, via l'Event Loop."
  },

  // ═══════════════════════════════════════════════════════════════
  //  CCP1 — REACT / FRAMEWORKS / SPA
  // ═══════════════════════════════════════════════════════════════

  {
    type: 'qcm',
    category: 'React/Frameworks',
    question_text: "Dans React, quel hook permet de gérer un état local dans un composant fonctionnel ?",
    choices: ['useEffect', 'useState', 'useContext', 'useRef'],
    correct_answer: 'useState',
    explanation: "useState retourne un couple [valeur, setter]. À chaque appel du setter, React re-rend le composant. useEffect gère les effets de bord, useContext accède à un contexte partagé, useRef crée une référence mutable."
  },
  {
    type: 'qcm',
    category: 'React/Frameworks',
    question_text: "Qu'est-ce qu'une Single Page Application (SPA) ?",
    choices: [
      "Un site web composé d'une seule page HTML statique sans JavaScript.",
      "Une application web qui charge une seule page HTML et met à jour dynamiquement le contenu sans rechargement complet du navigateur.",
      "Une page web optimisée pour le référencement naturel.",
      "Un site mobile développé avec une seule feuille de style CSS."
    ],
    correct_answer: "Une application web qui charge une seule page HTML et met à jour dynamiquement le contenu sans rechargement complet du navigateur.",
    explanation: "Une SPA charge un unique fichier HTML au démarrage, puis utilise JavaScript (React, Vue, Angular) pour modifier le DOM dynamiquement. La navigation se fait côté client (React Router), ce qui offre une expérience fluide sans rechargement."
  },
  {
    type: 'qcm',
    category: 'React/Frameworks',
    question_text: "Dans React, à quoi sert le hook useEffect ?",
    choices: [
      "À déclarer une variable d'état.",
      "À exécuter des effets de bord (appels API, abonnements, manipulation DOM) après le rendu du composant.",
      "À créer un nouveau composant enfant.",
      "À définir le style CSS d'un composant."
    ],
    correct_answer: "À exécuter des effets de bord (appels API, abonnements, manipulation DOM) après le rendu du composant.",
    explanation: "useEffect s'exécute après chaque rendu (ou selon ses dépendances). Il remplace les méthodes de cycle de vie des classes (componentDidMount, componentDidUpdate). Il peut retourner une fonction de nettoyage."
  },
  {
    type: 'jury',
    category: 'React/Frameworks',
    question_text: "Expliquez le concept de composant en React. Quelle est la différence entre un composant fonctionnel et un composant de classe ?",
    correct_answer: "Un composant est un bloc d'UI réutilisable qui accepte des props et retourne du JSX. Les composants fonctionnels sont des fonctions simples utilisant les hooks (useState, useEffect). Les composants de classe utilisent this.state et les méthodes de cycle de vie.",
    explanation: "Depuis React 16.8 et les hooks, les composants fonctionnels sont le standard recommandé. Ils sont plus concis, testables, et évitent les pièges du mot-clé 'this'. Les classes restent supportées mais sont considérées comme legacy."
  },
  {
    type: 'jury',
    category: 'React/Frameworks',
    question_text: "Qu'est-ce que le Virtual DOM dans React et pourquoi améliore-t-il les performances ?",
    correct_answer: "Le Virtual DOM est une copie légère en mémoire du DOM réel. React compare l'ancien et le nouveau Virtual DOM (réconciliation / diffing), puis applique uniquement les changements minimaux au DOM réel, évitant des manipulations coûteuses.",
    explanation: "Manipuler le DOM réel est lent car il déclenche des reflows et repaints du navigateur. En calculant les différences sur un arbre JavaScript léger, React minimise les opérations DOM nécessaires (algorithme de réconciliation O(n))."
  },

  // ═══════════════════════════════════════════════════════════════
  //  CCP1 — UX / UI / MAQUETTAGE
  // ═══════════════════════════════════════════════════════════════

  {
    type: 'qcm',
    category: 'UX/UI/Maquettage',
    question_text: "Quelle est la principale différence entre une maquette (mockup) et un prototype interactif ?",
    choices: [
      "La maquette est en noir et blanc, le prototype est en couleur.",
      "La maquette montre le design final de manière statique, le prototype simule les interactions et transitions utilisateur.",
      "Le prototype est obligatoirement codé en HTML.",
      "Il n'y a aucune différence technique."
    ],
    correct_answer: "La maquette montre le design final de manière statique, le prototype simule les interactions et transitions utilisateur.",
    explanation: "La maquette (mockup) représente le design visuel figé. Le prototype ajoute les interactions (clics, transitions, navigation) pour tester l'expérience utilisateur (UX) avant le développement."
  },
  {
    type: 'qcm',
    category: 'UX/UI/Maquettage',
    question_text: "Dans le processus UX, qu'est-ce qu'un wireframe ?",
    choices: [
      "Le code HTML final de la page.",
      "Un schéma simplifié en fil de fer montrant la structure et la hiérarchie du contenu, sans design visuel.",
      "Un document listant les fonctionnalités du projet.",
      "Un prototype haute fidélité avec des animations."
    ],
    correct_answer: "Un schéma simplifié en fil de fer montrant la structure et la hiérarchie du contenu, sans design visuel.",
    explanation: "Le wireframe (zoning) est la première étape du design. Il définit l'architecture de l'information et la disposition des éléments sans couleurs ni typographie finale. Les outils courants sont Figma, Balsamiq, ou même le papier."
  },
  {
    type: 'jury',
    category: 'UX/UI/Maquettage',
    question_text: "Décrivez les étapes de conception d'une interface utilisateur, du wireframe à la maquette finale.",
    correct_answer: "1. Analyse des besoins et personas. 2. Wireframe (structure/zoning). 3. Maquette basse fidélité. 4. Maquette haute fidélité (couleurs, typo, images). 5. Prototype interactif (transitions, tests UX). 6. Tests utilisateurs et itérations.",
    explanation: "Ce processus itératif permet de valider chaque étape avec les parties prenantes avant le développement. Les outils comme Figma permettent de créer wireframes, maquettes et prototypes dans un même environnement collaboratif."
  },
  {
    type: 'jury',
    category: 'UX/UI/Maquettage',
    question_text: "Quelle est la différence entre l'UX (User Experience) et l'UI (User Interface) Design ?",
    correct_answer: "L'UX concerne l'expérience globale de l'utilisateur (facilité d'utilisation, parcours, satisfaction). L'UI concerne l'aspect visuel de l'interface (couleurs, typographie, icônes, mise en page).",
    explanation: "L'UX est stratégique (recherche utilisateur, architecture de l'information, parcours), l'UI est esthétique (design system, chartes graphiques). Un bon produit nécessite les deux : une interface belle (UI) ET facile à utiliser (UX)."
  },

  // ═══════════════════════════════════════════════════════════════
  //  CCP1 — ACCESSIBILITÉ (RGAA / WCAG)
  // ═══════════════════════════════════════════════════════════════

  {
    type: 'qcm',
    category: 'Accessibilité',
    question_text: "Quel est le ratio de contraste minimal exigé par le RGAA pour un texte de taille normale ?",
    choices: ['Ratio minimal de 3:1', 'Ratio minimal de 4.5:1', 'Ratio minimal de 7:1', 'Il n\'y a pas de ratio exigé'],
    correct_answer: 'Ratio minimal de 4.5:1',
    explanation: "Pour le texte normal (< 18pt ou < 14pt bold), le RGAA/WCAG niveau AA exige un contraste minimal de 4.5:1. Pour le texte large (≥ 18pt), le ratio minimal est de 3:1. Le niveau AAA exige 7:1."
  },
  {
    type: 'qcm',
    category: 'Accessibilité',
    question_text: "À quoi sert l'attribut « alt » sur une balise <img> ?",
    choices: [
      "À définir la taille de l'image.",
      "À fournir un texte alternatif décrivant l'image, lu par les lecteurs d'écran et affiché si l'image ne charge pas.",
      "À définir le titre de l'image au survol.",
      "À optimiser le poids de l'image."
    ],
    correct_answer: "À fournir un texte alternatif décrivant l'image, lu par les lecteurs d'écran et affiché si l'image ne charge pas.",
    explanation: "L'attribut alt est obligatoire en HTML valide. Il rend les images accessibles aux personnes malvoyantes (via lecteurs d'écran) et aux robots des moteurs de recherche. Pour une image décorative, on utilise alt=\"\" (vide mais présent)."
  },
  {
    type: 'qcm',
    category: 'Accessibilité',
    question_text: "Quel référentiel français d'accessibilité numérique est obligatoire pour les sites publics ?",
    choices: [
      'WCAG uniquement',
      'Le RGAA (Référentiel Général d\'Amélioration de l\'Accessibilité)',
      'Les normes ISO 9001',
      'Le RGPD'
    ],
    correct_answer: "Le RGAA (Référentiel Général d'Amélioration de l'Accessibilité)",
    explanation: "Le RGAA est le référentiel français basé sur les WCAG 2.1 du W3C. Il est obligatoire pour les services publics en France depuis la loi de 2005. Il définit 106 critères de test répartis en 13 thématiques."
  },
  {
    type: 'jury',
    category: 'Accessibilité',
    question_text: "Comment avez-vous pris en compte l'accessibilité dans votre projet ? Citez au moins 3 bonnes pratiques.",
    correct_answer: "1. Utilisation de balises HTML sémantiques (nav, main, article). 2. Attributs alt sur toutes les images. 3. Contraste suffisant (4.5:1 minimum). 4. Navigation clavier fonctionnelle (tabindex, focus). 5. Attributs ARIA quand nécessaire (aria-label, role).",
    explanation: "L'accessibilité doit être intégrée dès la conception (« Accessibility by Design »). Les audits se font avec des outils comme Lighthouse, axe, WAVE. Le RGAA impose de publier une déclaration d'accessibilité sur les sites publics."
  },

  // ═══════════════════════════════════════════════════════════════
  //  CCP2 — BDD / SQL / MODÉLISATION (MCD/MLD)
  // ═══════════════════════════════════════════════════════════════

  {
    type: 'qcm',
    category: 'BDD/SQL/Modélisation',
    question_text: "Qu'est-ce qu'un MCD (Modèle Conceptuel de Données) ?",
    choices: [
      "Le schéma physique des tables SQL avec les types de données.",
      "Un diagramme représentant les entités, leurs attributs et les associations métier, indépendamment de toute technologie de BDD.",
      "Un fichier de migration généré par un ORM.",
      "La documentation technique de l'API REST."
    ],
    correct_answer: "Un diagramme représentant les entités, leurs attributs et les associations métier, indépendamment de toute technologie de BDD.",
    explanation: "Le MCD (méthode MERISE) représente les concepts métier : entités (Client, Commande), attributs (nom, date) et associations (un Client passe des Commandes). Il est ensuite traduit en MLD (tables, clés) puis en MPD (SQL concret)."
  },
  {
    type: 'qcm',
    category: 'BDD/SQL/Modélisation',
    question_text: "Quelle est la différence entre une clé primaire et une clé étrangère en SQL ?",
    choices: [
      "La clé primaire est toujours un entier auto-incrémenté, la clé étrangère est toujours un UUID.",
      "La clé primaire identifie de manière unique chaque enregistrement d'une table. La clé étrangère fait référence à la clé primaire d'une autre table pour créer une relation.",
      "La clé primaire est optionnelle, la clé étrangère est obligatoire.",
      "Il n'y a pas de différence, ce sont des synonymes."
    ],
    correct_answer: "La clé primaire identifie de manière unique chaque enregistrement d'une table. La clé étrangère fait référence à la clé primaire d'une autre table pour créer une relation.",
    explanation: "La clé primaire (PRIMARY KEY) garantit l'unicité et la non-nullité. La clé étrangère (FOREIGN KEY) assure l'intégrité référentielle entre deux tables : on ne peut pas insérer une valeur qui n'existe pas dans la table référencée."
  },
  {
    type: 'qcm',
    category: 'BDD/SQL/Modélisation',
    question_text: "Quelle est la principale différence entre une base de données SQL et NoSQL ?",
    choices: [
      "SQL est gratuit, NoSQL est payant.",
      "SQL utilise des tables structurées avec un schéma fixe et des relations. NoSQL offre des schémas flexibles (documents JSON, clé-valeur, graphes).",
      "NoSQL ne peut pas stocker de données textuelles.",
      "SQL est plus récent que NoSQL."
    ],
    correct_answer: "SQL utilise des tables structurées avec un schéma fixe et des relations. NoSQL offre des schémas flexibles (documents JSON, clé-valeur, graphes).",
    explanation: "Les BDD SQL (PostgreSQL, MySQL) maintiennent l'intégrité par schéma strict et clés étrangères. Les BDD NoSQL (MongoDB, Redis) privilégient la flexibilité et la scalabilité horizontale, au prix de moins de garanties ACID."
  },
  {
    type: 'qcm',
    category: 'BDD/SQL/Modélisation',
    question_text: "Qu'est-ce qu'un ORM (Object-Relational Mapping) ?",
    choices: [
      "Un protocole de communication réseau entre serveurs.",
      "Un outil qui fait correspondre les tables SQL à des classes/objets du langage de programmation, permettant de manipuler la BDD sans écrire de SQL brut.",
      "Un format de fichier pour exporter des bases de données.",
      "Un système de gestion de fichiers."
    ],
    correct_answer: "Un outil qui fait correspondre les tables SQL à des classes/objets du langage de programmation, permettant de manipuler la BDD sans écrire de SQL brut.",
    explanation: "Les ORM (SQLAlchemy pour Python, Prisma/Sequelize pour JS, Eloquent pour PHP) traduisent les opérations objet en requêtes SQL. Avantages : productivité, protection contre l'injection SQL. Inconvénient : requêtes parfois moins optimisées."
  },
  {
    type: 'jury',
    category: 'BDD/SQL/Modélisation',
    question_text: "Décrivez la démarche de modélisation de votre base de données, du MCD au MPD.",
    correct_answer: "1. Identification des entités métier et de leurs attributs. 2. Création du MCD (MERISE) avec les associations et cardinalités. 3. Transformation en MLD (tables, clés primaires et étrangères). 4. Implémentation en MPD (CREATE TABLE SQL) ou via les migrations d'un ORM.",
    explanation: "Cette démarche en 3 niveaux permet de passer du besoin métier (MCD) à la structure technique (MLD) puis au code SQL concret (MPD). Les cardinalités (1,n — 0,1 — n,m) déterminent la structure des relations."
  },
  {
    type: 'jury',
    category: 'BDD/SQL/Modélisation',
    question_text: "Qu'est-ce que la normalisation d'une base de données ? Pourquoi est-elle importante ?",
    correct_answer: "La normalisation organise les données pour éliminer la redondance et les anomalies de mise à jour. Les formes normales (1NF, 2NF, 3NF) décomposent les tables pour que chaque donnée ne soit stockée qu'une seule fois.",
    explanation: "Sans normalisation, une mise à jour peut créer des incohérences (ex: le nom d'un client modifié dans une commande mais pas dans une autre). En pratique, on vise la 3NF (chaque attribut non-clé dépend uniquement de la clé primaire)."
  },

  // ═══════════════════════════════════════════════════════════════
  //  CCP2 — API REST / BACK-END
  // ═══════════════════════════════════════════════════════════════

  {
    type: 'qcm',
    category: 'API REST/Back-end',
    question_text: "Quel verbe HTTP est conventionnellement utilisé pour créer une nouvelle ressource dans une API REST ?",
    choices: ['GET', 'POST', 'PUT', 'DELETE'],
    correct_answer: 'POST',
    explanation: "Dans la convention REST : GET = lire, POST = créer, PUT/PATCH = mettre à jour (totalement/partiellement), DELETE = supprimer. POST est non-idempotent : deux appels identiques créent deux ressources distinctes."
  },
  {
    type: 'qcm',
    category: 'API REST/Back-end',
    question_text: "Quel code de statut HTTP indique qu'une ressource a été créée avec succès ?",
    choices: ['200 OK', '201 Created', '204 No Content', '301 Moved Permanently'],
    correct_answer: '201 Created',
    explanation: "200 = succès générique, 201 = création réussie (typiquement après un POST), 204 = succès sans contenu (après un DELETE), 400 = erreur client, 401 = non authentifié, 403 = interdit, 404 = non trouvé, 500 = erreur serveur."
  },
  {
    type: 'qcm',
    category: 'API REST/Back-end',
    question_text: "Que signifie l'acronyme REST dans le contexte des API web ?",
    choices: [
      'Remote Execution of Server Tasks',
      'Representational State Transfer',
      'Rapid Enterprise Service Technology',
      'Resource Endpoint Structured Transfer'
    ],
    correct_answer: 'Representational State Transfer',
    explanation: "REST est un style d'architecture (pas un protocole) défini par Roy Fielding en 2000. Ses principes : sans état (stateless), interface uniforme (URIs, verbes HTTP), représentation des ressources (JSON/XML), et hypermédia."
  },
  {
    type: 'jury',
    category: 'API REST/Back-end',
    question_text: "Comment avez-vous structuré votre API REST ? Quelles conventions de nommage avez-vous suivies ?",
    correct_answer: "Routes en kebab-case au pluriel (/api/users, /api/pizzas/:id). Utilisation des verbes HTTP (GET, POST, PUT, DELETE). Codes de retour HTTP appropriés (200, 201, 404, 500). Réponses en JSON avec pagination pour les listes.",
    explanation: "Les bonnes pratiques REST incluent : des noms de ressources (pas de verbes dans l'URL), le versionnage (/api/v1/), la pagination (?page=1&limit=20), et la documentation (Swagger/OpenAPI)."
  },
  {
    type: 'jury',
    category: 'API REST/Back-end',
    question_text: "Expliquez comment vous gérez la politique CORS (Cross-Origin Resource Sharing) sur votre application.",
    correct_answer: "En configurant les en-têtes CORS en backend (comme avec CORSMiddleware dans FastAPI) pour autoriser uniquement l'origine de mon frontend de confiance (ex: http://localhost:3000).",
    explanation: "La Same-Origin Policy (SOP) bloque par défaut les requêtes cross-origin. Le CORS permet au serveur de déclarer quels domaines, méthodes et en-têtes sont autorisés via des en-têtes HTTP (Access-Control-Allow-Origin, etc.)."
  },
  {
    type: 'jury',
    category: 'API REST/Back-end',
    question_text: "Quelle est la différence entre un middleware et un contrôleur (route handler) dans un framework backend ?",
    correct_answer: "Un middleware intercepte les requêtes avant/après le contrôleur pour des traitements transversaux (authentification, logs, CORS). Un contrôleur (route handler) contient la logique métier spécifique à un endpoint.",
    explanation: "Le pipeline d'une requête : Client → Middleware(s) (auth, CORS, logs) → Route Handler (logique métier) → Réponse. Les middlewares sont chaînés (pattern « chain of responsibility ») et réutilisables sur plusieurs routes."
  },

  // ═══════════════════════════════════════════════════════════════
  //  CCP2 — AUTH / JWT / SESSIONS
  // ═══════════════════════════════════════════════════════════════

  {
    type: 'qcm',
    category: 'Auth/Sécurité',
    question_text: "Pourquoi utilise-t-on un facteur de coût (work factor) dans l'algorithme de hachage Bcrypt ?",
    choices: [
      "Pour augmenter la taille de la clé en base de données.",
      "Pour ralentir le calcul du hash et rendre les attaques par force brute infaisables à grande échelle.",
      "Pour compresser le mot de passe avant de l'enregistrer.",
      "Pour générer des sels de hachage statiques."
    ],
    correct_answer: "Pour ralentir le calcul du hash et rendre les attaques par force brute infaisables à grande échelle.",
    explanation: "Bcrypt double le nombre de cycles (2^coût) à chaque incrément du facteur. Cela rend le calcul transparent pour un utilisateur unique (~100ms) mais prohibitif pour un attaquant tentant des milliards de combinaisons."
  },
  {
    type: 'qcm',
    category: 'Auth/Sécurité',
    question_text: "Qu'est-ce qu'un JWT (JSON Web Token) et à quoi sert-il ?",
    choices: [
      "Un format de base de données NoSQL.",
      "Un jeton d'authentification composé de 3 parties (header.payload.signature) encodées en Base64, permettant l'authentification stateless.",
      "Un protocole de chiffrement pour les emails.",
      "Un fichier de configuration pour les serveurs web."
    ],
    correct_answer: "Un jeton d'authentification composé de 3 parties (header.payload.signature) encodées en Base64, permettant l'authentification stateless.",
    explanation: "Le JWT contient : 1) Header (algorithme), 2) Payload (données utilisateur, expiration), 3) Signature (vérification d'intégrité). Le serveur n'a pas besoin de stocker de session : il vérifie la signature avec sa clé secrète."
  },
  {
    type: 'qcm',
    category: 'Auth/Sécurité',
    question_text: "Quelle est la différence entre l'authentification et l'autorisation ?",
    choices: [
      "Ce sont des synonymes.",
      "L'authentification vérifie l'identité de l'utilisateur (qui êtes-vous ?). L'autorisation vérifie ses permissions (avez-vous le droit d'accéder à cette ressource ?).",
      "L'authentification est côté client, l'autorisation est côté serveur.",
      "L'authentification utilise des cookies, l'autorisation utilise des tokens."
    ],
    correct_answer: "L'authentification vérifie l'identité de l'utilisateur (qui êtes-vous ?). L'autorisation vérifie ses permissions (avez-vous le droit d'accéder à cette ressource ?).",
    explanation: "Authentification (AuthN) : login + mot de passe, OAuth, biométrie. Autorisation (AuthZ) : vérification des rôles et permissions (admin, utilisateur, invité). Les deux sont nécessaires mais distincts : on s'authentifie d'abord, puis on vérifie les droits."
  },
  {
    type: 'jury',
    category: 'Auth/Sécurité',
    question_text: "Comment avez-vous sécurisé les mots de passe utilisateur dans votre application ?",
    correct_answer: "Les mots de passe ne sont jamais stockés en clair. Ils sont hachés avec Bcrypt (avec salt aléatoire et work factor ≥ 10) avant d'être enregistrés en base. À la connexion, on compare le hash du mot de passe saisi avec le hash stocké.",
    explanation: "Le hachage est irréversible (contrairement au chiffrement). Le salt empêche les attaques par tables arc-en-ciel. Bcrypt est préféré à MD5/SHA (trop rapides). Argon2 est l'alternative moderne recommandée par l'OWASP."
  },

  // ═══════════════════════════════════════════════════════════════
  //  SÉCURITÉ — OWASP / CORS / XSS
  // ═══════════════════════════════════════════════════════════════

  {
    type: 'qcm',
    category: 'OWASP/Sécurité Web',
    question_text: "Qu'est-ce qu'une faille XSS (Cross-Site Scripting) ?",
    choices: [
      "Une attaque qui modifie les fichiers CSS d'un site.",
      "Une injection de code JavaScript malveillant dans une page web, exécuté dans le navigateur des autres utilisateurs.",
      "Une attaque de déni de service (DDoS).",
      "Un virus qui infecte le serveur web."
    ],
    correct_answer: "Une injection de code JavaScript malveillant dans une page web, exécuté dans le navigateur des autres utilisateurs.",
    explanation: "Le XSS exploite l'absence de nettoyage des entrées utilisateur. Types : Stored (persistant en BDD), Reflected (via URL), DOM-based (manipulation DOM). Prévention : échapper les sorties, Content Security Policy (CSP), sanitization des inputs."
  },
  {
    type: 'qcm',
    category: 'OWASP/Sécurité Web',
    question_text: "Qu'est-ce qu'une faille d'injection SQL et comment s'en prémunir ?",
    choices: [
      "Un bug CSS qui déforme la mise en page. Correction : utiliser un reset CSS.",
      "L'insertion de code SQL malveillant via les champs de saisie utilisateur. Prévention : requêtes paramétrées (prepared statements) ou ORM.",
      "Un problème de performance de la base de données. Correction : ajouter des index.",
      "Une erreur de syntaxe dans le code SQL. Correction : utiliser un linter SQL."
    ],
    correct_answer: "L'insertion de code SQL malveillant via les champs de saisie utilisateur. Prévention : requêtes paramétrées (prepared statements) ou ORM.",
    explanation: "Exemple : un champ login avec ' OR '1'='1' peut court-circuiter l'authentification si la requête concatène les entrées. Les requêtes paramétrées séparent la structure SQL des données, rendant l'injection impossible."
  },
  {
    type: 'qcm',
    category: 'OWASP/Sécurité Web',
    question_text: "Qu'est-ce qu'une attaque CSRF (Cross-Site Request Forgery) ?",
    choices: [
      "Une attaque qui vole les cookies de session.",
      "Une attaque qui force le navigateur d'un utilisateur authentifié à envoyer une requête non souhaitée vers un site de confiance.",
      "Une attaque par déni de service.",
      "Une attaque qui intercepte les communications HTTPS."
    ],
    correct_answer: "Une attaque qui force le navigateur d'un utilisateur authentifié à envoyer une requête non souhaitée vers un site de confiance.",
    explanation: "Le CSRF exploite la confiance du serveur envers le navigateur de l'utilisateur (cookies envoyés automatiquement). Prévention : token CSRF dans les formulaires, attribut SameSite sur les cookies, vérification de l'en-tête Origin."
  },
  {
    type: 'qcm',
    category: 'OWASP/Sécurité Web',
    question_text: "Quelle est la meilleure pratique pour stocker des données sensibles (clés API, mots de passe BDD) dans une application ?",
    choices: [
      "Les coder en dur dans le code source.",
      "Les stocker dans des variables d'environnement ou un fichier .env (exclu du contrôle de version via .gitignore).",
      "Les mettre dans un commentaire HTML.",
      "Les chiffrer en Base64 dans le code."
    ],
    correct_answer: "Les stocker dans des variables d'environnement ou un fichier .env (exclu du contrôle de version via .gitignore).",
    explanation: "Les secrets ne doivent jamais être versionnés (pas de clé API dans Git !). Utiliser un fichier .env + la bibliothèque dotenv, ou des secrets managers (AWS Secrets Manager, Vault). Le .env doit figurer dans le .gitignore."
  },
  {
    type: 'jury',
    category: 'OWASP/Sécurité Web',
    question_text: "Citez les 3 principales failles de sécurité web de l'OWASP Top 10 et leurs mesures de prévention.",
    correct_answer: "A01 Contrôle d'accès défaillant (vérifier les permissions côté serveur). A02 Défaillances cryptographiques (Bcrypt, HTTPS, chiffrement au repos). A03 Injections SQL/XSS (requêtes paramétrées, échapper les sorties).",
    explanation: "L'OWASP Top 10 est le référentiel de sécurité web le plus reconnu. Le jury attend une connaissance des failles majeures ET de leurs contre-mesures concrètes appliquées dans votre projet."
  },
  {
    type: 'jury',
    category: 'OWASP/Sécurité Web',
    question_text: "Qu'est-ce que le principe HTTPS et pourquoi est-il indispensable en production ?",
    correct_answer: "HTTPS chiffre les communications entre le client et le serveur via TLS. Il protège les données en transit (identifiants, données personnelles) contre les attaques man-in-the-middle et le sniffing réseau.",
    explanation: "HTTPS utilise un certificat SSL/TLS délivré par une autorité de certification (Let's Encrypt pour le gratuit). Sans HTTPS, les données circulent en clair sur le réseau. Chrome affiche « Non sécurisé » pour les sites HTTP."
  },

  // ═══════════════════════════════════════════════════════════════
  //  RGPD / CNIL
  // ═══════════════════════════════════════════════════════════════

  {
    type: 'qcm',
    category: 'RGPD/CNIL',
    question_text: "Que signifie l'acronyme RGPD ?",
    choices: [
      'Référentiel Général de Protection Digitale',
      'Règlement Général sur la Protection des Données',
      'Réseau Garanti de Protection des Documents',
      'Registre Général des Procédures Dématérialisées'
    ],
    correct_answer: 'Règlement Général sur la Protection des Données',
    explanation: "Le RGPD (GDPR en anglais) est le règlement européen entré en vigueur le 25 mai 2018. Il encadre le traitement des données personnelles des résidents de l'UE. La CNIL est l'autorité française de contrôle."
  },
  {
    type: 'qcm',
    category: 'RGPD/CNIL',
    question_text: "Qu'est-ce qu'une DCP (Donnée à Caractère Personnel) au sens du RGPD ?",
    choices: [
      "Uniquement le nom et le prénom d'une personne.",
      "Toute information se rapportant à une personne physique identifiée ou identifiable (nom, email, adresse IP, photo, géolocalisation, etc.).",
      "Les données stockées sur un serveur en France.",
      "Les fichiers de configuration d'un site web."
    ],
    correct_answer: "Toute information se rapportant à une personne physique identifiée ou identifiable (nom, email, adresse IP, photo, géolocalisation, etc.).",
    explanation: "La définition est très large : nom, email, téléphone, adresse IP, cookie, photo, empreinte digitale, données de géolocalisation. Les données « sensibles » (santé, opinions politiques, orientation sexuelle) ont un régime encore plus strict."
  },
  {
    type: 'jury',
    category: 'RGPD/CNIL',
    question_text: "Comment avez-vous pris en compte le RGPD dans votre projet ? Quels principes avez-vous appliqués ?",
    correct_answer: "Minimisation des données (ne collecter que le strict nécessaire), consentement explicite de l'utilisateur, droit d'accès/modification/suppression des données, chiffrement des données sensibles, mentions légales et politique de confidentialité.",
    explanation: "Les 7 principes du RGPD : licéité, limitation des finalités, minimisation, exactitude, limitation de conservation, intégrité/confidentialité, responsabilité. L'amende peut aller jusqu'à 4% du CA mondial ou 20M€."
  },
  {
    type: 'jury',
    category: 'RGPD/CNIL',
    question_text: "Qu'est-ce que le principe de Privacy by Design et comment l'avez-vous appliqué ?",
    correct_answer: "Le Privacy by Design impose d'intégrer la protection des données dès la phase de conception du projet, et non après coup. Exemples : chiffrement par défaut, collecte minimale, anonymisation, durée de conservation limitée.",
    explanation: "Ce principe est inscrit dans l'article 25 du RGPD. Il implique de réfléchir à la protection des données dès le MCD/wireframe : quels champs sont réellement nécessaires ? Combien de temps conserver les données ? Qui y a accès ?"
  },

  // ═══════════════════════════════════════════════════════════════
  //  DEVOPS / CI-CD / GIT / DOCKER
  // ═══════════════════════════════════════════════════════════════

  {
    type: 'qcm',
    category: 'DevOps/CI-CD',
    question_text: "Quelle commande Git permet de créer une nouvelle branche et de s'y positionner immédiatement ?",
    choices: ['git branch new-branch', 'git checkout -b new-branch', 'git merge new-branch', 'git push new-branch'],
    correct_answer: 'git checkout -b new-branch',
    explanation: "git checkout -b est un raccourci pour git branch + git checkout. Depuis Git 2.23, on peut aussi utiliser git switch -c new-branch. Le branching est fondamental pour travailler en équipe sans conflits."
  },
  {
    type: 'qcm',
    category: 'DevOps/CI-CD',
    question_text: "Qu'est-ce qu'un pipeline CI/CD ?",
    choices: [
      "Un câble réseau reliant les serveurs de production.",
      "Une chaîne automatisée d'étapes (build, test, déploiement) déclenchée à chaque push sur le dépôt Git.",
      "Un outil de gestion de base de données.",
      "Un protocole de communication entre microservices."
    ],
    correct_answer: "Une chaîne automatisée d'étapes (build, test, déploiement) déclenchée à chaque push sur le dépôt Git.",
    explanation: "CI (Continuous Integration) : chaque commit déclenche build + tests automatiques. CD (Continuous Deployment/Delivery) : le code validé est automatiquement déployé. Outils : GitHub Actions, GitLab CI, Jenkins."
  },
  {
    type: 'qcm',
    category: 'DevOps/CI-CD',
    question_text: "À quoi sert un Dockerfile ?",
    choices: [
      "À documenter le code source du projet.",
      "À définir les instructions pour construire une image Docker (système de base, dépendances, commandes de démarrage).",
      "À configurer le pare-feu du serveur.",
      "À créer une sauvegarde de la base de données."
    ],
    correct_answer: "À définir les instructions pour construire une image Docker (système de base, dépendances, commandes de démarrage).",
    explanation: "Le Dockerfile est un fichier texte contenant les instructions séquentielles : FROM (image de base), COPY (fichiers), RUN (commandes), EXPOSE (port), CMD (commande de démarrage). Docker build crée l'image, Docker run l'exécute dans un conteneur."
  },
  {
    type: 'jury',
    category: 'DevOps/CI-CD',
    question_text: "Décrivez votre workflow Git. Comment avez-vous organisé vos branches ?",
    correct_answer: "Utilisation de Git Flow ou GitHub Flow : branche main (production stable), branches feature/* pour chaque fonctionnalité, merge via Pull Request après revue de code. Commits atomiques avec messages conventionnels (feat:, fix:, docs:).",
    explanation: "Un bon workflow Git évite les conflits et assure la traçabilité. Les conventions de commits (Conventional Commits) facilitent la génération de changelogs. Les Pull/Merge Requests permettent la revue de code par les pairs."
  },
  {
    type: 'jury',
    category: 'DevOps/CI-CD',
    question_text: "Qu'est-ce que Docker et pourquoi l'utiliser pour le déploiement ?",
    correct_answer: "Docker conteneurise l'application avec toutes ses dépendances dans une image portable. L'avantage : « ça marche sur ma machine » → ça marche partout (dev, staging, production). L'isolation garantit que chaque conteneur est indépendant.",
    explanation: "Docker résout le problème des environnements incohérents. Docker Compose orchestre plusieurs conteneurs (app + BDD + cache). En production, Kubernetes gère l'orchestration à grande échelle (scaling, load balancing)."
  },

  // ═══════════════════════════════════════════════════════════════
  //  AGILITÉ / SCRUM / KANBAN
  // ═══════════════════════════════════════════════════════════════

  {
    type: 'qcm',
    category: 'Agilité/Scrum',
    question_text: "Dans la méthodologie Scrum, quelle cérémonie permet à l'équipe d'analyser ce qui a bien fonctionné et ce qui doit être amélioré ?",
    choices: ['Le Sprint Planning', 'Le Daily Stand-up', 'La Sprint Review', 'La Sprint Retrospective'],
    correct_answer: 'La Sprint Retrospective',
    explanation: "Sprint Planning = planifier le sprint. Daily Stand-up = point quotidien (15 min). Sprint Review = démo du livrable au Product Owner. Sprint Retrospective = analyse du processus et axes d'amélioration pour le prochain sprint."
  },
  {
    type: 'qcm',
    category: 'Agilité/Scrum',
    question_text: "Qu'est-ce qu'une User Story dans la gestion de projet agile ?",
    choices: [
      "Le CV du développeur.",
      "Une description fonctionnelle rédigée du point de vue de l'utilisateur final : « En tant que [rôle], je veux [action] afin de [bénéfice] ».",
      "Un rapport de bug dans l'application.",
      "Le cahier des charges complet du projet."
    ],
    correct_answer: "Une description fonctionnelle rédigée du point de vue de l'utilisateur final : « En tant que [rôle], je veux [action] afin de [bénéfice] ».",
    explanation: "La User Story est l'unité de travail en agile. Elle est accompagnée de critères d'acceptation (Definition of Done). Elle est estimée en story points (Fibonacci : 1, 2, 3, 5, 8, 13) lors du Sprint Planning."
  },
  {
    type: 'qcm',
    category: 'Agilité/Scrum',
    question_text: "Quels sont les 3 rôles fondamentaux dans le framework Scrum ?",
    choices: [
      'Chef de projet, développeur, testeur',
      'Product Owner, Scrum Master, équipe de développement',
      'Designer, développeur, commercial',
      'Directeur technique, lead developer, stagiaire'
    ],
    correct_answer: 'Product Owner, Scrum Master, équipe de développement',
    explanation: "Le Product Owner définit les priorités métier (backlog). Le Scrum Master facilite le processus et élimine les obstacles. L'équipe de développement (3-9 personnes) est auto-organisée et pluridisciplinaire."
  },
  {
    type: 'jury',
    category: 'Agilité/Scrum',
    question_text: "Comment avez-vous appliqué une démarche agile dans votre projet ? Quel outil de gestion de projet avez-vous utilisé ?",
    correct_answer: "Organisation en sprints de 2 semaines, backlog priorisé avec user stories, daily stand-ups. Utilisation d'un tableau Kanban (Trello/Jira/GitHub Projects) avec les colonnes : À faire, En cours, En test, Validé.",
    explanation: "Le jury vérifie que vous comprenez l'agilité et savez l'appliquer concrètement : découpage en itérations, priorisation, feedback continu. Même en solo, on peut appliquer un Kanban personnel et itérer sur les fonctionnalités."
  },

  // ═══════════════════════════════════════════════════════════════
  //  TESTS (JEST / CYPRESS / E2E)
  // ═══════════════════════════════════════════════════════════════

  {
    type: 'qcm',
    category: 'Tests',
    question_text: "Quelle est la différence entre un test unitaire et un test d'intégration ?",
    choices: [
      "Il n'y a aucune différence.",
      "Un test unitaire vérifie une fonction/composant isolé. Un test d'intégration vérifie l'interaction entre plusieurs composants ou couches (ex: API + BDD).",
      "Un test unitaire est automatisé, un test d'intégration est manuel.",
      "Un test unitaire est pour le front-end, un test d'intégration est pour le back-end."
    ],
    correct_answer: "Un test unitaire vérifie une fonction/composant isolé. Un test d'intégration vérifie l'interaction entre plusieurs composants ou couches (ex: API + BDD).",
    explanation: "La pyramide de tests : beaucoup de tests unitaires (rapides, isolés), quelques tests d'intégration (API, BDD), peu de tests E2E (lents, fragiles). Outils : Jest/Vitest (unitaire JS), Pytest (unitaire Python), Cypress/Playwright (E2E)."
  },
  {
    type: 'qcm',
    category: 'Tests',
    question_text: "Qu'est-ce qu'un test E2E (End-to-End) ?",
    choices: [
      "Un test qui vérifie uniquement le CSS.",
      "Un test qui simule le parcours complet d'un utilisateur dans l'application, du navigateur jusqu'à la base de données.",
      "Un test de performance du serveur.",
      "Un test qui vérifie la syntaxe du code (linting)."
    ],
    correct_answer: "Un test qui simule le parcours complet d'un utilisateur dans l'application, du navigateur jusqu'à la base de données.",
    explanation: "Les tests E2E utilisent un navigateur automatisé (Cypress, Playwright, Selenium) pour simuler des clics, saisies et navigations réels. Ils vérifient le système dans son ensemble mais sont plus lents et fragiles que les tests unitaires."
  },
  {
    type: 'jury',
    category: 'Tests',
    question_text: "Quelle stratégie de tests avez-vous mise en place dans votre projet ?",
    correct_answer: "Tests unitaires avec Jest/Vitest pour les fonctions utilitaires et les composants React isolés. Tests d'intégration avec Pytest pour les endpoints de l'API. Tests E2E avec Cypress pour les parcours utilisateur critiques (inscription, connexion, commande).",
    explanation: "Le jury vérifie que vous savez écrire et exécuter des tests. Même un nombre limité de tests démontre la compétence. La Definition of Done en agile inclut souvent : « le test correspondant est écrit et passe »."
  },

  // ═══════════════════════════════════════════════════════════════
  //  VEILLE TECHNOLOGIQUE
  // ═══════════════════════════════════════════════════════════════

  {
    type: 'qcm',
    category: 'Veille Technologique',
    question_text: "Quel outil permet d'agréger automatiquement les publications de plusieurs sources de veille technologique ?",
    choices: [
      'Un tableur Excel',
      'Un agrégateur de flux RSS (Feedly, Inoreader)',
      'Un logiciel de retouche photo',
      'Un éditeur de code (VS Code)'
    ],
    correct_answer: 'Un agrégateur de flux RSS (Feedly, Inoreader)',
    explanation: "La veille technologique efficace combine : flux RSS (Feedly), newsletters (TLDR, JavaScript Weekly), Twitter/X, GitHub Trending, conférences (Devoxx), meetups locaux. L'important est la régularité et l'organisation (catégorisation, archivage)."
  },
  {
    type: 'jury',
    category: 'Veille Technologique',
    question_text: "Comment organisez-vous votre veille technologique ? Quelles sources et outils utilisez-vous ?",
    correct_answer: "Agrégateur RSS (Feedly) pour les blogs tech, newsletters hebdomadaires (TLDR, Dev.to), GitHub Trending pour les projets émergents, MDN Web Docs pour la documentation officielle, participation à des meetups/conférences.",
    explanation: "Le jury évalue votre capacité à vous tenir à jour dans un domaine en constante évolution. Une veille structurée (temps dédié, catégorisation, partage avec l'équipe) est un signe de professionnalisme. Citez des exemples concrets de technologies découvertes via votre veille."
  },
];
