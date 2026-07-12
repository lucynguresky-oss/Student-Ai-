/**
 * English (en) locale bundle — the reference locale.
 * All other bundles must have the same keys; missing keys fall back to this.
 *
 * Rule: NEVER ship a string here that was auto-translated.
 * Every key must be reviewed by a native speaker of that locale.
 */
const en = {
  // ── Meta ─────────────────────────────────────────────────────────
  app: {
    name: 'Learnix',
    tagline: 'Learn smarter, together.',
  },

  // ── Onboarding ───────────────────────────────────────────────────
  onboarding: {
    chooseLang:       'Choose your language',
    changeLangHint:   'You can change this any time in Settings.',
    greeting:         "Hi, I'm Lumi! ✨",
    greetingSubtitle: "Let's set up your learning — takes 30 seconds.",
    continueBtn:      'Continue',
    skipBtn:          'Skip',
    backBtn:          'Back',
    step:             'Step {current} of {total}',
    stageTitle:       'Where are you in your learning journey?',
    stageSubtitle:    'This helps us find the right content for you.',
    countryTitle:     'What country are you in?',
    countrySubtitle:  "We'll match content to your national curriculum.",
    curriculumTitle:  'Which curriculum do you follow?',
    levelTitle:       'What level / form / grade are you in?',
    subjectsTitle:    'What subjects are you studying?',
    subjectsSubtitle: 'Core subjects are pre-selected. Add electives as you like!',
    goalTitle:        'Set your daily learning goal',
    goalSubtitle:     'You can change this anytime.',
    celebrationTitle: 'All set! 🎉',
    celebrationSub:   'Your feed is now tuned to your subjects.',
    startBtn:         "Let's go!",
  },

  // ── Navigation ───────────────────────────────────────────────────
  nav: {
    home:      'Home',
    explore:   'Explore',
    learn:     'Learn',
    community: 'Community',
    profile:   'Profile',
    settings:  'Settings',
    logout:    'Log out',
  },

  // ── Feed / Home ──────────────────────────────────────────────────
  feed: {
    forYou:    'For You',
    trending:  'Trending',
    following: 'Following',
    noContent: 'Nothing here yet — invite friends or explore subjects.',
    loadMore:  'Load more',
  },

  // ── Settings ─────────────────────────────────────────────────────
  settings: {
    title:          'Settings',
    language:       'Language',
    languageHint:   'Affects the app UI. Content language may differ.',
    theme:          'Theme',
    notifications:  'Notifications',
    privacy:        'Privacy',
    subscription:   'Subscription & Billing',
    deleteAccount:  'Delete Account',
    saveBtn:        'Save changes',
    savedMsg:       'Settings saved!',
  },

  // ── AI Tutor ─────────────────────────────────────────────────────
  tutor: {
    placeholder:    'Ask Lumi anything…',
    quotaLabel:     'Asks left today:',
    quotaExhausted: "You've used all your daily asks. Come back tomorrow or upgrade.",
    upgradePrompt:  'Upgrade for unlimited AI access',
    citedFrom:      'Cited from:',
    streamError:    'Something went wrong. Please try again.',
    liveAssessment: '⏱ Live assessment mode — Lumi will coach, not answer.',
    photoBtn:       'Attach photo of question',
  },

  // ── Payments ─────────────────────────────────────────────────────
  payments: {
    choosePlan:     'Choose your plan',
    monthly:        'Monthly',
    yearly:         'Yearly (save 20%)',
    payWith:        'Pay with',
    mpesa:          'M-Pesa',
    paypal:         'PayPal',
    enterPhone:     'Enter M-Pesa number',
    phonePlaceholder:'e.g. 0712 345 678',
    confirmPayBtn:  'Confirm payment',
    processing:     'Processing…',
    awaitPrompt:    'Check your phone for the M-Pesa prompt.',
    successMsg:     '🎉 Payment successful! Your plan is now active.',
    failedMsg:      'Payment failed. Please try again.',
    cancelledMsg:   'Payment cancelled.',
  },

  // ── Auth ─────────────────────────────────────────────────────────
  auth: {
    signIn:           'Sign in',
    signUp:           'Create account',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'Password',
    forgotPassword:   'Forgot password?',
    or:               'or',
    continueGoogle:   'Continue with Google',
    noAccount:        "Don't have an account?",
    hasAccount:       'Already have an account?',
    invalidCreds:     'Incorrect email or password.',
    checkEmail:       'Check your email for a verification link.',
  },

  // ── Generic ──────────────────────────────────────────────────────
  common: {
    cancel:    'Cancel',
    confirm:   'Confirm',
    close:     'Close',
    loading:   'Loading…',
    error:     'Something went wrong. Please try again.',
    tryAgain:  'Try again',
    search:    'Search',
    noResults: 'No results found.',
    yes:       'Yes',
    no:        'No',
    save:      'Save',
    edit:      'Edit',
    delete:    'Delete',
    share:     'Share',
    report:    'Report',
    follow:    'Follow',
    unfollow:  'Unfollow',
    like:      'Like',
    comment:   'Comment',
    send:      'Send',
  },

  // ── Dates ─────────────────────────────────────────────────────────
  date: {
    today:     'Today',
    yesterday: 'Yesterday',
    daysAgo:   '{n} days ago',
    weeksAgo:  '{n} weeks ago',
    monthsAgo: '{n} months ago',
  },

  // ── Errors ────────────────────────────────────────────────────────
  error: {
    notFound:      'Page not found',
    unauthorized:  'You need to sign in to access this page.',
    serverError:   "Server error. We're on it.",
    networkError:  'No internet connection. Check your network.',
  },
};

export default en;
export type LocaleBundle = typeof en;
