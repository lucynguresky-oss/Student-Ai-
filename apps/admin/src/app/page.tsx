'use client';

import { useEffect, useState } from 'react';

const sidebarItems = [
  { icon: '📊', label: 'Overview', id: 'overview' },
  { icon: '👥', label: 'Users', id: 'users' },
  { icon: '📝', label: 'Content', id: 'content' },
  { icon: '📚', label: 'Library', id: 'library' },
  { icon: '📄', label: 'Past Papers', id: 'papers' },
  { icon: '🎬', label: 'Videos', id: 'videos' },
  { icon: '🧠', label: 'AI Usage', id: 'ai' },
  { icon: '🛡️', label: 'Moderation', id: 'moderation' },
  { icon: '💰', label: 'Payments', id: 'payments' },
  { icon: '🔔', label: 'Notifications', id: 'notifications' },
  { icon: '📐', label: 'Taxonomy', id: 'taxonomy' },
  { icon: '🚩', label: 'Feature Flags', id: 'flags' },
  { icon: '💲', label: 'Cost Dashboard', id: 'costs' },
  { icon: '⚙️', label: 'Settings', id: 'settings' },
];

const overviewStats = [
  { label: 'Daily Active Users', value: '—', change: '', icon: '👥', color: '#18D6C8' },
  { label: 'DLM/AL (min)', value: '—', change: '', icon: '📖', color: '#3B82F6' },
  { label: 'AI Queries Today', value: '—', change: '', icon: '🧠', color: '#7C3AED' },
  { label: 'Revenue (KES)', value: '—', change: '', icon: '💰', color: '#22C55E' },
  { label: 'Report Queue', value: '—', change: '', icon: '🚨', color: '#EF4444' },
  { label: 'API Status', value: '—', change: '', icon: '🟢', color: '#F59E0B' },
];

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [apiHealth, setApiHealth] = useState<string>('checking...');

  useEffect(() => {
    fetch('http://localhost:4000/v1/healthz')
      .then((r) => r.json())
      .then((d) => setApiHealth(d.data?.status || 'unknown'))
      .catch(() => setApiHealth('offline'));
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: '260px',
          minHeight: '100vh',
          borderRight: '1px solid var(--color-border)',
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          background: 'var(--color-bg)',
          zIndex: 40,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.5rem', marginBottom: '2rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--gradient-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.875rem',
              color: 'white',
            }}
          >
            LX
          </div>
          <div>
            <span className="gradient-text" style={{ fontWeight: 800, fontSize: '1rem' }}>
              Learnix
            </span>
            <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '-2px' }}>
              Admin Dashboard
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-link ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Status */}
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            fontSize: '0.75rem',
          }}
        >
          <div style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>System Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: apiHealth === 'ok' ? 'var(--color-success)' : 'var(--color-error)',
              }}
            />
            <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{apiHealth}</span>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ marginLeft: '260px', flex: 1, padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {sidebarItems.find((i) => i.id === activeSection)?.icon}{' '}
            {sidebarItems.find((i) => i.id === activeSection)?.label}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {activeSection === 'overview'
              ? 'Platform health at a glance'
              : `Manage ${activeSection} — Coming in next sprint`}
          </p>
        </div>

        {/* Overview Stats Grid */}
        {activeSection === 'overview' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            {overviewStats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                  }}
                >
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {stat.label}
                  </span>
                  <span
                    style={{
                      fontSize: '1.25rem',
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      background: `${stat.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {stat.icon}
                  </span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                  {stat.label === 'API Status' ? apiHealth : stat.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Placeholder for non-overview sections */}
        {activeSection !== 'overview' && (
          <div
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '4rem 2rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {sidebarItems.find((i) => i.id === activeSection)?.icon}
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>
              {sidebarItems.find((i) => i.id === activeSection)?.label} Management
            </h3>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0 auto' }}>
              This section will be implemented in the upcoming epics. The admin dashboard is fully scaffolded and ready for feature integration.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
