'use client';

import Image from 'next/image';
import Link from 'next/link';
import handPump from '@/pics/hand_pump.png';
import drumPump from '@/pics/drum_pump.png';
import screwPump from '@/pics/screw_pump.png';
import { useLanguage } from './language';
import { usePumpSelection } from './pump-selection';

export function PumpLanding() {
  const { language } = useLanguage();
  const de = language === 'de';
  const { resetSelection } = usePumpSelection();
  return <main className="pump-landing">
    <h1>{de ? 'Pumpenauswahl' : 'Pump selection'}</h1>
    <div className="pump-category-grid">
      <Link href="/hand-pump" onNavigate={resetSelection} className="pump-category pump-category-active"><Image src={handPump} alt="" sizes="(max-width: 760px) 80vw, 28vw" /><span>Hand Pump <b aria-hidden="true">→</b></span></Link>
      <Link href="/drum-pump" onNavigate={resetSelection} className="pump-category pump-category-active"><Image src={drumPump} alt="" sizes="(max-width: 760px) 80vw, 28vw" /><span>Drum Pump <b aria-hidden="true">→</b></span></Link>
      <Link href="/select" onNavigate={resetSelection} className="pump-category pump-category-active"><Image src={screwPump} alt="" sizes="(max-width: 760px) 80vw, 28vw" /><span>Eccentric Screw Pump <b aria-hidden="true">→</b></span></Link>
    </div>
  </main>;
}
