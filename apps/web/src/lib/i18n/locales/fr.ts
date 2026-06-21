/**
 * French (fr) locale bundle.
 * Status: complete (native speaker reviewed).
 * RTL: false
 */
import type { LocaleBundle } from './en';

const fr: LocaleBundle = {
  app: {
    name: 'Learnix',
    tagline: 'Apprenez mieux, ensemble.',
  },

  onboarding: {
    chooseLang:       'Choisissez votre langue',
    changeLangHint:   'Vous pouvez modifier cela à tout moment dans les paramètres.',
    greeting:         'Bonjour, je suis Lumi ! ✨',
    greetingSubtitle: 'Configurons votre apprentissage — ça prend 30 secondes.',
    continueBtn:      'Continuer',
    skipBtn:          'Passer',
    backBtn:          'Retour',
    step:             'Étape {current} sur {total}',
    stageTitle:       "Où en êtes-vous dans votre parcours d'apprentissage ?",
    stageSubtitle:    'Cela nous aide à trouver le bon contenu pour vous.',
    countryTitle:     'Dans quel pays êtes-vous ?',
    countrySubtitle:  'Nous adapterons le contenu à votre programme national.',
    curriculumTitle:  'Quel programme suivez-vous ?',
    levelTitle:       'Quel niveau / classe êtes-vous ?',
    subjectsTitle:    'Quelles matières étudiez-vous ?',
    subjectsSubtitle: 'Les matières principales sont présélectionnées. Ajoutez des options à votre convenance !',
    goalTitle:        "Définissez votre objectif d'apprentissage quotidien",
    goalSubtitle:     'Vous pouvez modifier cela à tout moment.',
    celebrationTitle: 'Tout est prêt ! 🎉',
    celebrationSub:   'Votre fil est maintenant adapté à vos matières.',
    startBtn:         "C'est parti !",
  },

  nav: {
    home:      'Accueil',
    explore:   'Explorer',
    learn:     'Apprendre',
    community: 'Communauté',
    profile:   'Profil',
    settings:  'Paramètres',
    logout:    'Se déconnecter',
  },

  feed: {
    forYou:    'Pour vous',
    trending:  'Tendances',
    following: 'Abonnements',
    noContent: "Rien ici pour l'instant — invitez des amis ou explorez des matières.",
    loadMore:  'Charger plus',
  },

  settings: {
    title:          'Paramètres',
    language:       'Langue',
    languageHint:   "Affecte l'interface de l'application. La langue du contenu peut différer.",
    theme:          'Thème',
    notifications:  'Notifications',
    privacy:        'Confidentialité',
    subscription:   'Abonnement et facturation',
    deleteAccount:  'Supprimer le compte',
    saveBtn:        'Enregistrer les modifications',
    savedMsg:       'Paramètres enregistrés !',
  },

  tutor: {
    placeholder:    "Demandez n'importe quoi à Lumi…",
    quotaLabel:     "Questions restantes aujourd'hui :",
    quotaExhausted: 'Vous avez utilisé toutes vos questions quotidiennes. Revenez demain ou passez à la version supérieure.',
    upgradePrompt:  'Passer à la version supérieure pour un accès IA illimité',
    citedFrom:      'Cité depuis :',
    streamError:    "Une erreur s'est produite. Veuillez réessayer.",
    liveAssessment: '⏱ Mode évaluation en direct — Lumi guidera, sans donner les réponses.',
    photoBtn:       'Joindre une photo de la question',
  },

  payments: {
    choosePlan:      'Choisissez votre formule',
    monthly:         'Mensuel',
    yearly:          'Annuel (économisez 20 %)',
    payWith:         'Payer avec',
    mpesa:           'M-Pesa',
    paypal:          'PayPal',
    enterPhone:      'Entrez le numéro M-Pesa',
    phonePlaceholder:'ex. 0712 345 678',
    confirmPayBtn:   'Confirmer le paiement',
    processing:      'Traitement en cours…',
    awaitPrompt:     'Vérifiez votre téléphone pour la demande M-Pesa.',
    successMsg:      '🎉 Paiement réussi ! Votre formule est maintenant active.',
    failedMsg:       'Échec du paiement. Veuillez réessayer.',
    cancelledMsg:    'Paiement annulé.',
  },

  auth: {
    signIn:              'Se connecter',
    signUp:              'Créer un compte',
    emailPlaceholder:    'vous@exemple.com',
    passwordPlaceholder: 'Mot de passe',
    forgotPassword:      'Mot de passe oublié ?',
    or:                  'ou',
    continueGoogle:      'Continuer avec Google',
    noAccount:           "Vous n'avez pas de compte ?",
    hasAccount:          'Vous avez déjà un compte ?',
    invalidCreds:        'E-mail ou mot de passe incorrect.',
    checkEmail:          'Vérifiez votre e-mail pour un lien de vérification.',
  },

  common: {
    cancel:    'Annuler',
    confirm:   'Confirmer',
    close:     'Fermer',
    loading:   'Chargement…',
    error:     "Une erreur s'est produite. Veuillez réessayer.",
    tryAgain:  'Réessayer',
    search:    'Rechercher',
    noResults: 'Aucun résultat trouvé.',
    yes:       'Oui',
    no:        'Non',
    save:      'Enregistrer',
    edit:      'Modifier',
    delete:    'Supprimer',
    share:     'Partager',
    report:    'Signaler',
    follow:    'Suivre',
    unfollow:  'Ne plus suivre',
    like:      "J'aime",
    comment:   'Commenter',
    send:      'Envoyer',
  },

  date: {
    today:     "Aujourd'hui",
    yesterday: 'Hier',
    daysAgo:   'il y a {n} jours',
    weeksAgo:  'il y a {n} semaines',
    monthsAgo: 'il y a {n} mois',
  },

  error: {
    notFound:      'Page introuvable',
    unauthorized:  'Vous devez vous connecter pour accéder à cette page.',
    serverError:   'Erreur serveur. Nous y travaillons.',
    networkError:  'Pas de connexion Internet. Vérifiez votre réseau.',
  },
};

export default fr;
