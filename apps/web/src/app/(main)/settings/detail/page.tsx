'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useStore } from '@/store/useStore';
import { useI18n } from '@/lib/i18n';

/* ─── Dynamic Language Settings Panel ──────────────────────────────────────────
   Fetches locales from the API registry so no language is hardcoded.
   Uses the i18n hook to apply the change live (no page reload needed).
───────────────────────────────────────────────────────────────────────────── */
interface LocaleRow {
  code: string;
  englishName: string;
  nativeName: string;
  rtl: boolean;
  status: string;
}

function LanguageSettingsPanel({ onToast }: { onToast: (msg: string) => void }) {
  const { locale: currentLocale, setLocale } = useI18n();
  const [locales, setLocales] = useState<LocaleRow[]>([]);
  const [selected, setSelected] = useState(currentLocale);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/v1/taxonomy/locales?complete=true')
      .then((r) => r.json())
      .then((json) => { setLocales(json.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = locales.filter(
    (l) =>
      l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      l.englishName.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLocale(selected);
    // Also persist the selection as a cookie for SSR
    document.cookie = `learnix_locale=${selected}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    onToast(`Language updated to ${locales.find((l) => l.code === selected)?.nativeName ?? selected}`);
  };

  return (
    <form onSubmit={handleSave} style={{ padding: '0 2px' }}>
      <h2 style={{ fontWeight: 800, fontSize: 16, color: 'white', marginBottom: 6 }}>App Display Language</h2>
      <p style={{ fontSize: 12.5, color: 'var(--text2)', marginBottom: 18 }}>
        Affects the app interface. Content language may differ based on what creators have posted.
        Only fully reviewed translations are shown here.
      </p>

      {/* Search box */}
      <input
        type="search"
        placeholder="Search language…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10,
          background: 'var(--surface)', border: '1px solid var(--border)',
          color: 'white', fontSize: 13.5, marginBottom: 14, boxSizing: 'border-box',
        }}
      />

      {loading ? (
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>Loading languages…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
          {filtered.map((l) => {
            const active = l.code === selected;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => setSelected(l.code)}
                dir={l.rtl ? 'rtl' : 'ltr'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                  background: active ? 'rgba(59,130,246,0.15)' : 'var(--surface)',
                  border: `1.5px solid ${active ? '#3B82F6' : 'var(--border)'}`,
                  textAlign: l.rtl ? 'right' : 'left',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{l.nativeName}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text2)', marginTop: 2 }}>
                    {l.englishName}
                    {l.rtl && <span style={{ marginLeft: 6, fontSize: 10, color: '#F59E0B' }}>RTL</span>}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: active ? '#3B82F6' : 'var(--text2)' }}>
                  {l.code}
                </span>
                {active && <span style={{ color: '#22C55E', fontSize: 18 }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}

      <button
        type="submit"
        style={{
          width: '100%', marginTop: 20, padding: '12px 0', borderRadius: 12,
          background: 'linear-gradient(135deg, #3B82F6, #7C3AED)',
          color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
        }}
      >
        Save language preference
      </button>
    </form>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SETTINGS SUB-PAGES (Fully Functional Forms for 100% coverage)
───────────────────────────────────────────────────────────────────────────── */

type SlugType =
  | 'account'
  | 'student'
  | 'notifications'
  | 'time'
  | 'language'
  | 'help'
  | 'privacy'
  | 'payments'
  | 'about'
  | 'saved'
  | 'activity'
  | 'tablet'
  | 'content'
  | 'muted'
  | 'blocked'
  | 'status';

function SettingsDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = (searchParams.get('slug') ?? 'unknown') as SlugType;
  const { currentUser, login } = useStore();

  // Toast indicator state
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // State hooks for form fields
  // 1. Account Settings
  const [displayName, setDisplayName] = useState(currentUser?.displayName ?? '');
  const [username, setUsername] = useState(currentUser?.username ?? '');
  const [bio, setBio] = useState(currentUser?.bio ?? '');
  const [avatarSeed, setAvatarSeed] = useState(currentUser?.avatarSeed ?? 'amina');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // 2. Student Settings
  const [curriculum, setCurriculum] = useState(currentUser?.curriculum ?? 'KCSE');
  const [level, setLevel] = useState(currentUser?.level ?? 'Form 4');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    currentUser?.subjects ?? ['BIO', 'CHE', 'MAT']
  );

  // 3. Notification Settings
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [reminders, setReminders] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);

  // 4. Time Management
  const [timeLimit, setTimeLimit] = useState(60); // minutes
  const [breakReminder, setBreakReminder] = useState(true);

  // 5. Language Settings
  const [appLang, setAppLang] = useState('en');

  // 6. Help Support Form
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  const [faqOpen, setFaqOpen] = useState<Record<string, boolean>>({});

  // 7. Privacy Settings
  const [isPrivate, setIsPrivate] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [searchable, setSearchable] = useState(true);

  // 8. Tablet Mode Options
  const [splitPane, setSplitPane] = useState(true);
  const [fontSize, setFontSize] = useState('medium');
  const [autoRotate, setAutoRotate] = useState(false);

  // 9. Content Feed Preferences
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Biology',
    'Mathematics',
    'Study Hacks',
  ]);
  const [aiSuggestionsStrength, setAiSuggestionsStrength] = useState(70);

  // 10. Muted / Blocked user mocks
  const [mutedUsers, setMutedUsers] = useState([
    { id: 'm1', username: 'brian_ochieng', displayName: 'Brian Ochieng' },
    { id: 'm2', username: 'kevin_creates', displayName: 'Kevin Kimani' },
  ]);
  const [blockedUsers, setBlockedUsers] = useState([
    { id: 'b1', username: 'spammer_student1', displayName: 'Spam Account' },
  ]);

  // 11. Saved tabs
  const [savedTab, setSavedTab] = useState<'posts' | 'collections'>('posts');

  // 12. Health status
  const [serverHealth, setServerHealth] = useState<'Checking...' | 'Healthy 🟢' | 'Unavailable 🔴'>('Checking...');
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    if (slug === 'about') {
      const start = Date.now();
      fetch('http://localhost:4000/v1/healthz')
        .then((r) => {
          if (r.ok) {
            setServerHealth('Healthy 🟢');
            setLatency(Date.now() - start);
          } else {
            setServerHealth('Unavailable 🔴');
          }
        })
        .catch(() => setServerHealth('Unavailable 🔴'));
    }
  }, [slug]);

  // Handle Updates
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    login({
      ...currentUser,
      displayName,
      username,
      bio,
      avatarSeed,
    });
    triggerToast('Account profile updated successfully!');
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    login({
      ...currentUser,
      curriculum,
      level,
      subjects: selectedSubjects,
    });
    triggerToast('Student academic settings updated!');
  };

  const handleSubjectToggle = (sub: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handleSaveNotifs = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast('Notification preferences updated!');
  };

  const handleSaveTime = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast(`Daily limit set to ${timeLimit} minutes!`);
  };

  const handleSaveLang = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast(`Display language updated!`);
  };

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMsg) return;
    triggerToast('Support ticket sent! We will contact you soon.');
    setTicketSubject('');
    setTicketMsg('');
  };

  const handleSavePrivacy = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast('Privacy configurations updated!');
  };

  const handleSaveTablet = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast('Tablet interface preferences saved!');
  };

  const handleSaveContent = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast('Feed content personalization updated!');
  };

  const handleUnmute = (id: string, name: string) => {
    setMutedUsers((prev) => prev.filter((u) => u.id !== id));
    triggerToast(`Unmuted ${name}`);
  };

  const handleUnblock = (id: string, name: string) => {
    setBlockedUsers((prev) => prev.filter((u) => u.id !== id));
    triggerToast(`Unblocked ${name}`);
  };

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  // Render Sub-Page Specific Content
  const renderContent = () => {
    switch (slug) {
      case 'account':
        return (
          <form onSubmit={handleSaveAccount} style={styles.formContainer}>
            <h2 style={styles.sectionTitle}>Profile details</h2>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Avatar Seed</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <img
                  src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${avatarSeed}`}
                  alt=""
                  style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid #3B82F6' }}
                />
                <input
                  value={avatarSeed}
                  onChange={(e) => setAvatarSeed(e.target.value)}
                  placeholder="Avatar seed..."
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Display Name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Amina Wanjiku"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="amina_learns"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write your bio..."
                style={{ ...styles.input, height: 80, resize: 'none', padding: '10px 14px' }}
              />
            </div>

            <hr style={styles.divider} />
            <h2 style={styles.sectionTitle}>Security</h2>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                style={styles.input}
              />
            </div>

            <button type="submit" style={styles.saveBtn}>
              Save profile changes
            </button>
          </form>
        );

      case 'student':
        return (
          <form onSubmit={handleSaveStudent} style={styles.formContainer}>
            <h2 style={styles.sectionTitle}>Education Information</h2>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Curriculum System</label>
              <select
                value={curriculum}
                onChange={(e) => setCurriculum(e.target.value)}
                style={styles.select}
              >
                <option value="KCSE">KCSE (Kenya)</option>
                <option value="CBC">CBC (Kenya)</option>
                <option value="IGCSE">IGCSE (International)</option>
                <option value="NECTA">NECTA (Tanzania)</option>
                <option value="UNEB">UNEB (Uganda)</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Grade Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                style={styles.select}
              >
                <option value="Form 1">Form 1</option>
                <option value="Form 2">Form 2</option>
                <option value="Form 3">Form 3</option>
                <option value="Form 4">Form 4</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Active Subjects</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                {[
                  { key: 'BIO', name: '🔬 Biology' },
                  { key: 'CHE', name: '🧪 Chemistry' },
                  { key: 'PHY', name: '⚡ Physics' },
                  { key: 'MAT', name: '📐 Mathematics' },
                  { key: 'ENG', name: '📝 English' },
                ].map((sub) => {
                  const active = selectedSubjects.includes(sub.key);
                  return (
                    <button
                      key={sub.key}
                      type="button"
                      onClick={() => handleSubjectToggle(sub.key)}
                      style={{
                        ...styles.subjectCard,
                        background: active ? 'rgba(59, 130, 246, 0.12)' : 'var(--surface)',
                        border: active ? '1px solid #3B82F6' : '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontSize: 14.5, fontWeight: active ? 700 : 500, color: active ? 'white' : 'var(--text2)' }}>
                        {sub.name}
                      </span>
                      <span>{active ? '✅' : '➕'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" style={styles.saveBtn}>
              Save academic updates
            </button>
          </form>
        );

      case 'notifications':
        return (
          <form onSubmit={handleSaveNotifs} style={styles.formContainer}>
            <h2 style={styles.sectionTitle}>Channel Preferences</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { title: 'Push Notifications', desc: 'Alerts on likes, comments, and messages', state: pushNotifs, setter: setPushNotifs },
                { title: 'Email Updates', desc: 'Periodic notifications on messages and news', state: emailNotifs, setter: setEmailNotifs },
                { title: 'Study Reminders', desc: 'Daily alerts to keep your learning streak active', state: reminders, setter: setReminders },
                { title: 'Group Mentions', desc: 'Alerts when classmates tag you in discussions', state: studyReminders, setter: setStudyReminders },
              ].map((row, idx) => (
                <div key={idx} style={styles.toggleRow}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5 }}>{row.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{row.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => row.setter(!row.state)}
                    style={{
                      ...styles.toggleBg,
                      background: row.state ? '#22C55E' : 'rgba(255,255,255,0.15)',
                      justifyContent: row.state ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={styles.toggleThumb} />
                  </button>
                </div>
              ))}
            </div>

            <button type="submit" style={{ ...styles.saveBtn, marginTop: 30 }}>
              Save notification preferences
            </button>
          </form>
        );

      case 'time':
        return (
          <form onSubmit={handleSaveTime} style={styles.formContainer}>
            <h2 style={styles.sectionTitle}>Screen Limits</h2>
            <p style={{ fontSize: 13.5, color: 'var(--text2)', marginBottom: 20 }}>
              Help control your studies and take breaks to maximize focus and retention.
            </p>

            <div style={styles.inputGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={styles.label}>Daily Usage Limit</label>
                <span style={{ color: '#3B82F6', fontWeight: 700, fontSize: 14 }}>
                  {timeLimit === 120 ? '2+ hours (Max)' : `${timeLimit} mins`}
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="120"
                step="15"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#3B82F6', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)', marginTop: 6 }}>
                <span>15m</span>
                <span>30m</span>
                <span>45m</span>
                <span>1h</span>
                <span>1.5h</span>
                <span>2h+</span>
              </div>
            </div>

            <div style={styles.toggleRow}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>Break Reminders</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                  Remind you to stretch and rest eyes every 25 minutes of active learning
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBreakReminder(!breakReminder)}
                style={{
                  ...styles.toggleBg,
                  background: breakReminder ? '#22C55E' : 'rgba(255,255,255,0.15)',
                  justifyContent: breakReminder ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={styles.toggleThumb} />
              </button>
            </div>

            <button type="submit" style={{ ...styles.saveBtn, marginTop: 30 }}>
              Apply time management settings
            </button>
          </form>
        );

      case 'language':
        return <LanguageSettingsPanel onToast={triggerToast} />;

      case 'help':
        return (
          <div style={styles.formContainer}>
            <h2 style={styles.sectionTitle}>Frequently Asked Questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {[
                { q: 'How do I earn XP on Learnix?', a: 'You earn XP by completing quiz challenges, reading ebooks in the library, and answering homework questions.' },
                { q: 'What is Corbett Maths integration?', a: 'Corbett Maths provides premium mathematical video resources, structured exercises, and practice questions integrated natively into your mathematics subjects.' },
                { q: 'Can I study offline?', a: 'Yes! Ebooks under the "OER" or "Free" licenses can be cached offline on tablet or mobile devices to allow study without internet.' },
              ].map((faq, idx) => {
                const isOpen = !!faqOpen[idx];
                return (
                  <div key={idx} style={styles.faqCard}>
                    <button
                      onClick={() => setFaqOpen((prev) => ({ ...prev, [idx]: !isOpen }))}
                      style={styles.faqQuestion}
                    >
                      <span>{faq.q}</span>
                      <span>{isOpen ? '▲' : '▼'}</span>
                    </button>
                    {isOpen && <div style={styles.faqAnswer}>{faq.a}</div>}
                  </div>
                );
              })}
            </div>

            <h2 style={styles.sectionTitle}>Contact Help Desk</h2>
            <form onSubmit={handleSendTicket}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Subject</label>
                <input
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Help with quizzes, subscriptions..."
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Message</label>
                <textarea
                  value={ticketMsg}
                  onChange={(e) => setTicketMsg(e.target.value)}
                  placeholder="Provide details of your question..."
                  style={{ ...styles.input, height: 100, resize: 'none', padding: '10px 14px' }}
                  required
                />
              </div>
              <button type="submit" style={styles.saveBtn}>
                Send support ticket
              </button>
            </form>
          </div>
        );

      case 'privacy':
        return (
          <form onSubmit={handleSavePrivacy} style={styles.formContainer}>
            <h2 style={styles.sectionTitle}>Account Privacy Settings</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { title: 'Private Account', desc: 'Only approved followers can view your posts, clips, and bookmarks', state: isPrivate, setter: setIsPrivate },
                { title: 'Show Read Receipts', desc: 'Allow study group members to see when you have read messages', state: readReceipts, setter: setReadReceipts },
                { title: 'Discoverable in Search', desc: 'Allow teachers and classmates to search for your profile by name', state: searchable, setter: setSearchable },
              ].map((row, idx) => (
                <div key={idx} style={styles.toggleRow}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5 }}>{row.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{row.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => row.setter(!row.state)}
                    style={{
                      ...styles.toggleBg,
                      background: row.state ? '#22C55E' : 'rgba(255,255,255,0.15)',
                      justifyContent: row.state ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={styles.toggleThumb} />
                  </button>
                </div>
              ))}
            </div>

            <button type="submit" style={{ ...styles.saveBtn, marginTop: 30 }}>
              Update privacy configuration
            </button>
          </form>
        );

      case 'payments':
        return (
          <div style={styles.formContainer}>
            <h2 style={styles.sectionTitle}>Payment History</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { title: 'Learnix Plus Renewal', method: 'M-Pesa Express', date: 'June 01, 2026', price: 'KES 250', status: 'Completed' },
                { title: 'Learnix Plus Activation', method: 'M-Pesa Express', date: 'May 01, 2026', price: 'KES 250', status: 'Completed' },
                { title: 'Past Paper Pack', method: 'Card Payment', date: 'April 12, 2026', price: 'USD 1.99', status: 'Refunded' },
              ].map((t, idx) => (
                <div key={idx} style={styles.txCard}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{t.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text2)', marginTop: 4 }}>
                      {t.date} • {t.method}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'white' }}>{t.price}</div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        marginTop: 4,
                        color: t.status === 'Completed' ? '#22C55E' : '#EF4444',
                      }}
                    >
                      {t.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'about':
        return (
          <div style={styles.formContainer}>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 42,
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 24px rgba(124, 58, 237, 0.3)',
                }}
              >
                🎓
              </div>
              <h3 style={{ fontWeight: 800, fontSize: 18, color: 'white', marginBottom: 4 }}>Learnix</h3>
              <p style={{ fontSize: 12.5, color: 'var(--text2)' }}>Version 1.0.3 (Build 4128)</p>
            </div>

            <h2 style={styles.sectionTitle}>Backend Infrastructure</h2>
            <div style={styles.healthStats}>
              <div style={styles.statRow}>
                <span style={{ color: 'var(--text2)' }}>Database Engine</span>
                <span style={{ fontWeight: 600 }}>PostgreSQL 16 (Docker Compose)</span>
              </div>
              <div style={styles.statRow}>
                <span style={{ color: 'var(--text2)' }}>API Server Status</span>
                <span style={{ fontWeight: 700 }}>{serverHealth}</span>
              </div>
              {latency !== null && (
                <div style={styles.statRow}>
                  <span style={{ color: 'var(--text2)' }}>API Latency</span>
                  <span style={{ fontWeight: 700, color: '#22C55E' }}>{latency} ms</span>
                </div>
              )}
              <div style={styles.statRow}>
                <span style={{ color: 'var(--text2)' }}>WebSocket Protocol</span>
                <span style={{ fontWeight: 600 }}>Socket.io v4</span>
              </div>
            </div>

            <h2 style={styles.sectionTitle}>Legal & Licenses</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
              <Link href="#" style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 600 }}>Terms of Service</Link>
              <Link href="#" style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>
              <Link href="#" style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 600 }}>Open Source Attributions</Link>
            </div>
          </div>
        );

      case 'saved':
        return (
          <div style={styles.formContainer}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              <button
                onClick={() => setSavedTab('posts')}
                style={{
                  ...styles.tabBtn,
                  borderBottom: savedTab === 'posts' ? '2.5px solid #3B82F6' : '2.5px solid transparent',
                  color: savedTab === 'posts' ? 'white' : 'var(--text2)',
                }}
              >
                Saved Posts
              </button>
              <button
                onClick={() => setSavedTab('collections')}
                style={{
                  ...styles.tabBtn,
                  borderBottom: savedTab === 'collections' ? '2.5px solid #3B82F6' : '2.5px solid transparent',
                  color: savedTab === 'collections' ? 'white' : 'var(--text2)',
                }}
              >
                Collections
              </button>
            </div>

            {savedTab === 'posts' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {[
                  { title: 'Mitosis vs Meiosis diagram', subject: 'Biology', date: '2d ago' },
                  { title: 'Calculus limits revision sheet', subject: 'Mathematics', date: '3d ago' },
                  { title: 'Newtonian Laws Cheat Sheet', subject: 'Physics', date: '1w ago' },
                  { title: 'Acid & Bases test bank', subject: 'Chemistry', date: '2w ago' },
                ].map((post, idx) => (
                  <div key={idx} style={styles.savedPostCard}>
                    <div style={{ fontSize: 10, color: '#18D6C8', fontWeight: 700, textTransform: 'uppercase' }}>{post.subject}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginTop: 4, height: 40, overflow: 'hidden' }}>{post.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 8 }}>{post.date}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { name: '🧬 Bio Form 4 preparation', count: '6 items' },
                  { name: '📐 Trig identities cheat sheets', count: '4 items' },
                ].map((coll, idx) => (
                  <div key={idx} style={styles.txCard}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{coll.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{coll.count}</div>
                    </div>
                    <span>📁</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'activity':
        return (
          <div style={styles.formContainer}>
            <h2 style={styles.sectionTitle}>Weekly Study Time</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>Total Time: 5h 45m this week</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              {[
                { day: 'Mon', time: '45 mins', pct: 40 },
                { day: 'Tue', time: '1h 15m', pct: 70 },
                { day: 'Wed', time: '30 mins', pct: 30 },
                { day: 'Thu', time: '2h 15m', pct: 100 },
                { day: 'Fri', time: '1h 00m', pct: 60 },
              ].map((stat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, width: 36, color: 'var(--text2)' }}>{stat.day}</span>
                  <div style={{ flex: 1, height: 12, background: 'var(--bg)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${stat.pct}%`, background: 'linear-gradient(90deg, #3B82F6, #18D6C8)', borderRadius: 6 }} />
                  </div>
                  <span style={{ fontSize: 12, width: 60, textAlign: 'right', fontWeight: 600 }}>{stat.time}</span>
                </div>
              ))}
            </div>

            <hr style={styles.divider} />
            <h2 style={styles.sectionTitle}>Recent Log</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { event: 'Scored 100% on Cell Division Quiz', time: '2 hours ago' },
                { event: 'Commented on "MITOSIS EXPLAINED IN 30S"', time: '1 day ago' },
                { event: 'Liked Dr. Grace Muthoni\'s chemistry post', time: '2 days ago' },
              ].map((act, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'white' }}>{act.event}</span>
                  <span style={{ color: 'var(--text2)', fontSize: 11.5 }}>{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'tablet':
        return (
          <form onSubmit={handleSaveTablet} style={styles.formContainer}>
            <h2 style={styles.sectionTitle}>Tablet Interface Options</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={styles.toggleRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>Split-Pane View</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                    Show index view and chat content side-by-side on wide screens
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSplitPane(!splitPane)}
                  style={{
                    ...styles.toggleBg,
                    background: splitPane ? '#22C55E' : 'rgba(255,255,255,0.15)',
                    justifyContent: splitPane ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={styles.toggleThumb} />
                </button>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Text Font Size</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  style={styles.select}
                >
                  <option value="small">Small</option>
                  <option value="medium">Regular</option>
                  <option value="large">Large</option>
                  <option value="xlarge">Extra Large</option>
                </select>
              </div>

              <div style={styles.toggleRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>Auto-Rotate Video Clips</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                    Force clips to play in landscape automatically
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoRotate(!autoRotate)}
                  style={{
                    ...styles.toggleBg,
                    background: autoRotate ? '#22C55E' : 'rgba(255,255,255,0.15)',
                    justifyContent: autoRotate ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={styles.toggleThumb} />
                </button>
              </div>
            </div>

            <button type="submit" style={styles.saveBtn}>
              Save layout settings
            </button>
          </form>
        );

      case 'content':
        return (
          <form onSubmit={handleSaveContent} style={styles.formContainer}>
            <h2 style={styles.sectionTitle}>Content Interests</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
              Personalize recommendations and subject feeds.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              {['Biology', 'Chemistry', 'Physics', 'Mathematics', 'Study Hacks', 'Career Guide', 'Motivation'].map((interest) => {
                const active = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleInterestToggle(interest)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 999,
                      border: active ? '1px solid #3B82F6' : '1px solid var(--border)',
                      background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
                      color: active ? 'white' : 'var(--text2)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {interest} {active ? '✓' : '+'}
                  </button>
                );
              })}
            </div>

            <hr style={styles.divider} />
            <h2 style={styles.sectionTitle}>Algorithm Personalization</h2>

            <div style={styles.inputGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={styles.label}>AI Recommendations Bias</label>
                <span style={{ color: '#3B82F6', fontWeight: 700, fontSize: 14 }}>
                  {aiSuggestionsStrength}% academic
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={aiSuggestionsStrength}
                onChange={(e) => setAiSuggestionsStrength(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#3B82F6', cursor: 'pointer' }}
              />
            </div>

            <button type="submit" style={styles.saveBtn}>
              Save preferences
            </button>
          </form>
        );

      case 'muted':
        return (
          <div style={styles.formContainer}>
            <h2 style={styles.sectionTitle}>Muted Classmates</h2>
            {mutedUsers.length === 0 ? (
              <p style={{ fontSize: 13.5, color: 'var(--text2)' }}>You have no muted accounts.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {mutedUsers.map((user) => (
                  <div key={user.id} style={styles.txCard}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{user.displayName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>@{user.username}</div>
                    </div>
                    <button
                      onClick={() => handleUnmute(user.id, user.displayName)}
                      style={styles.unmuteBtn}
                    >
                      Unmute
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'blocked':
        return (
          <div style={styles.formContainer}>
            <h2 style={styles.sectionTitle}>Blocked Accounts Centre</h2>
            {blockedUsers.length === 0 ? (
              <p style={{ fontSize: 13.5, color: 'var(--text2)' }}>You have no blocked accounts.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {blockedUsers.map((user) => (
                  <div key={user.id} style={styles.txCard}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{user.displayName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>@{user.username}</div>
                    </div>
                    <button
                      onClick={() => handleUnblock(user.id, user.displayName)}
                      style={styles.unmuteBtn}
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'status':
        return (
          <div style={{ ...styles.formContainer, textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🛡️</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 8 }}>Account status is active</h2>
            <span
              style={{
                background: 'rgba(34,197,94,0.15)',
                color: '#22C55E',
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 999,
                display: 'inline-block',
                marginBottom: 20,
              }}
            >
              Good Standing 🟢
            </span>
            <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.5, maxWidth: 300, margin: '0 auto' }}>
              Your account has zero active strikes, restriction flags, or moderation locks. Thank you for making Learnix a safe and supportive study network!
            </p>
          </div>
        );

      default:
        return (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>
            <div style={{ fontSize: 14.5, color: 'var(--text2)' }}>Section not found.</div>
          </div>
        );
    }
  };

  return (
    <div style={{ paddingBottom: 100, minHeight: '100dvh', background: 'var(--bg)' }}>
      {/* Toast Alert */}
      {toast && (
        <div style={styles.toast}>
          <span>💡</span> {toast}
        </div>
      )}

      {/* Header */}
      <div className="top-bar">
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span style={{ fontWeight: 700, fontSize: 16 }}>
          {slug.charAt(0).toUpperCase() + slug.slice(1)} Settings
        </span>
        <div style={{ width: 22 }} />
      </div>

      {/* Layout Content */}
      <div style={{ padding: '20px 16px' }}>{renderContent()}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLING SHEET
// ─────────────────────────────────────────────────────────────────────────────
const styles = {
  toast: {
    position: 'fixed' as const,
    top: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(30, 41, 59, 0.95)',
    border: '1px solid rgba(59, 130, 246, 0.4)',
    color: 'white',
    padding: '12px 24px',
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 600,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backdropFilter: 'blur(8px)',
  },
  formContainer: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: 800,
    color: 'white',
    letterSpacing: 0.3,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid var(--border)',
    margin: '10px 0',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  label: {
    fontSize: 12.5,
    fontWeight: 600,
    color: 'var(--text2)',
  },
  input: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 14,
    color: 'var(--text)',
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
  },
  select: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 14,
    color: 'var(--text)',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  subjectCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    padding: '8px 0',
  },
  toggleBg: {
    width: 46,
    height: 24,
    borderRadius: 12,
    padding: 2,
    display: 'flex',
    alignItems: 'center',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  saveBtn: {
    background: 'linear-gradient(135deg, #3B82F6, #18D6C8)',
    border: 'none',
    borderRadius: 12,
    padding: '14px',
    color: 'white',
    fontWeight: 700,
    fontSize: 14.5,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.25)',
    transition: 'transform 0.15s',
    marginTop: 10,
  },
  faqCard: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  faqQuestion: {
    width: '100%',
    background: 'none',
    border: 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    color: 'white',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  faqAnswer: {
    padding: '0 16px 14px',
    fontSize: 13.5,
    color: 'var(--text2)',
    lineHeight: 1.5,
    borderTop: '1px solid rgba(255,255,255,0.02)',
    paddingTop: 10,
  },
  txCard: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthStats: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '10px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    marginBottom: 20,
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 13,
  },
  tabBtn: {
    flex: 1,
    background: 'none',
    border: 'none',
    padding: '10px 0',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'center' as const,
    transition: 'all 0.15s ease',
  },
  savedPostCard: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
  },
  unmuteBtn: {
    padding: '6px 14px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid var(--border)',
    color: 'white',
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
};

export default function SettingsSubPage() {
  return (
    <Suspense fallback={<div style={{ color: 'white', padding: 20 }}>Loading settings…</div>}>
      <SettingsDetailContent />
    </Suspense>
  );
}
