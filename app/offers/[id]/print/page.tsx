import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase';
import { offerFields, offerGroups } from '@/lib/offer-groups';
import logo from '@/pics/logo.jpg';
import { TechnicalPrintToolbar } from '@/components/technical-print-toolbar';
import './print.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'JESSBERGER | Technical specifications' };

export default async function TechnicalPrintPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ language?: string }>;
}) {
  const { id } = await params;
  const language = (await searchParams).language === 'en' ? 'en' : 'de';
  const de = language === 'de';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const supabase = await supabaseServer();
  if (!supabase) redirect('/login');
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user || auth.user.is_anonymous) redirect('/login');
  const { data, error } = await supabase.from('eski_teklifler')
    .select(offerFields.map(field => field.key).join(','))
    .eq('id', id).eq('is_active', true).maybeSingle();
  if (error) return <main className="technical-print-error" lang={language}><p role="alert">{de ? 'Das Dokument konnte nicht geladen werden. Bitte versuchen Sie es erneut.' : 'The document could not be loaded. Please try again.'}</p><a href={`/offers/${id}/print?language=${language}`}>{de ? 'Erneut versuchen' : 'Try again'}</a></main>;
  if (!data) notFound();
  const values = data as unknown as Record<string, unknown>;
  const value = (key: string) => values[key] == null || values[key] === '' ? '—' : String(values[key]);
  const title = de ? 'Technische Spezifikationen' : 'Technical specifications';
  const groups = offerGroups.filter(group => group.id !== 'customer');
  return <main className="technical-print-page" lang={language}>
    <TechnicalPrintToolbar language={language} title={`${title} - ${value('offer_no')}`} />
    <article className="technical-sheet">
      <header className="technical-letterhead">
        <div className="technical-company">
          <strong>Dr. Jessberger GmbH</strong>
          <p>{de ? 'Jägerweg 5-7, D-85521, Ottobrunn bei München' : 'Jaegerweg 5-7, D-85521, Ottobrunn, Germany'}</p>
          <div className="technical-contact"><p>{de ? 'www.jesspumpen.de' : 'www.jesspumpen.com'}</p><p>info@jesspumpen.de</p><p>+49 89 66 66 33 400</p></div>
        </div>
        <Image className="technical-logo" src={logo} alt="JESSBERGER" width={180} height={Math.round(180 * logo.height / logo.width)} unoptimized loading="eager" />
      </header>
      <h1 className="technical-title">{title}</h1>
      <dl className="technical-reference">
        <div><dt>{de ? 'An' : 'To'}</dt><dd>{value('customer_name')}</dd></div>
        <div><dt>{de ? 'Angebotsdatum' : 'Offer date'}</dt><dd>{value('offer_date')}</dd></div>
        <div><dt>{de ? 'Angebotsnummer' : 'Offer no.'}</dt><dd>{value('offer_no')}</dd></div>
      </dl>
      <div className="technical-sections">
        {groups.map(group => <section className="technical-section" key={group.id} aria-labelledby={`technical-${group.id}`}>
          <table className="technical-table">
            <caption id={`technical-${group.id}`}>{group[language]}</caption>
            <colgroup><col className="technical-label-column" /><col /></colgroup>
            <tbody>{group.fields.map(field => <tr key={field.key}><th scope="row">{field[language]}</th><td>{value(field.key)}</td></tr>)}</tbody>
          </table>
        </section>)}
      </div>
    </article>
  </main>;
}
