import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { offerGroups } from './offer-groups';

export function technicalPdfFilename(values: Record<string, unknown>) {
  const safe = (value: unknown) => String(value ?? '').replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, '-').replace(/\s+/g, ' ').trim().replace(/[. ]+$/, '');
  // Keep the complete offer number, including revision letters.
  const number = safe(values.offer_no) || 'unnumbered';
  const customer = Array.from(safe(values.customer_name)).slice(0, 110).join('') || 'Customer';
  return `Offer ${number} - ${customer}.pdf`;
}

export async function createTechnicalPdf(values: Record<string, unknown>, language: 'de' | 'en') {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [regularBytes, boldBytes, logoBytes] = await Promise.all([
    readFile(path.join(process.cwd(), 'assets/pdf-fonts/LiberationSans-Regular.ttf')),
    readFile(path.join(process.cwd(), 'assets/pdf-fonts/LiberationSans-Bold.ttf')),
    readFile(path.join(process.cwd(), 'pics/logo.jpg')),
  ]);
  const regular = await pdf.embedFont(regularBytes, { subset: true });
  const bold = await pdf.embedFont(boldBytes, { subset: true });
  const logo = await pdf.embedJpg(logoBytes);
  const de = language === 'de';
  const title = de ? 'Technische Spezifikationen' : 'Technical specifications';
  pdf.setTitle(technicalPdfFilename(values).replace(/\.pdf$/, ''));
  pdf.setAuthor('Dr. Jessberger GmbH'); pdf.setLanguage(language);
  const ink = rgb(.12, .20, .26), muted = rgb(.31, .39, .44), blue = rgb(.14, .33, .44);
  const line = rgb(.82, .87, .90), tint = rgb(.93, .96, .97);
  const width = 595.28, height = 841.89, left = 42, right = width - 42, bottom = 58;
  let page: PDFPage;
  let y = 0;
  const value = (key: string) => values[key] == null || values[key] === '' ? '—' : String(values[key]);
  function text(value: string, x: number, baseline: number, font = regular, size = 9.5, color = ink) {
    page.drawText(value, { x, y: baseline, font, size, color });
  }
  function wrap(value: string, font: PDFFont, size: number, max: number): string[] {
    const result: string[] = [];
    for (const paragraph of value.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n')) {
      let current = '';
      // Split at whitespace where possible; long unbroken values still wrap.
      for (const token of paragraph.match(/\S+|\s+/g) ?? ['']) {
        if (font.widthOfTextAtSize(current + token, size) <= max) { current += token; continue; }
        if (current) { result.push(current); current = ''; }
        for (const char of token) {
          if (current && font.widthOfTextAtSize(current + char, size) > max) { result.push(current); current = ''; }
          current += char;
        }
      }
      result.push(current);
    }
    return result;
  }
  function addPage(first = false) {
    page = pdf.addPage([width, height]);
    page.drawImage(logo, { x: right - 132, y: height - 43 - 132 * logo.height / logo.width, width: 132, height: 132 * logo.height / logo.width });
    text('Dr. Jessberger GmbH', left, height - 51, bold, 11, blue);
    if (first) {
      text(de ? 'Jägerweg 5-7, D-85521, Ottobrunn bei München' : 'Jaegerweg 5-7, D-85521, Ottobrunn, Germany', left, height - 68, regular, 8.5);
      text(de ? 'www.jesspumpen.de' : 'www.jesspumpen.com', left, height - 92, regular, 9);
      text('info@jesspumpen.de', left, height - 105, regular, 9);
      text('+49 89 66 66 33 400', left, height - 118, regular, 9);
      y = height - 135;
    } else y = height - 83;
    page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 1.3, color: blue });
    y -= 31; text(title, left, y, bold, 20, blue); y -= 30;
  }
  function heading(label: string) {
    if (y < bottom + 60) addPage();
    page.drawRectangle({ x: left, y: y - 23, width: right - left, height: 23, color: tint });
    text(label, left + 9, y - 15, bold, 10.5, blue);
    y -= 25;
  }
  function row(label: string, content: string, section?: string) {
    const labels = wrap(label, regular, 9, 191);
    const contentLines = wrap(content, regular, 9.5, right - left - 223);
    let index = 0;
    const count = Math.max(labels.length, contentLines.length);
    // Keep normal rows together; split exceptional rows across pages without truncation.
    if (y - (count * 12 + 8) < bottom && count * 12 + 8 < 550) {
      addPage(); if (section) heading(section);
    }
    while (index < count) {
      if (y < bottom + 23) { addPage(); if (section) heading(section); }
      const take = Math.min(count - index, Math.max(1, Math.floor((y - bottom - 8) / 12)));
      for (let j = 0; j < take; j++) {
        const baseline = y - 13 - j * 12;
        if (labels[index + j]) text(labels[index + j], left + 9, baseline, regular, 9, muted);
        if (contentLines[index + j]) text(contentLines[index + j], left + 214, baseline);
      }
      y -= take * 12 + 8;
      page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: .45, color: line });
      index += take;
    }
  }
  function group(id: string) {
    const group = offerGroups.find(group => group.id === id)!;
    heading(group[language]);
    for (const field of group.fields) row(field[language], value(field.key), group[language]);
    y -= 19;
  }
  addPage(true);
  row(de ? 'An' : 'To', value('customer_name'));
  row(de ? 'Angebotsdatum' : 'Offer date', value('offer_date'));
  row(de ? 'Angebotsnummer' : 'Offer no.', value('offer_no'));
  y -= 22;
  group('medium'); group('pump');
  addPage();
  group('materials'); group('measurements'); group('motor');
  const pages = pdf.getPages();
  pages.forEach((current, index) => {
    page = current;
    page.drawLine({ start: { x: left, y: 43 }, end: { x: right, y: 43 }, thickness: .5, color: line });
    text('Dr. Jessberger GmbH', left, 28, regular, 8, muted);
    const count = `${index + 1}/${pages.length}`;
    text(count, right - regular.widthOfTextAtSize(count, 9), 28, regular, 9, muted);
  });
  return pdf.save();
}
