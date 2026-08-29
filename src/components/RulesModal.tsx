import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RulesTab = 'all' | 'normal' | 'boardgame' | 'duel' | 'casino' | 'pineapple' | 'crash';

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useApp();
  const [activeTab, setActiveTab] = useState<RulesTab>('all');

  if (!isOpen) return null;

  const isRo = language === 'ro';

  return (
    <div
      onClick={onClose}
      style={{ zIndex: 99990 }}
      className="fixed inset-0 z-[99990] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14100b] border-2 border-[#e8c84a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden gold-glow shadow-2xl flex flex-col text-[#f0ebe0]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2d1e12] p-4 sm:p-5 bg-gradient-to-r from-[#1c1208] via-[#24170c] to-[#1c1208]">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl">📜</span>
            <div>
              <h2 className="text-lg sm:text-xl font-cinzel font-black text-[#ffd700] gold-text-glow">
                {isRo ? 'Regulamentul Mănăstirii' : 'Monastery Rulebook'}
              </h2>
              <p className="text-[11px] sm:text-xs text-[#d8cfbe]/80 font-barlow">
                {isRo ? 'Ghidul complet și simplu pentru toate cele 6 moduri de joc' : 'Complete & simple guide for all 6 game modes'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#ffd700] text-2xl font-bold px-2.5 py-1 rounded-lg hover:bg-black/30 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Mode Selector Filter Tabs */}
        <div className="flex items-center gap-1.5 p-2.5 bg-[#0d0905] border-b border-[#2d1e12] overflow-x-auto scrollbar-thin">
          {[
            { id: 'all', icon: '📖', labelRo: 'Toate', labelEn: 'All Modes' },
            { id: 'normal', icon: '🍺', labelRo: 'Normal', labelEn: 'Normal' },
            { id: 'boardgame', icon: '🎲', labelRo: 'Monopoly', labelEn: 'Monopoly' },
            { id: 'duel', icon: '⚔️', labelRo: 'Duel 1v1', labelEn: '1v1 Duel' },
            { id: 'casino', icon: '🎰', labelRo: 'Cazino', labelEn: 'Casino' },
            { id: 'pineapple', icon: '🍍', labelRo: 'Pineapple', labelEn: 'Pineapple' },
            { id: 'crash', icon: '🐉', labelRo: 'Crash 1v1', labelEn: '1v1 Crash' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as RulesTab)}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-cinzel font-bold whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black shadow-md font-black'
                  : 'bg-[#181109] border border-stone-800 text-stone-300 hover:text-white hover:border-[#ffd700]/40'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{isRo ? tab.labelRo : tab.labelEn}</span>
            </button>
          ))}
        </div>

        {/* Rulebook Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-sm font-barlow text-[#d8cfbe] leading-relaxed scrollbar-thin">

          {/* 1. CRASH MODE SECTION */}
          {(activeTab === 'all' || activeTab === 'crash') && (
            <section className="bg-gradient-to-br from-[#24100a] via-[#1a0c07] to-[#120804] border-2 border-red-500/70 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg shadow-red-950/30 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-500/30 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🐉</span>
                  <h3 className="text-base sm:text-lg font-cinzel font-black text-red-400">
                    {isRo ? 'Modul Dragon Crash (2 - 6 Jucători & Boți)' : 'Dragon Crash Mode (2 - 6 Players & Bots)'}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-cinzel font-bold uppercase tracking-wider">
                  <span className="px-2 py-0.5 rounded-full bg-red-900/60 border border-red-500/50 text-red-300">
                    {isRo ? '2 - 6 Jucători' : '2 - 6 Players'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-900/60 border border-amber-500/50 text-amber-300">
                    {isRo ? 'Timp Real' : 'Real-Time'}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-stone-300 italic">
                {isRo
                  ? 'Urcă pe spatele dragonului alături de până la 6 călugări și rezistă în zbor pentru un multiplicator uriaș! Ai grijă să sari la timp!'
                  : 'Mount the dragon with up to 6 monks and soar for high multipliers! Bail out before the dragon crashes into flames!'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs sm:text-sm">
                <div className="bg-[#120904]/80 p-3 rounded-xl border border-red-900/40 space-y-1.5">
                  <h4 className="font-cinzel font-bold text-amber-300 flex items-center gap-1.5">
                    <span>🚀</span>
                    <span>{isRo ? 'Cum se joacă & Decizii:' : 'How to Play & Actions:'}</span>
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-stone-300 text-[11px] sm:text-xs">
                    <li>
                      <strong>{isRo ? 'Decolarea' : 'Takeoff'}</strong>: {isRo ? 'Dragonul decolează de la x1.00 și urcă continuu în timp real (până la x100.00+).' : 'Dragon takes off at x1.00 and accelerates in real time (up to x100.00+).'}
                    </li>
                    <li>
                      <strong>{isRo ? 'Aterizare (Cash Out)' : 'Cash Out'}</strong>: {isRo ? 'Apeși butonul oricând pentru a-ți securiza multiplicatorul curent.' : 'Hit Cash Out anytime during flight to lock in your current multiplier.'}
                    </li>
                    <li>
                      <strong>{isRo ? 'Auto-Cashout ⚙️' : 'Auto-Cashout ⚙️'}</strong>: {isRo ? 'Poți seta o cotă automată (ex: x2.50) la care jocul îți dă cashout instant.' : 'Set an automated target (e.g. x2.50) to cash out automatically.'}
                    </li>
                    <li>
                      <strong>{isRo ? 'Prăbușirea 💥' : 'The Crash 💥'}</strong>: {isRo ? 'Dacă dragonul cade înainte să dai cashout, scorul tău pe rundă este 0!' : 'If dragon crashes before you cash out, your round score is 0!'}
                    </li>
                  </ul>
                </div>

                <div className="bg-[#120904]/80 p-3 rounded-xl border border-red-900/40 space-y-1.5">
                  <h4 className="font-cinzel font-bold text-red-300 flex items-center gap-1.5">
                    <span>🍺</span>
                    <span>{isRo ? 'Mize & Comparația de Puncte:' : 'Stakes & Point Comparison:'}</span>
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-stone-300 text-[11px] sm:text-xs">
                    <li>
                      <strong>{isRo ? 'Calcul Scor' : 'Score Calculation'}</strong>: {isRo ? 'Scorul tău = Miza rundei × Multiplicatorul tău de Cash Out.' : 'Your score = Round Bet × Your Cash Out Multiplier.'}
                    </li>
                    <li>
                      <strong>{isRo ? 'Comparație cu Liderul' : 'Compare to Leader'}</strong>: {isRo ? 'Pentru fiecare jucător se compară punctele cu cel care a făcut cele mai multe! Liderul bea 0 guri, iar fiecare alt jucător bea diferența de puncte.' : 'Each player compares points against the highest scorer of that round! Leader drinks 0, others drink their point difference.'}
                    </li>
                    <li>
                      <strong>{isRo ? 'Toți Prăbușiți' : 'Everyone Crashed'}</strong>: {isRo ? 'Dacă toți jucătorii dau crash dintr-o lăcomie extremă, toți beau miza rundei (sau câte 1 Groapă)!' : 'If all players crash, everyone drinks the round stake (or 1 Chug)!'}
                    </li>
                    <li>
                      <strong>{isRo ? 'Runde de Groapă 🕳️' : 'Abyss (Chug) Rounds 🕳️'}</strong>: {isRo ? 'Cine obține cel mai mare multiplicator e salvat, iar toți ceilalți beau câte o Groapă (+25 guri)!' : 'Highest multiplier is saved; all other players drink 1 Chug (+25 sips)!'}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-[#180d06] p-2.5 rounded-xl border border-amber-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🐔</span>
                  <span className="text-amber-200">
                    <strong>{isRo ? 'Easter Egg Puiul' : 'Chicken Easter Egg'}</strong>: {isRo ? 'Dacă dai Cash Out de 3 ori la rând sub x1.50, ești numit Pui de Mănăstire!' : 'Cash out 3 times in a row under x1.50 to trigger the Chicken cluck!'}
                  </span>
                </div>
                <span className="font-cinzel font-bold text-red-400 whitespace-nowrap">
                  {isRo ? '🏁 Prag Final: 30 - 100 Guri' : '🏁 Target: 30 - 100 Sips'}
                </span>
              </div>
            </section>
          )}

          {/* 2. NORMAL MODE (CLASSIC DICE) */}
          {(activeTab === 'all' || activeTab === 'normal') && (
            <section className="bg-[#1c1610] border border-[#e8c84a]/50 rounded-2xl p-4 sm:p-5 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#2d1e12] pb-2">
                <h3 className="text-base sm:text-lg font-cinzel font-bold text-[#e8c84a] flex items-center gap-2">
                  <span>🍺</span>
                  <span>{isRo ? 'Modul Normal (Zaruri Clasice de Pelerinaj)' : 'Normal Mode (Classic Pilgrimage Dice)'}</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-[10px] font-cinzel text-amber-300 font-bold">
                  2 - 8 {isRo ? 'Jucători' : 'Players'}
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-stone-300">
                <li>{isRo ? 'Arunci 2 zaruri. Orice aruncare non-dublă adaugă +1 gură la contorul turei și arunci din nou.' : 'Roll 2 dice. Non-doubles add +1 sip to turn accumulator and you roll again.'}</li>
                <li>{isRo ? 'Prag automat 25 guri (sau dinamic în Coșmar): atingi 25 guri -> GROAPĂ automat (bei tot paharul) și tura se termină.' : 'Auto 25 sips limit: hitting 25 sips triggers an automatic CHUG IT ALL and ends your turn.'}</li>
                <li>{isRo ? 'Duble normale (2-2, 3-3, 4-4, 5-5): cresc contorul de duble. Când atingi limita dificultății (Weak=1, Mediu=2, Extreme=3), bei gurile adunate.' : 'Standard doubles (2-2 to 5-5): increase doubles counter until reaching difficulty limit, then drink accumulated sips.'}</li>
                <li>{isRo ? 'Dublu 1-1 (RAI / HEAVEN): ești iertat! Bei doar gurile adunate fără groapă.' : 'Double 1-1 (HEAVEN): forgiven! Drink turn sips without chugging.'}</li>
                <li>{isRo ? 'Dublu 6-6 (GROAPĂ / CHUG): bei tot paharul dintr-o răsuflare!' : 'Double 6-6 (CHUG): drain your full glass in one go!'}</li>
                <li>{isRo ? 'Buton PAS: poți preda zarurile oricând (dar se contorizează pentru premiul Cel mai Fraier).' : 'PASS button: surrender turn safely anytime (tracked for Biggest Coward award).'}</li>
              </ul>
            </section>
          )}

          {/* 3. BOARDGAME MODE */}
          {(activeTab === 'all' || activeTab === 'boardgame') && (
            <section className="bg-[#1c1610] border border-[#e8c84a]/50 rounded-2xl p-4 sm:p-5 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#2d1e12] pb-2">
                <h3 className="text-base sm:text-lg font-cinzel font-bold text-[#e8c84a] flex items-center gap-2">
                  <span>🎲</span>
                  <span>{isRo ? 'Modul Boardgame (Aventură & Monopoly)' : 'Boardgame Mode (Monastery Monopoly)'}</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-[10px] font-cinzel text-amber-300 font-bold">
                  2 - 6 {isRo ? 'Călugări' : 'Monks'}
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-stone-300">
                <li>{isRo ? 'Toți jucătorii încep cu 30 de galbeni pe START pe noua tablă pătrată 10x10 cu 36 de pătrățele și 4 gropi simetrice.' : 'Everyone starts with 30 gold at START on the square 10x10 board with 36 tiles and 4 symmetric chugs.'}</li>
                <li>{isRo ? '5 Grupuri de Culoare: Când deții toate proprietățile dintr-un grup de culoare, chiria de bază se dublează automat!' : '5 Color Groups: Owning all properties in a color set automatically doubles the base rent!'}</li>
                <li>{isRo ? 'Construcții & Upgrades 🏠: Cu grupul complet, poți construi până la 3 Clădiri pe fiecare pătrățică pentru chirii masive de băutură, iar la Nivelul 3 proprietatea devine GROAPĂ!' : 'Buildings & Upgrades 🏠: With a complete group, build up to 3 Houses on each tile for massive rent, and at Level 3 it turns into a CHUG!'}</li>
                <li>{isRo ? 'Târg / Schimburi (Trade) 🤝: Pătrățica de Trade permite schimburi și licitații directe de galbeni, proprietăți, scrisori de iertare și chei cu oricare alt jucător!' : 'Trade & Auctions 🤝: The Trade tile enables direct asset and gold trading with any opponent!'}</li>
                <li>{isRo ? 'Treci peste START -> primești +15 galbeni bonus de la vistierie.' : 'Passing START grants +15 bonus gold from the treasury.'}</li>
                <li>{isRo ? 'Temniță 👮: stai 3 ture închis sau plătești 10 galbeni / folosești o Cheie de Temniță 🔓.' : 'Dungeon 👮: spend 3 turns locked or pay 10 gold / use a Dungeon Key 🔓.'}</li>
                <li>{isRo ? 'Scrisoare de Iertare 🎟️: te scapă instant de orice penalizare de băutură când pici pe o proprietate străină.' : 'Pardon Scroll 🎟️: cancels any drink penalty when landing on foreign tiles.'}</li>
                <li>{isRo ? 'Evenimente speciale: Trivia, Păcănele, 2 Adevăruri și 1 Minciună, Negustor Călător, Rândul Casei, Comoară, Berărie.' : 'Special tiles: Trivia questions, Slot machine, 2 Truths & 1 Lie, Wandering Merchant, House Round, Treasure, Brewery.'}</li>
              </ul>
            </section>
          )}

          {/* 4. DUEL 1v1 MODE */}
          {(activeTab === 'all' || activeTab === 'duel') && (
            <section className="bg-[#1c1610] border border-[#e8c84a]/50 rounded-2xl p-4 sm:p-5 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#2d1e12] pb-2">
                <h3 className="text-base sm:text-lg font-cinzel font-bold text-[#ffd700] flex items-center gap-2">
                  <span>⚔️</span>
                  <span>{isRo ? 'Modul Duel 1v1 (WiFi & Trivia Fulger)' : '1v1 Duel Mode (WiFi & Trivia Race)'}</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-[10px] font-cinzel text-amber-300 font-bold">
                  1v1 {isRo ? 'Telefoane' : 'Phones'}
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-stone-300">
                <li>{isRo ? 'Confruntare în timp real între 2 telefoane pe General sau Fotbal (Ușor, Mediu, Greu).' : 'Real-time 1v1 battle on General Knowledge or Football (Easy, Medium, Hard).'}</li>
                <li>{isRo ? 'Faza de Reveal (5s): ambii jucători citesc întrebarea și miza rundei (guri sau groapă completă).' : 'Reveal Phase (5s): read the question and round stake (sips or full chug).'}</li>
                <li>{isRo ? 'Faza de Viteză: variantele apar simultan. Primul care apasă:' : 'Speed Phase: options appear instantly. The first to tap:'}</li>
                <li className="pl-4">{isRo ? '✅ CORECT: ești salvat pe loc, iar adversarul bea miza!' : '✅ CORRECT: instantly saved, opponent drinks the stake!'}</li>
                <li className="pl-4">{isRo ? '❌ GREȘIT: ești blocat, iar adversarul are șansă de Rebound! Dacă greșește și el, beau amândoi!' : '❌ WRONG: locked out; opponent gets Rebound chance! If both fail, both drink!'}</li>
              </ul>
            </section>
          )}

          {/* 5. CASINO MODE */}
          {(activeTab === 'all' || activeTab === 'casino') && (
            <section className="bg-[#1c1610] border border-[#e8c84a]/50 rounded-2xl p-4 sm:p-5 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#2d1e12] pb-2">
                <h3 className="text-base sm:text-lg font-cinzel font-bold text-[#f8e178] flex items-center gap-2">
                  <span>🎰</span>
                  <span>{isRo ? 'Modul Cazino (Barbut Tavernă & Craps)' : 'Casino Mode (Tavern Dice & Craps)'}</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-[10px] font-cinzel text-amber-300 font-bold">
                  2 - 6 {isRo ? 'Jucători' : 'Players'}
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-stone-300">
                <li>{isRo ? 'Toți jucătorii încep cu fise de aur la masa de Craps. Fiecare rundă are o penalizare de băutură.' : 'Everyone starts with equal gold chips at the Craps table. Each round features a drink penalty.'}</li>
                <li>{isRo ? 'Pariuri disponibile: Numere individuale 1-6 (Cotă 9:4), Peste/Sub 7 (Cotă 7:5), Par/Impar (Cotă 1:1).' : 'Available bets: Single numbers 1-6 (9:4 payout), Over/Under 7 (7:5 payout), Even/Odd (1:1 payout).'}</li>
                <li>{isRo ? 'La finalul rundei, călugărul cu cel mai mic sold bea penalizarea rundei!' : 'At round end, the player with the lowest balance drinks the round penalty!'}</li>
                <li>{isRo ? 'Dacă soldul tău ajunge la 0, bei GROAPĂ și ești eliminat. Ultimul rămas este Campionul!' : 'If your balance hits 0, you drink a CHUG and get eliminated. Last monk standing wins!'}</li>
              </ul>
            </section>
          )}

          {/* 6. PINEAPPLE OFC MODE */}
          {(activeTab === 'all' || activeTab === 'pineapple') && (
            <section className="bg-[#1c1610] border border-[#ffd700]/60 rounded-2xl p-4 sm:p-5 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#2d1e12] pb-2">
                <h3 className="text-base sm:text-lg font-cinzel font-bold text-[#ffd700] flex items-center gap-2">
                  <span>🍍</span>
                  <span>{isRo ? 'Modul Pineapple OFC Poker (1v1 Chinezesc)' : 'Pineapple OFC Poker Mode (1v1 Chinese)'}</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-[10px] font-cinzel text-amber-300 font-bold">
                  1v1 Online / Bot
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-stone-300">
                <li>{isRo ? 'Așezi 13 cărți pe 3 rânduri: Sus (3 cărți), Mijloc (5 cărți), Jos (5 cărți).' : 'Place 13 cards across 3 rows: Top (3 cards), Middle (5 cards), Bottom (5 cards).'}</li>
                <li>{isRo ? 'Ierarhia de forță (Evită FOUL): Rândul de Jos ≥ Mijloc ≥ Sus. Dacă încalci regula, ești declarat FOUL și pierzi toate punctele!' : 'Hierarchy rule (Avoid FOUL): Bottom row ≥ Middle ≥ Top. Violating this fouls your board for 0 points!'}</li>
                <li>{isRo ? 'Runda 1: primești 5 cărți. Rundele 2-5: primești 3 cărți (pui 2 pe tablă, 1 o arunci).' : 'Round 1: get 5 cards. Rounds 2-5: get 3 cards (place 2, discard 1).'}</li>
                <li>{isRo ? '✨ Fantasy Land: Obții cel puțin QQ pe rândul de sus fără Foul -> mâna următoare primești toate cele 13 cărți deodată!' : '✨ Fantasy Land: Score QQ+ on Top without foul to receive all 13 cards at once next hand!'}</li>
                <li>{isRo ? 'Conversie: Diferența netă de puncte se înmulțește cu rata de guri (ex: 0.5 guri/pct). Cel cu scor negativ bea gurile adunate.' : 'Conversion: Point difference multiplied by sips ratio. Loser drinks accumulated sips.'}</li>
              </ul>
            </section>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0d0905] border-t border-[#2d1e12]">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ffd700] via-[#f7c844] to-[#ffd700] text-black font-cinzel font-black text-sm uppercase tracking-wider hover:brightness-110 gold-glow transition-all active:scale-98 shadow-lg"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

