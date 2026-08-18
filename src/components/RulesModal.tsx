import React from 'react';
import { useApp } from '../context/AppContext';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161616] border-2 border-[#e8c84a] rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 gold-glow shadow-2xl flex flex-col gap-4 text-[#f0ebe0]">
        <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
          <h2 className="text-2xl font-cinzel font-bold text-[#e8c84a] gold-text-glow flex items-center gap-2">
            📜 {language === 'ro' ? 'Regulamentul Mănăstirii' : 'Monastery Rulebook'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 text-sm font-barlow text-[#d8cfbe] leading-relaxed">
          {/* Normal Mode Section */}
          <section className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-4 space-y-2">
            <h3 className="text-lg font-cinzel font-bold text-[#e8c84a]">
              🍺 {language === 'ro' ? 'Modul Normal (Zaruri Clasice)' : 'Normal Mode (Classic Dice)'}
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm">
              <li>{language === 'ro' ? 'Arunci 2 zaruri. Fiecare aruncare non-dublă adaugă +1 gură la contorul turei curente și arunci din nou.' : 'Roll 2 dice. Every non-double adds +1 sip to turn accumulator and you roll again.'}</li>
              <li>{language === 'ro' ? 'Prag automat 25 guri (sau scăzător în Coșmar): aduni 25 guri -> GROAPĂ automat (bei tot paharul) și tura trece.' : 'Auto 25 sips threshold (or shrinking in Nightmare): hit 25 sips -> automatic CHUG IT ALL (drink full glass) and turn passes.'}</li>
              <li>{language === 'ro' ? 'Duble normale (2-2...5-5): cresc contorul de duble. Când atingi limita dificultății (Weak=1, Mediu=2, Extreme=3, Nightmare=3), bei gurile adunate.' : 'Standard doubles (2-2..5-5): increase double counter. When hitting difficulty threshold (Weak=1, Medium=2, Extreme=3, Nightmare=3), you drink all turn sips.'}</li>
              <li>{language === 'ro' ? 'Weak: orice dublă te salvează (bei gurile adunate și scapi, fără reguli speciale 1-1 / 6-6).' : 'Weak mode: any double saves you (drink accumulated sips and pass turn, ignores 1-1 / 6-6 special rules).'}</li>
              <li>{language === 'ro' ? 'Dublu 1-1 (RAI / HEAVEN): ești iertat! Bei gurile adunate în tură (fără groapă).' : 'Double 1-1 (HEAVEN): forgiven! Drink accumulated sips from turn without chugging.'}</li>
              <li>{language === 'ro' ? 'Dublu 6-6 (GROAPĂ / CHUG IT ALL): bei tot paharul dintr-o răsuflare!' : 'Double 6-6 (CHUG IT ALL): drink your full glass in one go!'}</li>
              <li>{language === 'ro' ? 'Buton PAS: poți da pas oricând, resetezi gurile din tură și tura trece (se contorizează pentru premiul Cel mai Fraier).' : 'PASS button: pass turn anytime, resets turn sips without drinking (tracked for Biggest Fool award).'}</li>
            </ul>
          </section>

          {/* Boardgame Section */}
          <section className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-4 space-y-2">
            <h3 className="text-lg font-cinzel font-bold text-[#e8c84a]">
              🎲 {language === 'ro' ? 'Modul Boardgame (Aventură pe Tablă)' : 'Boardgame Mode (Board Adventure)'}
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm">
              <li>{language === 'ro' ? 'Fiecare jucător începe cu 30 de galbeni și poziția pe START.' : 'Every player starts with 30 gold and position at START.'}</li>
              <li>{language === 'ro' ? 'Arunci 1 sau 2 zaruri și te muți pas cu pas pe cele 30 de pătrățele ale mănăstirii.' : 'Roll 1 or 2 dice and move step-by-step across the 30 monastery tiles.'}</li>
              <li>{language === 'ro' ? 'Treci peste START -> +15 galbeni bonus.' : 'Passing START -> +15 bonus gold.'}</li>
              <li>{language === 'ro' ? 'Pătrățelele de guri/groapă sunt CUMPĂRABILE prima dată când pici pe ele. Proprietarul e imun (nu bea) când pichează acolo!' : 'Sip and CHUG tiles are BUYABLE the first time someone lands on them. The owner is immune when landing there!'}</li>
              <li>{language === 'ro' ? 'Poliție 👮: stai 3 ture în închisoare sau plătești 10 galbeni / folosești o Cheie de Temniță 🔓.' : 'Police 👮: stay in jail 3 turns or pay 10 gold / use a Jail Key 🔓.'}</li>
              <li>{language === 'ro' ? 'Scrisoare de iertare 🎟️: poți folosi o scrisoare când pici pe o pătrățică de băut ca să scapi!' : 'Pardon Letter 🎟️: use a letter anytime you land on a drink tile to avoid drinking!'}</li>
              <li>{language === 'ro' ? 'Pătrățele speciale: Trivia (răspunzi corect pentru o scrisoare), Slot (rotești moaștele), 2 Adevăruri și o Minciună, Vrăjitorul Negustor, Rândul Casei, Comoară, Taxă, Safe.' : 'Special tiles: Trivia (correct answer grants Pardon Letter), Slot machine, 2 Truths & Lie, Merchant, Round on House, Treasure, Tax, Safe.'}</li>
              <li>{language === 'ro' ? 'RENUNȚĂ: poți abandona jocul (proprietățile tale devin libere).' : 'GIVE UP: abandon game anytime (freed properties).'}</li>
            </ul>
          </section>

          {/* Duel Mode Section */}
          <section className="bg-[#24170d] border border-[#e8c84a]/50 rounded-xl p-4 space-y-2">
            <h3 className="text-lg font-cinzel font-bold text-[#ffd700] flex items-center gap-2">
              ⚔️ {language === 'ro' ? 'Modul Duel 1v1 (WiFi / Cod Cameră)' : 'Duel 1v1 Mode (WiFi / Room Code)'}
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm">
              <li>{language === 'ro' ? 'Joc 1v1 între 2 telefoane prin codul camerei (sau pe același WiFi/Online). Fiecare jucător are ecran întreg și rezoluție optimă pe propriul telefon!' : '1v1 game between 2 devices using a room code (WiFi/Online). Each player gets a normal full-screen view on their own phone!'}</li>
              <li>{language === 'ro' ? '2 Submoduri: General (Cultură generală) & Fotbal. 3 Nivele de dificultate: Ușor, Mediu, Greu.' : '2 Submodes: General Knowledge & Football. 3 Difficulties: Easy, Medium, Hard.'}</li>
              <li>{language === 'ro' ? 'Faza de Reveal (5s): ambii jucători citesc întrebarea și miza rundei (guri de bere sau groapă completă).' : 'Reveal Phase (5s): both players read the question and round stake (sips or chug).'}</li>
              <li>{language === 'ro' ? 'Faza de Viteză: cele 4 variante apar simultan în timp real prin WebSocket. Primul care apasă:' : 'Speed Phase: 4 options appear simultaneously via real-time WebSocket. The first to tap:'}</li>
              <li className="pl-4">{language === 'ro' ? '✅ CORECT: este salvat instant, iar oponentul bea miza!' : '✅ CORRECT: instantly saved, and the opponent drinks the stake!'}</li>
              <li className="pl-4">{language === 'ro' ? '❌ GREȘIT: este blocat, iar oponentul are șansa să răspundă! Dacă și el greșește, beau amândoi!' : '❌ WRONG: gets locked out, opponent gets a rebound chance! If both fail, both drink!'}</li>
            </ul>
          </section>

          {/* Casino Mode Section */}
          <section className="bg-[#1e170c] border border-[#e8c84a]/70 rounded-xl p-4 space-y-2">
            <h3 className="text-lg font-cinzel font-bold text-[#f8e178] flex items-center gap-2">
              🎰 {language === 'ro' ? 'Modul Cazino (2-6 Jucători / Barbut Tavernă)' : 'Casino Mode (2-6 Players / Tavern Craps)'}
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm">
              <li>{language === 'ro' ? '2-6 jucători la aceeași masă tavernă prin cod de cameră, toți începând cu același număr de fise de aur (ex: 500).' : '2-6 players at the same tavern table with room code, everyone starts with equal gold chips (e.g., 500).'}</li>
              <li>{language === 'ro' ? 'Penalizare la fiecare rundă: 15% șansă CHUG IT ALL (groapă), altfel 1-10 guri de bere.' : 'Round penalty: 15% chance CHUG IT ALL, otherwise 1-10 sips of beer.'}</li>
              <li>{language === 'ro' ? 'Timer de pariere (25s): plasezi fise pe zarurile virtuale stil Craps:' : 'Betting Timer (25s): place chips across virtual Craps dice bets:'}</li>
              <li className="pl-4">{language === 'ro' ? '🎲 Numere individuale (1-6): Cotă 9:4 (+225% profit dacă apare numărul pe cel puțin un zar).' : '🎲 Individual Numbers (1-6): 9:4 Payout (+225% profit if number hits on at least one die).'}</li>
              <li className="pl-4">{language === 'ro' ? '⚖️ Peste 7 / Sub 7: Cotă 7:5 (+140% profit). Atenție: suma 7 pierde pe ambele!' : '⚖️ Over 7 / Under 7: 7:5 Payout (+140% profit). Sum 7 loses on both!'}</li>
              <li className="pl-4">{language === 'ro' ? '🎯 Par / Impar: Cotă 1:1 (+100% profit).' : '🎯 Even / Odd: 1:1 Payout (+100% profit).'}</li>
              <li>{language === 'ro' ? '💀 ELIMINARE: dacă soldul tău ajunge la 0, bei CHUG IT ALL (groapă) și ești eliminat!' : '💀 ELIMINATION: if your balance reaches 0, drink CHUG IT ALL and get eliminated!'}</li>
              <li>{language === 'ro' ? '🥴 BĂUTURĂ RUNDĂ: călugărul cu cel mai mic sold la finalul rundei bea penalizarea rundei!' : '🥴 ROUND DRINK: the active monk with the lowest balance drinks the round penalty!'}</li>
              <li>{language === 'ro' ? '👑 CÂȘTIGĂTOR: ultimul călugăr rămas în viață cu fise de aur la masă!' : '👑 WINNER: the last monk standing with gold chips at the table!'}</li>
            </ul>
          </section>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-[#e8c84a] text-black font-cinzel font-bold text-base hover:brightness-110 gold-glow transition-all"
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
};
