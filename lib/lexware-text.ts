const pumpFields = [
  ['Type', 'Typ', 'pump_type'],
  ['Pump casing', 'Pumpengehäuse', 'pump_casing'],
  ['Mechanical Seal', 'Gleitringdichtung', 'pump_shaft_sealing'],
  ['Delivery Port', 'Druckanschluss', 'delivery_port'],
  ['Rotor', 'Rotor', 'pump_rotor'],
  ['Stator', 'Stator', 'pump_stator'],
] as const;
const motorFields = [
  ['Type', 'Typ', 'motor'],
  ['Speed', 'Drehzahl', 'motor_speed'],
  ['Drive Power', 'Antriebsleistung', 'drive_power'],
  ['Voltage & Frequency', 'Spannung & Frequenz', 'voltage_frequency'],
  ['Mounting / flange / shaft', 'Bauform / Flansch / Welle', 'mounting_flange_shaft'],
  ['Protection / isolation', 'Schutzart / Isolation', 'protection_isolation'],
] as const;
export const lexwareColumns = ['offer_no', 'customer_name', ...pumpFields.map(field => field[2]), ...motorFields.map(field => field[2])];

export function createLexwareText(values: Record<string, unknown>, language: 'de' | 'en') {
  const de = language === 'de';
  const row = ([en, german, key]: readonly [string, string, string]) => `${de ? german : en}: ${values[key] == null ? '' : String(values[key])}`;
  return [
    de ? '*** TEXT für Pumpe ***' : '*** TEXT for Pump ***',
    ...pumpFields.map(row),
    de ? 'Seriennummer: ' : 'Serial number: ',
    '', '',
    de ? '*** TEXT für Motor ***' : '*** TEXT for Motor ***',
    ...motorFields.map(row),
    '',
  ].join('\r\n');
}

export function lexwareFilename(values: Record<string, unknown>) {
  const safe = (value: unknown) => String(value ?? '').replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, '-').replace(/\s+/g, ' ').trim().replace(/[. ]+$/, '');
  return `Lexware ${safe(values.offer_no) || 'unnumbered'} - ${Array.from(safe(values.customer_name)).slice(0, 110).join('') || 'Customer'}.txt`;
}
