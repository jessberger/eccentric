import { supabaseServer } from '@/lib/supabase';
import { createLexwareText, lexwareFilename, lexwareColumns } from '@/lib/lexware-text';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { 'Cache-Control': 'private, no-store' };
  const fail = (status: number) => Response.json({ error: 'LEXWARE_UNAVAILABLE' }, { status, headers });
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return fail(404);
  try {
    const supabase = await supabaseServer();
    if (!supabase) return fail(503);
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user || auth.user.is_anonymous) return fail(401);
    const { data, error } = await supabase.from('eski_teklifler').select(lexwareColumns.join(','))
      .eq('id', id).eq('is_active', true).maybeSingle();
    if (error) return fail(503);
    if (!data) return fail(404);
    const values = data as unknown as Record<string, unknown>;
    const language = new URL(request.url).searchParams.get('language') === 'en' ? 'en' : 'de';
    // UTF-8 BOM ensures German and other non-ASCII characters open correctly in Windows editors.
    const content = '\uFEFF' + createLexwareText(values, language);
    const filename = lexwareFilename(values);
    const encoded = encodeURIComponent(filename).replace(/['()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
    return new Response(content, { headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="Lexware.txt"; filename*=UTF-8''${encoded}` } });
  } catch { return fail(500); }
}
