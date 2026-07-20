import json
import urllib.request
import urllib.error
import asyncio
import re

# ---------------------------------------------------------------------------
# Fallback questions when generator fails or Ollama is offline
# Covers ALL DWWM (RNCP 37674) certification domains
# ---------------------------------------------------------------------------
DEFAULT_QUESTIONS = [
    # -----------------------------------------------------------------------
    # HTML / CSS / Responsive
    # -----------------------------------------------------------------------
    {
        "type": "qcm",
        "category": "HTML/CSS/Responsive",
        "question_text": "Quelle balise HTML5 est la plus appropriée pour regrouper des liens de navigation principaux ?",
        "choices": [
            "<div id='nav'>",
            "<nav>",
            "<header>",
            "<section>"
        ],
        "correct_answer": "<nav>",
        "explanation": "La balise sémantique <nav> indique explicitement une zone de navigation principale, améliorant l'accessibilité et le référencement."
    },
    {
        "type": "qcm",
        "category": "HTML/CSS/Responsive",
        "question_text": "En CSS, quelle propriété permet de créer une mise en page à deux colonnes qui s'adapte automatiquement à la largeur de l'écran ?",
        "choices": [
            "float: left; width: 50%;",
            "display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));",
            "position: absolute; left: 50%;",
            "display: inline; width: auto;"
        ],
        "correct_answer": "display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));",
        "explanation": "CSS Grid avec auto-fit et minmax() crée un layout responsive intrinsèque qui redistribue automatiquement les colonnes sans media query."
    },
    {
        "type": "jury",
        "category": "HTML/CSS/Responsive",
        "question_text": "Décrivez votre approche pour intégrer une maquette en responsive design. Quelles techniques et outils utilisez-vous ?",
        "choices": None,
        "correct_answer": "Approche mobile-first, utilisation de media queries, unités relatives (rem, %, vw/vh), CSS Grid et/ou Flexbox, test sur plusieurs viewports avec les DevTools.",
        "explanation": "Le mobile-first garantit une base légère enrichie progressivement. Les unités relatives et les layouts modernes (Grid, Flexbox) permettent une adaptation fluide sans points de rupture excessifs."
    },

    # -----------------------------------------------------------------------
    # JavaScript / DOM
    # -----------------------------------------------------------------------
    {
        "type": "qcm",
        "category": "JavaScript/DOM",
        "question_text": "Quelle est la différence fondamentale entre 'let' et 'var' en JavaScript ?",
        "choices": [
            "'let' a une portée de bloc, 'var' a une portée de fonction.",
            "'var' a une portée de bloc, 'let' a une portée de fonction.",
            "'let' et 'var' sont strictement identiques depuis ES6.",
            "'let' ne peut stocker que des chaînes de caractères."
        ],
        "correct_answer": "'let' a une portée de bloc, 'var' a une portée de fonction.",
        "explanation": "'var' est hoistée au niveau de la fonction englobante et peut provoquer des bugs subtils. 'let' (ES6) est limitée au bloc { } dans lequel elle est déclarée."
    },
    {
        "type": "qcm",
        "category": "JavaScript/DOM",
        "question_text": "Que retourne `document.querySelectorAll('.item')` ?",
        "choices": [
            "Un tableau (Array) d'éléments.",
            "Un seul élément HTML.",
            "Une NodeList statique contenant tous les éléments correspondants.",
            "Une chaîne de caractères HTML."
        ],
        "correct_answer": "Une NodeList statique contenant tous les éléments correspondants.",
        "explanation": "querySelectorAll retourne une NodeList statique (non-live). Pour utiliser les méthodes Array (map, filter…), il faut la convertir avec Array.from() ou le spread operator."
    },
    {
        "type": "jury",
        "category": "JavaScript/DOM",
        "question_text": "Expliquez le concept de programmation asynchrone en JavaScript. Donnez un exemple concret d'utilisation dans votre projet.",
        "choices": None,
        "correct_answer": "JavaScript est mono-thread ; l'asynchrone (Promises, async/await, callbacks) permet d'exécuter des opérations non-bloquantes (appels API, accès fichiers). Exemple : fetch() pour récupérer des données depuis une API REST.",
        "explanation": "L'event loop de JS délègue les tâches longues (I/O, réseau) puis exécute les callbacks associées quand elles aboutissent, évitant le gel de l'interface utilisateur."
    },

    # -----------------------------------------------------------------------
    # React / Frameworks Front-end
    # -----------------------------------------------------------------------
    {
        "type": "qcm",
        "category": "React/Frameworks",
        "question_text": "Dans React, quel hook permet de gérer un état local dans un composant fonctionnel ?",
        "choices": [
            "useEffect",
            "useState",
            "useContext",
            "useReducer"
        ],
        "correct_answer": "useState",
        "explanation": "useState retourne une paire [valeur, setter]. C'est le hook fondamental pour déclarer et mettre à jour un état local dans un composant fonctionnel React."
    },
    {
        "type": "qcm",
        "category": "React/Frameworks",
        "question_text": "Quel est le rôle principal du Virtual DOM dans React ?",
        "choices": [
            "Remplacer complètement le DOM réel par un DOM virtuel en mémoire.",
            "Comparer l'arbre virtuel avec le DOM réel pour ne mettre à jour que les nœuds modifiés (réconciliation).",
            "Permettre au navigateur de charger les pages plus rapidement.",
            "Stocker les données utilisateur côté client."
        ],
        "correct_answer": "Comparer l'arbre virtuel avec le DOM réel pour ne mettre à jour que les nœuds modifiés (réconciliation).",
        "explanation": "React maintient une représentation légère du DOM en mémoire. Lors d'un changement d'état, il calcule le diff minimal (algorithme de réconciliation) et n'applique que les mutations nécessaires au DOM réel."
    },
    {
        "type": "jury",
        "category": "React/Frameworks",
        "question_text": "Comment organisez-vous l'architecture de votre application front-end (composants, state management, routing) ? Justifiez vos choix.",
        "choices": None,
        "correct_answer": "Découpage en composants réutilisables, séparation présentation/logique, gestion d'état centralisée (Context API, Redux, Zustand) si nécessaire, React Router pour le routing côté client.",
        "explanation": "Une bonne architecture front-end repose sur la modularité, la séparation des responsabilités (SoC) et un flux de données prévisible. Le choix du state manager dépend de la complexité de l'application."
    },

    # -----------------------------------------------------------------------
    # UX / UI / Maquettage
    # -----------------------------------------------------------------------
    {
        "type": "qcm",
        "category": "UX/UI/Maquettage",
        "question_text": "Quelle est la principale différence entre une maquette statique (mockup) et un prototype interactif ?",
        "choices": [
            "La maquette est en noir et blanc, le prototype est en couleur.",
            "La maquette est statique, tandis que le prototype simule les transitions et les clics utilisateur.",
            "Le prototype est obligatoirement codé en HTML, la maquette est un dessin.",
            "Il n'y a aucune différence technique."
        ],
        "correct_answer": "La maquette est statique, tandis que le prototype simule les transitions et les clics utilisateur.",
        "explanation": "La maquette (mockup) montre le design final de manière figée. Le prototype simule les interactions et le workflow pour tester l'UX avant le développement."
    },
    {
        "type": "jury",
        "category": "UX/UI/Maquettage",
        "question_text": "Décrivez votre démarche UX pour concevoir les interfaces de votre projet. Quels outils avez-vous utilisés et pourquoi ?",
        "choices": None,
        "correct_answer": "Recherche utilisateur (personas, user stories), wireframes basse fidélité, puis maquettes haute fidélité (Figma, Adobe XD), tests utilisateurs itératifs.",
        "explanation": "Une démarche UX structurée commence par la compréhension des besoins utilisateurs, passe par des itérations de maquettage et se valide par des tests utilisateurs pour réduire les risques d'ergonomie."
    },

    # -----------------------------------------------------------------------
    # Accessibilité
    # -----------------------------------------------------------------------
    {
        "type": "qcm",
        "category": "Accessibilité",
        "question_text": "Quelle est la règle RGAA/WCAG pour le ratio de contraste minimal d'un texte de taille normale ?",
        "choices": [
            "Ratio minimal de 3:1",
            "Ratio minimal de 4.5:1",
            "Ratio minimal de 7:1",
            "Il n'y a pas de ratio de contraste exigé"
        ],
        "correct_answer": "Ratio minimal de 4.5:1",
        "explanation": "Pour le texte normal (taille inférieure à 18pt ou 14pt gras), les critères WCAG 2.1 niveau AA exigent un ratio de contraste minimal de 4.5:1 entre le texte et son arrière-plan."
    },
    {
        "type": "qcm",
        "category": "Accessibilité",
        "question_text": "Quel attribut HTML permet d'associer un label à un champ de formulaire pour les lecteurs d'écran ?",
        "choices": [
            "name",
            "for (sur le <label>) et id (sur l'<input>)",
            "title",
            "placeholder"
        ],
        "correct_answer": "for (sur le <label>) et id (sur l'<input>)",
        "explanation": "L'attribut 'for' du <label> doit correspondre à l'attribut 'id' de l'<input>. Cette association explicite permet aux technologies d'assistance d'annoncer le libellé du champ."
    },
    {
        "type": "jury",
        "category": "Accessibilité",
        "question_text": "Comment avez-vous pris en compte l'accessibilité dans votre projet ? Quels référentiels avez-vous suivis ?",
        "choices": None,
        "correct_answer": "Respect du RGAA/WCAG : balises sémantiques, attributs ARIA quand nécessaire, contrastes suffisants, navigation clavier, textes alternatifs sur les images, tests avec des outils comme Lighthouse ou axe.",
        "explanation": "L'accessibilité numérique est une obligation légale en France (RGAA). Elle repose sur la sémantique HTML, les attributs ARIA, le contraste, la navigation clavier et les tests automatisés et manuels."
    },

    # -----------------------------------------------------------------------
    # BDD / SQL / Modélisation
    # -----------------------------------------------------------------------
    {
        "type": "qcm",
        "category": "BDD/SQL/Modélisation",
        "question_text": "Quel type de relation nécessite une table d'association (table de jonction) en modélisation relationnelle ?",
        "choices": [
            "Une relation 1:1 (un-à-un)",
            "Une relation 1:N (un-à-plusieurs)",
            "Une relation N:N (plusieurs-à-plusieurs)",
            "Aucune relation ne nécessite de table intermédiaire"
        ],
        "correct_answer": "Une relation N:N (plusieurs-à-plusieurs)",
        "explanation": "Une relation N:N ne peut pas être représentée directement entre deux tables. On crée une table d'association contenant les clés étrangères des deux tables pour matérialiser la relation."
    },
    {
        "type": "qcm",
        "category": "BDD/SQL/Modélisation",
        "question_text": "Quelle commande SQL permet de récupérer les enregistrements communs à deux tables liées par une clé étrangère ?",
        "choices": [
            "SELECT * FROM table1 LEFT JOIN table2 ON …",
            "SELECT * FROM table1 INNER JOIN table2 ON …",
            "SELECT * FROM table1 UNION table2",
            "SELECT * FROM table1 WHERE table2 IS NOT NULL"
        ],
        "correct_answer": "SELECT * FROM table1 INNER JOIN table2 ON …",
        "explanation": "INNER JOIN retourne uniquement les lignes ayant une correspondance dans les deux tables. LEFT JOIN inclut aussi les lignes sans correspondance dans la table de gauche."
    },
    {
        "type": "jury",
        "category": "BDD/SQL/Modélisation",
        "question_text": "Quelle est la différence entre une base de données relationnelle (SQL) et non relationnelle (NoSQL) ? Justifiez le choix que vous avez fait pour votre projet.",
        "choices": None,
        "correct_answer": "SQL utilise des tables structurées avec des relations strictes et l'intégrité référentielle. NoSQL (ex: MongoDB) offre des schémas flexibles (documents JSON), adaptés à la scalabilité horizontale et aux données non structurées.",
        "explanation": "Les bases relationnelles garantissent la cohérence (ACID) via clés étrangères et requêtes SQL normalisées. Le NoSQL privilégie la flexibilité et la performance en lecture/écriture pour des données volumineuses ou à structure variable."
    },

    # -----------------------------------------------------------------------
    # API REST / Back-end
    # -----------------------------------------------------------------------
    {
        "type": "qcm",
        "category": "API REST/Back-end",
        "question_text": "Quel code de statut HTTP indique qu'une ressource a été créée avec succès ?",
        "choices": [
            "200 OK",
            "201 Created",
            "204 No Content",
            "301 Moved Permanently"
        ],
        "correct_answer": "201 Created",
        "explanation": "Le code 201 Created est la réponse standard pour une requête POST ayant abouti à la création d'une nouvelle ressource. Le corps de la réponse contient généralement la ressource créée."
    },
    {
        "type": "qcm",
        "category": "API REST/Back-end",
        "question_text": "Dans une architecture REST, quelle méthode HTTP est idempotente et sert à remplacer entièrement une ressource existante ?",
        "choices": [
            "POST",
            "PATCH",
            "PUT",
            "DELETE"
        ],
        "correct_answer": "PUT",
        "explanation": "PUT remplace entièrement la ressource à l'URI spécifiée. Elle est idempotente : plusieurs appels identiques produisent le même résultat. PATCH ne modifie que partiellement la ressource."
    },
    {
        "type": "jury",
        "category": "API REST/Back-end",
        "question_text": "Expliquez comment vous gérez la politique CORS (Cross-Origin Resource Sharing) sur votre application.",
        "choices": None,
        "correct_answer": "En configurant les en-têtes CORS en backend (comme avec CORSMiddleware dans FastAPI) pour autoriser uniquement l'origine de mon frontend de confiance, en spécifiant les méthodes et headers autorisés.",
        "explanation": "La politique de même origine (SOP) bloque par défaut les requêtes provenant d'origines différentes. Le CORS permet de déclarer explicitement les domaines, méthodes et en-têtes autorisés à interroger l'API."
    },

    # -----------------------------------------------------------------------
    # Auth / Sécurité
    # -----------------------------------------------------------------------
    {
        "type": "qcm",
        "category": "Auth/Sécurité",
        "question_text": "Pourquoi utilise-t-on un facteur de coût (work factor) dans l'algorithme de hachage Bcrypt ?",
        "choices": [
            "Pour augmenter la taille de la clé générée en base de données.",
            "Pour ralentir le temps de calcul et rendre les attaques par force brute infaisables à grande échelle.",
            "Pour compresser le mot de passe avant de l'enregistrer.",
            "Pour générer des sels de hachage statiques."
        ],
        "correct_answer": "Pour ralentir le temps de calcul et rendre les attaques par force brute infaisables à grande échelle.",
        "explanation": "Bcrypt double le nombre de cycles d'expansion (2^C) à chaque incrément du facteur. Le temps de calcul devient prohibitif pour un attaquant mais reste acceptable pour une authentification unitaire."
    },
    {
        "type": "qcm",
        "category": "Auth/Sécurité",
        "question_text": "Quel est l'avantage principal d'un token JWT (JSON Web Token) pour l'authentification ?",
        "choices": [
            "Il est chiffré de bout en bout par défaut.",
            "Il permet une authentification stateless : le serveur n'a pas besoin de stocker de session.",
            "Il remplace complètement HTTPS.",
            "Il ne peut jamais expirer."
        ],
        "correct_answer": "Il permet une authentification stateless : le serveur n'a pas besoin de stocker de session.",
        "explanation": "Un JWT contient les informations d'identité signées. Le serveur vérifie la signature sans consulter de base de sessions, ce qui facilite la scalabilité horizontale."
    },
    {
        "type": "jury",
        "category": "Auth/Sécurité",
        "question_text": "Décrivez le mécanisme d'authentification que vous avez mis en place dans votre projet. Quelles mesures de sécurité avez-vous appliquées ?",
        "choices": None,
        "correct_answer": "Authentification par JWT (ou session), hachage des mots de passe (bcrypt/argon2), HTTPS obligatoire, protection CSRF si cookies, expiration des tokens, refresh tokens.",
        "explanation": "Un système d'authentification sécurisé repose sur le hachage fort des mots de passe, le transport chiffré (HTTPS), la gestion d'expiration des tokens et la protection contre les attaques courantes (CSRF, XSS)."
    },

    # -----------------------------------------------------------------------
    # OWASP / Sécurité Web
    # -----------------------------------------------------------------------
    {
        "type": "qcm",
        "category": "OWASP/Sécurité Web",
        "question_text": "Qu'est-ce qu'une attaque XSS (Cross-Site Scripting) ?",
        "choices": [
            "Une attaque qui exploite les failles de configuration du serveur DNS.",
            "L'injection de scripts malveillants dans une page web vue par d'autres utilisateurs.",
            "Une attaque par déni de service distribué (DDoS).",
            "Le vol de certificats SSL du serveur."
        ],
        "correct_answer": "L'injection de scripts malveillants dans une page web vue par d'autres utilisateurs.",
        "explanation": "Le XSS permet à un attaquant d'injecter du JavaScript dans une page. Le navigateur de la victime exécute le script, ce qui peut mener au vol de cookies, de sessions ou à la redirection vers des sites malveillants."
    },
    {
        "type": "qcm",
        "category": "OWASP/Sécurité Web",
        "question_text": "Comment se prémunir contre les injections SQL ?",
        "choices": [
            "En validant la longueur des mots de passe uniquement.",
            "En utilisant des requêtes paramétrées (prepared statements) ou un ORM.",
            "En désactivant JavaScript côté client.",
            "En utilisant uniquement des requêtes GET."
        ],
        "correct_answer": "En utilisant des requêtes paramétrées (prepared statements) ou un ORM.",
        "explanation": "Les requêtes paramétrées séparent le code SQL des données utilisateur. L'ORM (ex: SQLAlchemy) génère automatiquement des requêtes sécurisées, éliminant le risque de concaténation directe."
    },
    {
        "type": "jury",
        "category": "OWASP/Sécurité Web",
        "question_text": "Citez les principales vulnérabilités du Top 10 OWASP et expliquez comment vous les avez traitées dans votre projet.",
        "choices": None,
        "correct_answer": "Injection (SQL, XSS), authentification cassée, exposition de données sensibles, XXE, contrôle d'accès défaillant, mauvaise configuration de sécurité. Contre-mesures : requêtes paramétrées, validation des entrées, HTTPS, CSP, headers de sécurité.",
        "explanation": "Le Top 10 OWASP est un référentiel incontournable qui recense les risques les plus critiques pour les applications web. Chaque vulnérabilité a des contre-mesures spécifiques à mettre en œuvre dès la conception."
    },

    # -----------------------------------------------------------------------
    # RGPD / CNIL
    # -----------------------------------------------------------------------
    {
        "type": "qcm",
        "category": "RGPD/CNIL",
        "question_text": "Selon le RGPD, quel droit permet à un utilisateur de demander la suppression de ses données personnelles ?",
        "choices": [
            "Le droit de portabilité",
            "Le droit à l'effacement (droit à l'oubli)",
            "Le droit de rectification",
            "Le droit d'opposition"
        ],
        "correct_answer": "Le droit à l'effacement (droit à l'oubli)",
        "explanation": "L'article 17 du RGPD consacre le droit à l'effacement. L'utilisateur peut demander la suppression de ses données sous certaines conditions (consentement retiré, données plus nécessaires, etc.)."
    },
    {
        "type": "jury",
        "category": "RGPD/CNIL",
        "question_text": "Comment avez-vous pris en compte le RGPD dans la conception de votre projet ? Quelles mesures concrètes avez-vous mises en place ?",
        "choices": None,
        "correct_answer": "Privacy by design, minimisation des données collectées, consentement explicite (cookies, formulaires), registre des traitements, durées de conservation définies, possibilité d'export et de suppression des données.",
        "explanation": "Le RGPD impose une approche proactive : ne collecter que les données nécessaires, informer l'utilisateur, permettre l'exercice de ses droits et documenter les traitements dans un registre."
    },

    # -----------------------------------------------------------------------
    # DevOps / CI-CD
    # -----------------------------------------------------------------------
    {
        "type": "qcm",
        "category": "DevOps/CI-CD",
        "question_text": "Quel est le rôle principal d'un pipeline CI/CD ?",
        "choices": [
            "Rédiger automatiquement la documentation du projet.",
            "Automatiser les étapes de build, test et déploiement à chaque modification du code source.",
            "Gérer les droits d'accès des développeurs au dépôt Git.",
            "Créer automatiquement les maquettes UI du projet."
        ],
        "correct_answer": "Automatiser les étapes de build, test et déploiement à chaque modification du code source.",
        "explanation": "Un pipeline CI/CD (Intégration Continue / Déploiement Continu) détecte chaque commit, lance les tests automatisés, construit l'application et peut la déployer automatiquement en production."
    },
    {
        "type": "qcm",
        "category": "DevOps/CI-CD",
        "question_text": "Quel outil permet de conteneuriser une application pour garantir la reproductibilité de son environnement d'exécution ?",
        "choices": [
            "Git",
            "Docker",
            "npm",
            "Webpack"
        ],
        "correct_answer": "Docker",
        "explanation": "Docker permet de créer des conteneurs isolés contenant l'application et toutes ses dépendances. Le Dockerfile décrit l'environnement de manière déclarative, garantissant un comportement identique en dev, test et production."
    },
    {
        "type": "jury",
        "category": "DevOps/CI-CD",
        "question_text": "Décrivez votre workflow de versioning et de déploiement. Quels outils utilisez-vous et comment gérez-vous les branches ?",
        "choices": None,
        "correct_answer": "Git avec stratégie de branches (Git Flow ou trunk-based), pull requests avec revue de code, CI/CD (GitHub Actions, GitLab CI), déploiement automatisé (Docker, Vercel, Heroku…).",
        "explanation": "Un workflow de versioning structuré (branches feature, develop, main) combiné à un pipeline CI/CD garantit la qualité du code et la fiabilité des déploiements."
    },

    # -----------------------------------------------------------------------
    # Agilité / Scrum
    # -----------------------------------------------------------------------
    {
        "type": "qcm",
        "category": "Agilité/Scrum",
        "question_text": "Dans la méthodologie Scrum, quel événement permet à l'équipe d'inspecter son travail et d'adapter son processus ?",
        "choices": [
            "Le Sprint Planning",
            "Le Daily Scrum (mêlée quotidienne)",
            "La Sprint Retrospective",
            "Le Sprint Review"
        ],
        "correct_answer": "La Sprint Retrospective",
        "explanation": "La rétrospective a lieu à la fin de chaque sprint. L'équipe identifie ce qui a bien fonctionné, ce qui peut être amélioré et définit des actions concrètes pour le sprint suivant."
    },
    {
        "type": "qcm",
        "category": "Agilité/Scrum",
        "question_text": "Quel artefact Scrum contient la liste priorisée de toutes les fonctionnalités souhaitées pour le produit ?",
        "choices": [
            "Le Sprint Backlog",
            "Le Product Backlog",
            "Le burndown chart",
            "Le Definition of Done"
        ],
        "correct_answer": "Le Product Backlog",
        "explanation": "Le Product Backlog est une liste ordonnée et évolutive de tout ce qui pourrait être nécessaire dans le produit. Il est géré par le Product Owner et sert de source unique de travail pour l'équipe."
    },
    {
        "type": "jury",
        "category": "Agilité/Scrum",
        "question_text": "Quelle méthodologie de gestion de projet avez-vous utilisée ? Décrivez son application concrète sur votre projet.",
        "choices": None,
        "correct_answer": "Méthode Agile (Scrum/Kanban) : sprints de 2 semaines, daily stand-ups, backlog priorisé, user stories avec critères d'acceptation, outils de suivi (Trello, Jira, Notion).",
        "explanation": "L'agilité permet de livrer de la valeur incrémentalement, de s'adapter aux retours utilisateurs et de réduire les risques en validant régulièrement le produit avec les parties prenantes."
    },

    # -----------------------------------------------------------------------
    # Tests
    # -----------------------------------------------------------------------
    {
        "type": "qcm",
        "category": "Tests",
        "question_text": "Quelle est la différence entre un test unitaire et un test d'intégration ?",
        "choices": [
            "Le test unitaire vérifie une fonction isolée, le test d'intégration vérifie l'interaction entre plusieurs modules.",
            "Le test unitaire est automatisé, le test d'intégration est toujours manuel.",
            "Le test d'intégration est plus rapide que le test unitaire.",
            "Il n'y a aucune différence, ce sont des synonymes."
        ],
        "correct_answer": "Le test unitaire vérifie une fonction isolée, le test d'intégration vérifie l'interaction entre plusieurs modules.",
        "explanation": "Le test unitaire isole une unité de code (fonction, méthode) avec des mocks si nécessaire. Le test d'intégration vérifie que plusieurs composants fonctionnent correctement ensemble (ex: API + base de données)."
    },
    {
        "type": "jury",
        "category": "Tests",
        "question_text": "Quelle stratégie de tests avez-vous mise en place dans votre projet ? Quels outils avez-vous utilisés ?",
        "choices": None,
        "correct_answer": "Tests unitaires (pytest, Jest), tests d'intégration (API endpoints), couverture de code mesurée, tests manuels sur différents navigateurs/devices.",
        "explanation": "Une stratégie de tests complète combine tests unitaires pour la logique métier, tests d'intégration pour les flux complets, et tests manuels pour l'ergonomie. La pyramide des tests guide la répartition des efforts."
    },

    # -----------------------------------------------------------------------
    # Veille Technologique
    # -----------------------------------------------------------------------
    {
        "type": "qcm",
        "category": "Veille Technologique",
        "question_text": "Quel outil permet de mettre en place une veille technologique automatisée en agrégeant des flux d'informations ?",
        "choices": [
            "Un tableur Excel mis à jour manuellement.",
            "Un agrégateur de flux RSS (Feedly) couplé à des alertes Google.",
            "Un logiciel de retouche d'images.",
            "Un compilateur C++."
        ],
        "correct_answer": "Un agrégateur de flux RSS (Feedly) couplé à des alertes Google.",
        "explanation": "La veille technologique structurée utilise des outils d'agrégation (Feedly, Inoreader), des alertes (Google Alerts), des newsletters spécialisées et le suivi de communautés (GitHub, Stack Overflow, Dev.to)."
    },
]


