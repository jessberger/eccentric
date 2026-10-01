'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from './language';

export function MultiSelectFilter({ label, options, selected, onChange, disabled }: { label: string; options: string[]; selected: string[]; onChange: (values: string[]) => void; disabled: boolean }) {
  const { language } = useLanguage();
  const de = language === 'de';
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(100);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => options.filter(value => value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())), [options, search]);
  const chosen = useMemo(() => new Set(selected), [selected]);
  useEffect(() => {
    if (!open) return;
    searchInput.current?.focus();
    function outside(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) setOpen(false); }
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  function toggle(value: string) { onChange(chosen.has(value) ? selected.filter(item => item !== value) : [...selected, value]); }
  return <div className="multi-filter" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={event => { if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); } }}>
    <span className="multi-filter-label">{label}</span>
    <button ref={trigger} type="button" className="multi-filter-trigger" disabled={disabled} aria-label={label} aria-expanded={open} onClick={() => { setOpen(!open); if (!open) { setSearch(''); setLimit(100); } }}><span>{selected.length ? `${selected.length} ${de ? 'ausgewählt' : 'selected'}` : de ? 'Alle Werte' : 'All values'}</span><span aria-hidden="true">▾</span></button>
    {open && <div className="multi-filter-menu" role="group" aria-label={label}>
      <input ref={searchInput} type="search" aria-label={`${label}: ${de ? 'Optionen suchen' : 'Search options'}`} placeholder={de ? 'Suchen…' : 'Search…'} value={search} onChange={event => { setSearch(event.target.value); setLimit(100); }} />
      {selected.length > 0 && <button type="button" className="multi-filter-clear" onClick={() => onChange([])}>{de ? 'Auswahl löschen' : 'Clear selection'}</button>}
      <div className="multi-filter-options" onScroll={event => { const element = event.currentTarget; if (element.scrollTop + element.clientHeight >= element.scrollHeight - 40) setLimit(current => Math.min(filtered.length, current + 100)); }}>
        {filtered.slice(0, limit).map(value => <label key={value} className="multi-filter-option"><input type="checkbox" checked={chosen.has(value)} onChange={() => toggle(value)} /><span>{value || (de ? '(Leer)' : '(Empty)')}</span></label>)}
        {filtered.length === 0 && <p>{de ? 'Keine passenden Werte.' : 'No matching values.'}</p>}
        {limit < filtered.length && <button type="button" className="multi-filter-clear" onClick={() => setLimit(current => current + 100)}>{de ? 'Weitere anzeigen' : 'Show more'}</button>}
      </div>
    </div>}
  </div>;
}
