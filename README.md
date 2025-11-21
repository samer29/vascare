# VascCare - Plateforme Médicale Spécialisée

![VascCare Logo](https://./src/assets/logoDrbradai.png)

---

## 🏥 À Propos

**VascCare** est une application web complète spécialement conçue pour les spécialistes en médecine interne, diabétologie et pathologies vasculaires. Cette plateforme intuitive permet une gestion optimale des patients, des consultations, et des procédures médicales spécifiques à ces spécialités.

**Version:** 2.2.1  
**Développeur:** MediConnect Solutions

---

## 🩺 Domaines d'Expertise

- **Médecine Interne** — Prise en charge complète des pathologies internes avec suivi personnalisé
- **Diabétologie** — Gestion spécialisée des patients diabétiques avec monitoring continu
- **Pathologies Vasculaires** — Diagnostic et suivi des maladies vasculaires avec échodoppler

---

## 🔬 Fonctionnalités Principales

### Gestion des Patients

- 📋 Dossiers patients complets
- 👥 Gestion des antécédents médicaux
- 📊 Suivi des consultations
- 🔄 Historique médical détaillé

### Examens Spécialisés & Modules

#### 🡺 Échographie Abdominale

- Foie, vésicule biliaire, voies biliaires
- Tronc porte, VCI, VSH
- Reins (droit/gauche), pancréas, rate
- Vessie, prostate, utérus, ovaires
- Conclusion et CAT détaillés

#### 🩸 Échodoppler Vasculaire

- **Types:** Membres Inférieurs (MI), Membres Supérieurs (MS)
- **Sous-types:** Normal, Artériel, Veineux
- Champs dynamiques configurables
- Rapports professionnels

#### 🦋 Examens Thyroïdiens

- Avec Schéma — Indication, Technique, Résultats, Conclusion, CAT
- Sans Schéma — Technique, Résultats, Conclusion, CAT
- Thyroïdectomie — Technique, Résultats, Conclusion, CAT
- Thyroïdite — Technique, Résultats, Conclusion, CAT

#### ❤️ Électrocardiogramme (ECG)

- Examen initial
- Résultats détaillés de l'électrocardiogramme
- Conclusion médicale

---

## 📊 Gestion Administrative

### Facturation

- 🧾 Génération automatique des factures
- 💰 Gestion des tarifs par acte médical
- 📈 Tableaux de bord financiers
- 📤 Export CSV des données

### Ordonnances

- 💊 Gestion des médicaments
- 📝 Formes et détails configurables
- ⏱️ Durées de traitement prédéfinies
- 🖨️ Génération PDF professionnelle

### Examens Complémentaires

- 🔬 Examens biologiques
- 🧪 Explorations fonctionnelles
- 📋 Groupes d'examens configurables
- ✅ Sélection multiple intuitive

---

## 🚀 Installation et Démarrage

### Prérequis

- Node.js 16+
- MySQL 8.0+
- npm ou yarn

### Installation

```bash
# Cloner le repository
git clone <repository-url>
cd vascare

# Installer les dépendances
npm install
```

### Configuration de la base de données

```sql
-- Créer la base de données
CREATE DATABASE vascare;

-- Les tables seront créées automatiquement
-- au premier démarrage de l'application
```

### Configuration environnement

```bash
# Créer le fichier .env
cp .env.example .env

# Configurer les variables d'environnement
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=vascare
BACKEND_PORT=4002
```

### Démarrer l'application

```bash
# Démarrage du backend
cd backend
npm start

# Démarrage du frontend (nouveau terminal)
cd frontend
npm start
```

L'application sera accessible à: `http://localhost:3000`

---

## 📁 Structure du Projet

```
vascare/
├── src/
│   ├── components/          # Composants React
│   │   ├── reports/         # Génération de rapports PDF
│   │   ├── forms/           # Formulaires spécialisés
│   │   └── common/          # Composants partagés
│   ├── contexts/           # Contextes React
│   ├── utils/              # Utilitaires et helpers
│   └── assets/             # Images et ressources
├── backend/
│   ├── controllers/        # Contrôleurs API
│   ├── routes/              # Routes Express
│   ├── config/              # Configuration base de données
│   └── middleware/         # Middlewares
└── public/                 # Fichiers statiques
```

---

## 🔧 Configuration

### Rôles Utilisateurs

- **Médecin** — Accès complet à toutes les fonctionnalités
- **Secrétaire** — Accès limité (consultations en lecture seule)

### Templates Médicaux

L'application inclut un système de templates pour:

- Échographies abdominales
- Échodoppler vasculaire
- Examens thyroïdiens
- ECG

### Personnalisation

- 🎨 Thèmes sombre/clair
- ⚙️ Paramètres configurables
- 📊 Tableaux de bord personnalisables

---

## 📊 Tableaux de Bord

### Dashboard Principal

- 📈 Revenus mensuels
- 👥 Statistiques patients
- 📅 Rendez-vous du jour
- 🏥 Activité médicale

### Dashboard Facturation

- 💰 Revenus par type d'acte
- 📋 Statuts de paiement
- 📤 Export de données
- 🔍 Filtres avancés

---

## 🖨️ Génération de Documents

### Rapports Médicaux

- 📄 Formats PDF professionnels
- 🏥 En-têtes personnalisables
- 📋 Données structurées
- 🔒 Sécurisation des données

### Types de Documents

- Consultations médicales
- Ordonnances
- Certificats médicaux
- Lettres d'orientation
- Factures détaillées

---

## 🔒 Sécurité

- 🔐 Authentification sécurisée
- 🛡️ Validation des données
- 📝 Journalisation des activités
- 🔄 Sauvegarde automatique

---

## 📞 Support

**Contact Développeur**

- Nom: Samer Elouissi
- Email: elouissim@gmail.com
- WhatsApp: +213 774 137 027
- Entreprise: MediConnect Solutions

### Support Technique

- 🐛 Rapport de bugs
- 💡 Suggestions d'amélioration
- 🔧 Assistance configuration
- 📚 Documentation détaillée

---

## 🔄 Mises à Jour

**Version 2.2.1**

- ✅ Dashboard financier amélioré
- ✅ Génération de rapports optimisée
- ✅ Interface utilisateur raffinée
- ✅ Performances accrues

**Versions Antérieures**

- 2.1.3 - Modules ECG et facturation
- 2.0.0 - Refonte complète de l'interface
- 1.5.0 - Système de templates médicaux

---

## 📄 Licence

© 2024 VascCare - Développé par MediConnect Solutions  
Tous droits réservés.

---

**Tags:** Médecine Interne, Diabétologie, Pathologies Vasculaires, Échodoppler, MAPA, ECG, Gestion Médicale, Facturation Médicale