def _call_ollama(text: str) -> list:
    url = "http://localhost:11434/api/chat"
    model = "qwen2.5-coder:14b"

    # Prompt optimized to get clean JSON structure matching our needs
    system_prompt = (
        "Vous êtes un examinateur expert pour le Titre Professionnel Développeur Web et Web Mobile (RNCP 37674). "
        "Vous devez analyser le texte fourni décrivant le projet d'un candidat et générer un JSON valide. "
        "Le JSON doit être une liste contenant exactement 10 questions adaptées à la stack technique et au métier décrit.\n"
        "Générez :\n"
        "- 5 questions de type 'qcm' (QCM écrit) avec les champs : 'type': 'qcm', 'category' (domaine technique parmi : "
        "HTML/CSS/Responsive, JavaScript/DOM, React/Frameworks, UX/UI/Maquettage, Accessibilité, BDD/SQL/Modélisation, "
        "API REST/Back-end, Auth/Sécurité, OWASP/Sécurité Web, RGPD/CNIL, DevOps/CI-CD, Agilité/Scrum, Tests, "
        "Veille Technologique), 'question_text' (la question), 'choices' (liste de 4 propositions), "
        "'correct_answer' (la proposition exacte correcte), 'explanation' (explication didactique).\n"
        "- 5 questions de type 'jury' (questions ouvertes) avec les champs : 'type': 'jury', 'category' (même liste de domaines), "
        "'question_text' (la question), 'correct_answer' (mots-clés principaux attendus), 'explanation' (explication de la réponse idéale).\n"
        "Variez les catégories pour couvrir un maximum de domaines différents.\n"
        "Ne retournez RIEN d'autre que le JSON valide. Pas de texte explicatif autour, pas de formatage en dehors du JSON brut."
    )

    user_prompt = f"Voici la description du projet du candidat :\n\n{text[:4000]}"

    data = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "stream": False
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        # Timeout at 45 seconds to allow larger model responses
        with urllib.request.urlopen(req, timeout=45) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            content = res_data["message"]["content"].strip()
            return _parse_questions(content)
    except Exception as e:
        print(f"Error generating questions via local Ollama: {e}")
        # Return default fallback questions
        return DEFAULT_QUESTIONS


def _parse_questions(content: str) -> list:
    """Parse and validate the JSON question list returned by Ollama."""

    # Clean content if the model surrounded it with markdown code block
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()

    # Find the JSON array start and end
    array_start = content.find("[")
    array_end = content.rfind("]")
    if array_start != -1 and array_end != -1:
        content = content[array_start:array_end + 1]

    parsed = json.loads(content)
    if not isinstance(parsed, list) or len(parsed) == 0:
        raise ValueError("JSON is not a non-empty array")

    # Validate minimal structure for each question
    for q in parsed:
        if "type" not in q or "question_text" not in q or "correct_answer" not in q or "explanation" not in q:
            raise ValueError("Incomplete question structure")
        if q["type"] == "qcm" and ("choices" not in q or len(q["choices"]) < 2):
            raise ValueError("QCM choices missing or invalid")
        # Ensure category field exists, default to 'Général' if missing
        if "category" not in q or not q["category"]:
            q["category"] = "Général"

    return parsed


async def generate_questions_from_text(text: str) -> list[dict]:
    # Run blockable HTTP request in a thread pool to preserve asynchronous runtime
    return await asyncio.to_thread(_call_ollama, text)
