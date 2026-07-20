import React from 'react';

const OWASP_ITEMS: { index: string; title: string; text: string }[] = [
  { index: 'A01:2021', title: "Contrôle d'accès défaillant (Broken Access Control)", text: "Les utilisateurs peuvent accéder à des ressources en dehors de leurs privilèges (ex: modifier le compte d'un autre utilisateur en changeant l'ID dans l'URL). Prévention : vérification des permissions côté serveur, principe du moindre privilège." },
  { index: 'A02:2021', title: 'Défaillances cryptographiques (Cryptographic Failures)', text: "Protection inadéquate des données sensibles en transit ou au repos. Ex: mot de passe stocké en clair ou haché avec MD5 au lieu de Bcrypt. Prévention : HTTPS, Bcrypt/Argon2, chiffrement AES au repos." },
  { index: 'A03:2021', title: 'Injections (SQL, XSS, Command Injection)', text: "Interprétation de données utilisateur hostiles comme faisant partie d'une commande. Prévention : requêtes paramétrées, ORM, échappement des sorties HTML, Content Security Policy (CSP)." },
  { index: 'A04:2021', title: 'Conception non sécurisée (Insecure Design)', text: "Absence de modélisation des menaces dès la conception. Prévention : Privacy by Design, threat modeling, revue d'architecture sécurité, design patterns sécurisés." },
  { index: 'A05:2021', title: 'Mauvaise configuration de sécurité (Security Misconfiguration)', text: "Serveur mal configuré, pages d'erreur trop verbeuses, ports inutiles ouverts, comptes par défaut actifs. Prévention : durcissement des configurations, désactivation des fonctionnalités inutiles, mises à jour régulières." },
  { index: 'A06:2021', title: 'Composants vulnérables et obsolètes (Vulnerable and Outdated Components)', text: "Utilisation de bibliothèques, frameworks ou modules avec des vulnérabilités connues (CVE). Prévention : npm audit, Dependabot, mise à jour régulière des dépendances, SBOM (Software Bill of Materials)." },
  { index: 'A07:2021', title: 'Identification et authentification défaillantes (Identification and Authentication Failures)', text: "Mots de passe faibles autorisés, absence de protection anti-brute force, sessions non invalidées. Prévention : Bcrypt avec salt, MFA (authentification multi-facteurs), limitation du taux de tentatives." },
  { index: 'A08:2021', title: "Manque d'intégrité des données et du logiciel (Software and Data Integrity Failures)", text: "Code ou données modifiés sans vérification (ex: pipeline CI/CD non sécurisé, dépendances non vérifiées). Prévention : signatures numériques, intégrité des pipelines CI/CD, SRI (Subresource Integrity) pour les CDN." },
  { index: 'A09:2021', title: 'Journalisation et surveillance insuffisantes (Security Logging and Monitoring Failures)', text: "Absence de logs ou de monitoring permettant de détecter une intrusion. Prévention : journalisation des événements d'authentification, alertes en temps réel, conservation sécurisée des logs, SIEM." },
  { index: 'A10:2021', title: 'Falsification de requêtes côté serveur — SSRF (Server-Side Request Forgery)', text: "L'application effectue des requêtes HTTP vers des URL fournies par l'utilisateur sans validation. Prévention : liste blanche d'URLs autorisées, blocage des requêtes vers les réseaux internes, validation stricte des entrées." },
];

/** Onglet « OWASP & Sécurité » : référentiel des 10 risques de sécurité web. */
const OwaspTab: React.FC = () => (
  <section className="tab-content fade-in">
    <div className="card-soft">
      <h3 className="card-title">Référentiel OWASP & Cyber-Résilience</h3>
      <p className="card-subtitle">
        Mémorisez les failles de sécurité de référence. Le jury pose fréquemment des questions sur ces aspects.
      </p>
      <div className="owasp-list">
        {OWASP_ITEMS.map((item) => (
          <div key={item.index} className="owasp-item">
            <div className="owasp-index">{item.index}</div>
            <div className="owasp-detail">
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default OwaspTab;
