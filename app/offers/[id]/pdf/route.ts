import { supabaseServer } from '@/lib/supabase';
import { offerFields } from '@/lib/offer-groups';
import { createTechnicalPdf, technicalPdfFilename } from '@/lib/technical-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { 'Cache-Control': 'private, no-store' };
  const fail = (status: number) => Response.json({ error: 'PDF_UNAVAILABLE' }, { status, headers });
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return fail(404);
  try {
    const supabase = await supabaseServer();
    if (!supabase) return fail(503);
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user || auth.user.is_anonymous) return fail(401);
    const { data, error } = await supabase.from('eski_teklifler').select(offerFields.map(field => field.key).join(','))
      .eq('id', id).eq('is_active', true).maybeSingle();
    if (error) return fail(503);
    if (!data) return fail(404);
    const values = data as unknown as Record<string, unknown>;
    const language = new URL(request.url).searchParams.get('language') === 'en' ? 'en' : 'de';
    const bytes = await createTechnicalPdf(values, language);
    const filename = technicalPdfFilename(values);
    const encoded = encodeURIComponent(filename).replace(/['()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
    return new Response(new Uint8Array(bytes), { headers: { ...headers, 'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Offer.pdf"; filename*=UTF-8''${encoded}` } });
  } catch { return fail(500); }
}
