'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ username: string; profile?: { displayName?: string; avatarUrl?: string } }>>([]);
  const [loading, setLoading] = useState(false);

  async function doSearch(q: string) {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      // Username availability check doubles as a search helper
      const data = await usersApi.publicProfile(q.trim()) as { username: string; profile?: { displayName?: string; avatarUrl?: string } };
      setResults(data ? [data] : []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      <h1 className="text-2xl font-black text-[var(--text)]">Search</h1>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
        <input
          id="search-input"
          className="lx-input pl-10"
          placeholder="Search by username…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); doSearch(e.target.value); }}
          autoFocus
        />
        {loading && (
          <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin h-4 w-4 text-lx-blue" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        )}
      </div>

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((r) => (
            <Link key={r.username} href={`/u/${r.username}`} id={`result-${r.username}`}
              className="lx-card p-4 flex items-center gap-3 hover:bg-[var(--bg-surface)] transition-colors">
              <div className="w-10 h-10 rounded-full lx-gradient-bg flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {getInitials(r.profile?.displayName ?? r.username)}
              </div>
              <div>
                <p className="font-semibold text-sm text-[var(--text)]">{r.profile?.displayName ?? r.username}</p>
                <p className="text-xs text-[var(--text-muted)]">@{r.username}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {query && !loading && results.length === 0 && (
        <div className="text-center py-12 text-[var(--text-dim)]">
          <p className="text-4xl mb-3">🔍</p>
          <p>No results for &quot;{query}&quot;</p>
        </div>
      )}

      {!query && (
        <div className="text-center py-12 text-[var(--text-dim)]">
          <p className="text-4xl mb-3">✨</p>
          <p className="text-sm">Search for learners by username</p>
        </div>
      )}
    </div>
  );
}
