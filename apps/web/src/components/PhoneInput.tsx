'use client';

import { useState, useEffect } from 'react';
import { parsePhoneNumberFromString, getCountries, getCountryCallingCode, CountryCode } from 'libphonenumber-js';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  value: string;
  onChange: (e164: string, valid: boolean) => void;
  defaultCountry?: CountryCode;
  error?: string;
  id?: string;
}

const COUNTRY_NAMES = new Intl.DisplayNames(['en'], { type: 'region' });

function getFlag(country: string) {
  return country
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

const ALL_COUNTRIES = getCountries().map((code) => ({
  code,
  name: COUNTRY_NAMES.of(code) ?? code,
  calling: `+${getCountryCallingCode(code)}`,
  flag: getFlag(code),
})).sort((a, b) => a.name.localeCompare(b.name));

export default function PhoneInput({ value, onChange, defaultCountry = 'US', error, id }: PhoneInputProps) {
  const [country, setCountry] = useState<CountryCode>(defaultCountry);
  const [local, setLocal] = useState('');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = ALL_COUNTRIES.find((c) => c.code === country)!;
  const filtered = search
    ? ALL_COUNTRIES.filter(
        (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.calling.includes(search),
      )
    : ALL_COUNTRIES;

  useEffect(() => {
    if (!local) { onChange('', false); return; }
    const parsed = parsePhoneNumberFromString(local, country);
    if (parsed?.isValid()) {
      onChange(parsed.format('E.164'), true);
    } else {
      onChange(local, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, country]);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={id ?? 'phone'} className="text-sm font-medium text-[var(--text-muted)]">
        Phone number
      </label>
      <div className="flex gap-2">
        {/* Country selector */}
        <div className="relative">
          <button
            type="button"
            id="phone-country"
            onClick={() => setOpen((o) => !o)}
            className={cn(
              'flex items-center gap-1.5 px-3 h-[46px] rounded-xl border transition-colors whitespace-nowrap',
              'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text)] hover:border-lx-blue',
              open && 'border-lx-blue',
            )}
            aria-expanded={open}
            aria-haspopup="listbox"
          >
            <span className="text-lg">{selected.flag}</span>
            <span className="text-sm font-medium">{selected.calling}</span>
            <ChevronDown size={14} className={cn('text-[var(--text-dim)] transition-transform', open && 'rotate-180')} />
          </button>

          {open && (
            <div className="absolute z-50 top-full mt-1 left-0 w-64 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl overflow-hidden">
              <div className="p-2 border-b border-[var(--border)]">
                <div className="flex items-center gap-2 px-2">
                  <Search size={14} className="text-[var(--text-dim)]" />
                  <input
                    autoFocus
                    className="bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none w-full"
                    placeholder="Search countries…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <ul className="max-h-56 overflow-y-auto" role="listbox">
                {filtered.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={c.code === country}
                      onClick={() => { setCountry(c.code as CountryCode); setOpen(false); setSearch(''); }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[var(--bg-surface)] transition-colors text-left',
                        c.code === country && 'bg-[var(--bg-surface)] text-lx-blue',
                      )}
                    >
                      <span className="text-base">{c.flag}</span>
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-[var(--text-dim)]">{c.calling}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Number input */}
        <input
          id={id ?? 'phone'}
          type="tel"
          inputMode="tel"
          className={cn('lx-input flex-1', error && 'error')}
          placeholder="Phone number"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          autoComplete="tel-national"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
