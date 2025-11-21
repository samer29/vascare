import React from "react";
import VascCareLogo from "../../assets/logoDrbradai.png";
import mediconnectLogo from "../../assets/MediConnect.png";

const About = () => {
  return (
    <div className="min-h-screen bg-main py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">
            À Propos de VascCare
          </h1>
          <h2 className="text-2xl font-bold text-main mb-4">V 2.2.1</h2>
          <p className="text-lg text-secondary max-w-2xl mx-auto">
            Solution médicale complète pour la médecine interne, diabétologie et
            pathologies vasculaires
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-card rounded-2xl shadow-xl p-8 mb-8">
          {/* Logos Section */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 mb-12">
            <div className="text-center">
              <img
                src={VascCareLogo}
                alt="VascCare Logo"
                className="h-32 w-32 object-contain mx-auto mb-4 drop-shadow-lg"
              />
              <h3 className="text-2xl font-bold text-primary">VascCare</h3>
              <p className="text-secondary mt-2">
                Plateforme Médicale Spécialisée
              </p>
            </div>

            <div className="hidden md:block">
              <div className="w-px h-24 bg-border"></div>
            </div>

            <div className="text-center">
              <img
                src={mediconnectLogo}
                alt="MediConnect Logo"
                className="h-32 w-32 object-contain mx-auto mb-4 drop-shadow-lg"
              />
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                MediConnect
              </h3>
              <p className="text-secondary mt-2">Créateur & Développeur</p>
            </div>
          </div>

          {/* Description Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-main mb-4">
                  🏥 À Propos de VascCare
                </h2>

                <p className="text-secondary leading-relaxed">
                  VascCare est une application web complète spécialement conçue
                  pour les{" "}
                  <strong>
                    spécialistes en médecine interne, diabétologie et
                    pathologies vasculaires
                  </strong>
                  . Cette plateforme intuitive permet une gestion optimale des
                  patients, des consultations, et des procédures médicales
                  spécifiques à ces spécialités.
                </p>
              </div>

              <div className="bg-secondary p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-primary mb-3">
                  ✨ Fonctionnalités Principales
                </h3>
                <ul className="text-secondary space-y-2">
                  <li>• Gestion complète des dossiers patients</li>
                  <li>• Consultations et suivis médicaux spécialisés</li>
                  <li>• Échographies abdominales avancées</li>
                  <li>
                    • Échodoppler vasculaire (membres inférieurs/supérieurs)
                  </li>
                  <li>• Examens thyroïdiens complets</li>
                  <li>• Électrocardiogrammes (ECG)</li>
                  <li>• Prescriptions et ordonnances médicales</li>
                  <li>• Examens complémentaires biologiques</li>
                  <li>• Gestion complète de la facturation</li>
                  <li>• Tableaux de bord et statistiques en temps réel</li>
                  <li>• Génération de rapports médicaux professionnels</li>
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-main mb-4">
                  🩺 Domaines d'Expertise
                </h2>
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 dark:text-green-400 mb-2">
                      Médecine Interne
                    </h4>
                    <p className="text-sm text-secondary">
                      Prise en charge complète des pathologies internes avec
                      suivi personnalisé
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">
                      Diabétologie
                    </h4>
                    <p className="text-sm text-secondary">
                      Gestion spécialisée des patients diabétiques avec
                      monitoring continu
                    </p>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-400 mb-2">
                      Pathologies Vasculaires
                    </h4>
                    <p className="text-sm text-secondary">
                      Diagnostic et suivi des maladies vasculaires avec
                      échodoppler
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400 mb-3">
                  📊 Fonctionnalités Avancées
                </h3>
                <div className="text-secondary space-y-2">
                  <p>
                    • <strong>Tableaux de bord interactifs</strong> avec
                    statistiques financières et médicales
                  </p>
                  <p>
                    • <strong>Gestion de facturation</strong> complète avec
                    suivi des paiements
                  </p>
                  <p>
                    • <strong>Rapports personnalisés</strong> pour chaque examen
                    spécialisé
                  </p>
                  <p>
                    • <strong>Analyses en temps réel</strong> des revenus et
                    activités
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Examens Spécialisés Section */}
          <div className="border-t border-border pt-8 mb-8">
            <h2 className="text-2xl font-bold text-main mb-6 text-center">
              🔬 Examens Spécialisés
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
                <div className="text-2xl mb-2">❤️</div>
                <h4 className="font-semibold text-main mb-2">ECG</h4>
                <p className="text-xs text-secondary">
                  Électrocardiogrammes complets avec interprétation
                </p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                <div className="text-2xl mb-2">📡</div>
                <h4 className="font-semibold text-main mb-2">Échodoppler</h4>
                <p className="text-xs text-secondary">
                  Vasculaire membres inférieurs/supérieurs
                </p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                <div className="text-2xl mb-2">🦋</div>
                <h4 className="font-semibold text-main mb-2">Thyroïde</h4>
                <p className="text-xs text-secondary">
                  Examens échographiques thyroïdiens détaillés
                </p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
                <div className="text-2xl mb-2">👁️</div>
                <h4 className="font-semibold text-main mb-2">
                  Échographie Abdominale
                </h4>
                <p className="text-xs text-secondary">
                  Examens abdominaux complets et détaillés
                </p>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-bold text-main mb-6 text-center">
              📞 Contact & Support
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="text-center p-6 bg-secondary rounded-lg">
                <div className="text-2xl mb-2">👤</div>
                <h4 className="font-semibold text-main mb-2">Samer Elouissi</h4>
                <p className="text-sm text-secondary">
                  Fondateur & Développeur Principal
                </p>
              </div>

              <div className="text-center p-6 bg-secondary rounded-lg">
                <div className="text-2xl mb-2">📧</div>
                <h4 className="font-semibold text-main mb-2">
                  Email Professionnel
                </h4>
                <a
                  href="mailto:elouissim@gmail.com"
                  className="text-primary hover:underline text-sm"
                >
                  elouissim@gmail.com
                </a>
              </div>

              <div className="text-center p-6 bg-secondary rounded-lg">
                <div className="text-2xl mb-2">📱</div>
                <h4 className="font-semibold text-main mb-2">
                  Support WhatsApp
                </h4>
                <a
                  href="https://wa.me/213774137027"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 dark:text-green-400 hover:underline text-sm"
                >
                  +213 774 137 027
                </a>
              </div>

              <div className="text-center p-6 bg-secondary rounded-lg">
                <div className="text-2xl mb-2">🏢</div>
                <h4 className="font-semibold text-main mb-2">Entreprise</h4>
                <p className="text-sm text-secondary">MediConnect Solutions</p>
                <p className="text-xs text-secondary mt-1">
                  Solutions Médicales Digitales
                </p>
              </div>
            </div>

            {/* Support Note */}
            <div className="text-center mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                💡 <strong>Support technique disponible</strong> - Assistance
                complète pour l'utilisation de l'application et les
                fonctionnalités avancées
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-secondary text-sm">
          <p>
            © {new Date().getFullYear()} VascCare - Plateforme Médicale
            Spécialisée - Développé par MediConnect.
          </p>
          <p className="mt-1 text-xs">
            Médecine Interne • Diabétologie • Pathologies Vasculaires •
            Échodoppler • MAPA • ECG
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
