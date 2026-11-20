import React, { useState, useEffect } from 'react';
import {
  Building2,
  BedDouble,
  Store,
  Calendar,
  CheckCircle2,
  Zap,
  Plus,
  Minus,
  X,
  Share2,
  RotateCcw,
  Edit3,
  Copy,
  Check,
  Wrench,
  Home,
  Receipt,
  Info
} from 'lucide-react';

// --- SCENARIO PRESETS FOR TESTING DIFFERENT PROPERTY TYPES ---
const PRESETS = {
  pg: {
    id: 'pg',
    pillLabel: 'PG / Co-Living',
    tenantName: 'Peter',
    unitName: 'Sai PG · Single Bed 2',
    monthlyRent: 9000,
    depositHeld: 10000,
    priorDues: 0,
    defaultMoveOutDate: '2026-11-25', // Mid-month -> Card 2 shows "25 Days · ₹7,500"
    prevMeter: 1420,
    currMeter: 1465,
    meterRate: 10,
    receiptId: 'STL-102'
  },
  flat: {
    id: 'flat',
    pillLabel: '2BHK Apartment',
    tenantName: 'Rahul Sharma',
    unitName: 'Flat 402',
    monthlyRent: 22000,
    depositHeld: 50000,
    priorDues: 0,
    defaultMoveOutDate: '2026-11-30', // Last day of month -> Card 2 shows "Full Month · ₹22,000"
    prevMeter: 4120,
    currMeter: 4270,
    meterRate: 8,
    receiptId: 'STL-402'
  },
  shop: {
    id: 'shop',
    pillLabel: 'Commercial Shop',
    tenantName: 'Apex Studio',
    unitName: 'Shop G-04',
    monthlyRent: 45000,
    depositHeld: 150000,
    priorDues: 5000,
    defaultMoveOutDate: '2026-11-20', // Mid-month -> Card 2 shows "20 Days · ₹30,000"
    prevMeter: 8500,
    currMeter: 8850,
    meterRate: 12,
    receiptId: 'STL-G04'
  }
};

// Format INR cleanly (e.g., ₹1,50,000)
const formatINR = (val) => {
  const num = Math.round(Number(val) || 0);
  return `₹${num.toLocaleString('en-IN')}`;
};

// Parse YYYY-MM-DD safely and compute exact calendar days in that month
const parseDateDetails = (dateStr) => {
  if (!dateStr || !dateStr.includes('-')) {
    return {
      day: 25,
      daysInMonth: 30,
      isLastDayOfMonth: false,
      shortMonth: 'Nov',
      fullMonth: 'November',
      year: 2026
    };
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const year = y || 2026;
  const month = m || 11;
  const day = d || 1;
  const dt = new Date(year, month - 1, day);
  const daysInMonth = new Date(year, month, 0).getDate();

  return {
    day,
    daysInMonth,
    isLastDayOfMonth: day === daysInMonth,
    shortMonth: dt.toLocaleDateString('en-GB', { month: 'short' }),
    fullMonth: dt.toLocaleDateString('en-GB', { month: 'long' }),
    year
  };
};

const formatShortDate = (dateStr) => {
  const { day, shortMonth } = parseDateDetails(dateStr);
  return `${day} ${shortMonth}`;
};

const formatFullDate = (dateStr) => {
  const { day, shortMonth, year } = parseDateDetails(dateStr);
  return `${day} ${shortMonth} ${year}`;
};

export default function App() {
  // --- ACTIVE TEST PRESET ---
  const [activePresetId, setActivePresetId] = useState('pg');
  const preset = PRESETS[activePresetId];

  // --- TOP MODE TABS: 'now' | 'future' ---
  const [activeTab, setActiveTab] = useState('now');

  // --- COMPLETION SCREEN STATE ---
  const [isCompleted, setIsCompleted] = useState(false);

  // --- NOTICE GIVEN (FUTURE EXIT) STATE ---
  const [futureExitDate, setFutureExitDate] = useState('2026-12-05');
  const [isNoticeSaved, setIsNoticeSaved] = useState(false);

  // --- MOVE OUT NOW: DATE & CURRENT MONTH RENT (2-CARD STATE) ---
  const [moveOutDate, setMoveOutDate] = useState(PRESETS.pg.defaultMoveOutDate);
  const [rentCard, setRentCard] = useState('stay'); // 'paid' (Card 1) | 'stay' (Card 2)
  const [isRentOverridden, setIsRentOverridden] = useState(false);
  const [customRentAmount, setCustomRentAmount] = useState(7500);

  // --- PRIOR DUES & EDITABLE DEPOSIT ---
  const [priorDues, setPriorDues] = useState(0);
  const [showPriorDuesInput, setShowPriorDuesInput] = useState(false);
  const [depositHeld, setDepositHeld] = useState(PRESETS.pg.depositHeld);

  // --- ELECTRICITY / UTILITIES ---
  const [electricityAmount, setElectricityAmount] = useState(450);
  const [showMeterCalc, setShowMeterCalc] = useState(false);
  const [prevMeter, setPrevMeter] = useState(1420);
  const [currMeter, setCurrMeter] = useState(1465);
  const [meterRate, setMeterRate] = useState(10);

  // --- OPTIONAL CHARGES & DISCOUNTS (COLLAPSED BY DEFAULT) ---
  const [showChargeDrawer, setShowChargeDrawer] = useState(false);
  const [showDiscountDrawer, setShowDiscountDrawer] = useState(false);
  const [extraCharges, setExtraCharges] = useState([]); // { id, label, amount }
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountNote, setDiscountNote] = useState('');

  // Draft inputs for custom charge / discount
  const [customChargeName, setCustomChargeName] = useState('');
  const [customChargeVal, setCustomChargeVal] = useState('');
  const [draftDiscountVal, setDraftDiscountVal] = useState('');
  const [draftDiscountNote, setDraftDiscountNote] = useState('');

  // --- SETTLEMENT STATUS STATE ---
  const [settlementTiming, setSettlementTiming] = useState('now'); // 'now' | 'later'
  const [settledAmountInput, setSettledAmountInput] = useState(0);
  const [paymentMode, setPaymentMode] = useState('UPI'); // 'UPI' | 'Cash' | 'Bank'
  const [paymentNote, setPaymentNote] = useState('');

  // --- POST-SETTLEMENT UNIT STATUS ---
  const [unitStatus, setUnitStatus] = useState('available'); // 'available' | 'repair'

  // Load a property preset cleanly
  const loadPreset = (key) => {
    const p = PRESETS[key];
    setActivePresetId(key);
    setActiveTab('now');
    setIsCompleted(false);

    // Future notice reset
    setFutureExitDate('2026-12-05');
    setIsNoticeSaved(false);

    // Move out now reset
    setMoveOutDate(p.defaultMoveOutDate);
    setRentCard('stay');
    setIsRentOverridden(false);

    const details = parseDateDetails(p.defaultMoveOutDate);
    const initialStayRent = details.isLastDayOfMonth
      ? p.monthlyRent
      : Math.round((p.monthlyRent / details.daysInMonth) * details.day);
    setCustomRentAmount(initialStayRent);

    setPriorDues(p.priorDues);
    setShowPriorDuesInput(p.priorDues > 0);
    setDepositHeld(p.depositHeld);

    setPrevMeter(p.prevMeter);
    setCurrMeter(p.currMeter);
    setMeterRate(p.meterRate);
    const units = Math.max(0, p.currMeter - p.prevMeter);
    setElectricityAmount(units * p.meterRate);
    setShowMeterCalc(false);

    setExtraCharges([]);
    setDiscountAmount(0);
    setDiscountNote('');
    setShowChargeDrawer(false);
    setShowDiscountDrawer(false);
    setCustomChargeName('');
    setCustomChargeVal('');
    setDraftDiscountVal('');
    setDraftDiscountNote('');

    setSettlementTiming('now');
    setPaymentMode('UPI');
    setPaymentNote('');
    setUnitStatus('available');
  };

  useEffect(() => {
    loadPreset('pg');
  }, []);

  // --- LIVE RENT & DATE CALCULATIONS ---
  const dateInfo = parseDateDetails(moveOutDate);
  const stayDays = dateInfo.day;
  const daysInMonth = dateInfo.daysInMonth;
  const isLastDayOfMonth = dateInfo.isLastDayOfMonth;

  const dailyRate = preset.monthlyRent / daysInMonth;
  const autoStayRent = isLastDayOfMonth
    ? preset.monthlyRent
    : Math.round(dailyRate * stayDays);

  const activeCard2Rent = isRentOverridden
    ? Math.max(0, Number(customRentAmount) || 0)
    : autoStayRent;

  const selectedRent = rentCard === 'paid' ? 0 : activeCard2Rent;

  // --- LIVE LEDGER TOTALS ---
  const safePriorDues = Math.max(0, Number(priorDues) || 0);
  const safeElectricity = Math.max(0, Number(electricityAmount) || 0);
  const extraChargesSum = extraCharges.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const safeDiscount = Math.max(0, Number(discountAmount) || 0);
  const safeDeposit = Math.max(0, Number(depositHeld) || 0);

  const rawCharges = selectedRent + safePriorDues + safeElectricity + extraChargesSum;
  const totalCharges = Math.max(0, rawCharges - safeDiscount);

  const netBalance = safeDeposit - totalCharges;
  const isRefund = netBalance > 0;
  const isPayable = netBalance < 0;
  const isZero = netBalance === 0;
  const netAbs = Math.abs(netBalance);

  // Sync settled input when net amount updates
  useEffect(() => {
    setSettledAmountInput(netAbs);
  }, [netAbs]);

  const safeSettledInput = Math.max(0, Number(settledAmountInput) || 0);
  const remainingPending =
    settlementTiming === 'later' ? netAbs : Math.max(0, netAbs - safeSettledInput);
  const isPartial = settlementTiming === 'now' && netAbs > 0 && safeSettledInput < netAbs;

  // --- METER CALCULATOR HANDLERS ---
  const unitsConsumed = Math.max(0, (Number(currMeter) || 0) - (Number(prevMeter) || 0));

  const handleMeterChange = (field, rawVal) => {
    const val = Math.max(0, Number(rawVal) || 0);
    const nextPrev = field === 'prev' ? val : Number(prevMeter) || 0;
    const nextCurr = field === 'curr' ? val : Number(currMeter) || 0;
    const nextRate = field === 'rate' ? val : Number(meterRate) || 0;

    if (field === 'prev') setPrevMeter(val);
    if (field === 'curr') setCurrMeter(val);
    if (field === 'rate') setMeterRate(val);

    const units = Math.max(0, nextCurr - nextPrev);
    setElectricityAmount(Math.round(units * nextRate));
  };

  // --- EXTRA CHARGES & DISCOUNTS ---
  const addQuickCharge = (label, amount) => {
    setExtraCharges((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, label, amount }
    ]);
  };

  const handleAddCustomCharge = (e) => {
    e.preventDefault();
    const amt = Number(customChargeVal);
    if (!customChargeName.trim() || isNaN(amt) || amt <= 0) return;
    addQuickCharge(customChargeName.trim(), Math.round(amt));
    setCustomChargeName('');
    setCustomChargeVal('');
    setShowChargeDrawer(false);
  };

  const removeCharge = (id) => {
    setExtraCharges((prev) => prev.filter((item) => item.id !== id));
  };

  const handleApplyDiscount = (e) => {
    e.preventDefault();
    const amt = Number(draftDiscountVal);
    if (isNaN(amt) || amt <= 0) return;
    setDiscountAmount(Math.round(amt));
    setDiscountNote(draftDiscountNote.trim() || 'Discount / Waiver');
    setDraftDiscountVal('');
    setDraftDiscountNote('');
    setShowDiscountDrawer(false);
  };

  const clearDiscount = () => {
    setDiscountAmount(0);
    setDiscountNote('');
  };

  const renderPresetIcon = (id) => {
    if (id === 'pg') return <BedDouble className="w-3.5 h-3.5" />;
    if (id === 'flat') return <Building2 className="w-3.5 h-3.5" />;
    return <Store className="w-3.5 h-3.5" />;
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-12">
      {/* ===================================================================== */}
      {/* 1. TOP SCENARIO SWITCHER BAR                                          */}
      {/* ===================================================================== */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 border-b border-slate-800">
        <div className="max-w-md mx-auto px-3 py-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Test Property Preset
            </span>
            <span className="text-[11px] text-slate-400">
              Deposit: <strong className="text-emerald-400">{formatINR(preset.depositHeld)}</strong>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {Object.values(PRESETS).map((item) => {
              const active = activePresetId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => loadPreset(item.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {renderPresetIcon(item.id)}
                  <span className="truncate">{item.pillLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. MOBILE-FIRST CONTAINER (max-w-md mx-auto)                          */}
      {/* ===================================================================== */}
      <main className="max-w-md mx-auto px-3 pt-4 space-y-3.5">
        {/* =================================================================== */}
        {/* 4. POST-SETTLEMENT COMPLETION SCREEN                                */}
        {/* =================================================================== */}
        {isCompleted ? (
          <div className="space-y-3.5">
            {/* Completion Header */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Move-Out Completed
                    </span>
                    <h1 className="text-base font-bold text-slate-900 mt-1">
                      {preset.tenantName} · {preset.unitName}
                    </h1>
                    <p className="text-xs text-slate-500">
                      Exited on {formatFullDate(moveOutDate)} · Tenancy closed
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCompleted(false)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Settlement (24h)
                </button>
              </div>
            </section>

            {/* Unit Status After Exit (Placed AFTER all settlements are done) */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900">Unit Status After Exit</h2>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    unitStatus === 'available'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {unitStatus === 'available'
                    ? 'Ready for Next Tenant'
                    : 'Listing Held Temporarily'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setUnitStatus('available')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    unitStatus === 'available'
                      ? 'border-emerald-500 bg-emerald-50/60'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Home
                      className={`w-4 h-4 ${
                        unitStatus === 'available' ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    />
                    {unitStatus === 'available' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-900">Available to Rent</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Ready for next tenant</div>
                </button>

                <button
                  type="button"
                  onClick={() => setUnitStatus('repair')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    unitStatus === 'repair'
                      ? 'border-amber-500 bg-amber-50/70'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Wrench
                      className={`w-4 h-4 ${
                        unitStatus === 'repair' ? 'text-amber-600' : 'text-slate-400'
                      }`}
                    />
                    {unitStatus === 'repair' && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900">
                        Hold
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-900">Needs Painting / Repair</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Hold listing temporarily</div>
                </button>
              </div>
            </section>

            {/* Itemized Move-Out Settlement Slip */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Move-Out Settlement Slip
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">{preset.receiptId}</span>
              </div>

              <div className="p-4 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>
                    {dateInfo.fullMonth} Rent (
                    {rentCard === 'paid'
                      ? 'Already Paid'
                      : isLastDayOfMonth
                      ? 'Full Month'
                      : `${stayDays} Days`}
                    )
                  </span>
                  <span className="font-semibold text-slate-900">{formatINR(selectedRent)}</span>
                </div>

                {safePriorDues > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Prior Dues</span>
                    <span className="font-semibold text-slate-900">
                      {formatINR(safePriorDues)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Electricity / Utilities</span>
                  <span className="font-semibold text-slate-900">
                    {formatINR(safeElectricity)}
                  </span>
                </div>

                {extraCharges.map((item) => (
                  <div key={item.id} className="flex justify-between text-slate-600">
                    <span>+ {item.label}</span>
                    <span className="font-semibold text-slate-900">{formatINR(item.amount)}</span>
                  </div>
                ))}

                {safeDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>− {discountNote}</span>
                    <span className="font-semibold">-{formatINR(safeDiscount)}</span>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                  <span>Total Charges</span>
                  <span>{formatINR(totalCharges)}</span>
                </div>

                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Less: Security Deposit Held</span>
                  <span>- {formatINR(safeDeposit)}</span>
                </div>

                {/* Highlighted Net Result */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between mt-1 ${
                    isZero
                      ? 'bg-slate-100 border-slate-200 text-slate-900'
                      : isRefund
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}
                >
                  <span className="font-bold">
                    {isZero
                      ? 'All Settled · ₹0 Balance'
                      : isRefund
                      ? 'You Refund Tenant'
                      : 'Tenant Pays You'}
                  </span>
                  <span className="text-lg font-extrabold">{formatINR(netAbs)}</span>
                </div>

                {/* Payment / Pending Breakdown */}
                {!isZero && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        {isRefund ? 'Refunded Now:' : 'Received Now:'}
                      </span>
                      <span className="font-bold text-slate-900">
                        {settlementTiming === 'later'
                          ? '₹0 (Settle Later)'
                          : `${formatINR(safeSettledInput)} via ${paymentMode}`}
                      </span>
                    </div>
                    {paymentNote && settlementTiming === 'now' && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Note / Ref:</span>
                        <span className="font-medium text-slate-700">{paymentNote}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Remaining Pending:</span>
                      <span
                        className={`font-bold ${
                          remainingPending > 0 ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {formatINR(remainingPending)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => loadPreset(activePresetId)}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Demo
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* =============================================================== */}
            {/* HEADER CARD WITH TENANT & 2 MODE TABS                           */}
            {/* =============================================================== */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Tenant Move-Out
                  </span>
                  <h1 className="text-base font-bold text-slate-900">
                    {preset.tenantName} · {preset.unitName}
                  </h1>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 block">Monthly Rent</span>
                  <span className="text-sm font-bold text-slate-800">
                    {formatINR(preset.monthlyRent)}
                  </span>
                </div>
              </div>

              {/* Two Mode Tabs */}
              <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('now')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'now'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Move Out Now
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('future')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'future'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Notice Given (Future Exit)
                </button>
              </div>
            </section>

            {/* =============================================================== */}
            {/* TAB 2: NOTICE GIVEN (FUTURE EXIT)                               */}
            {/* =============================================================== */}
            {activeTab === 'future' && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
                {isNoticeSaved ? (
                  <div className="space-y-3.5">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex items-start gap-2.5">
                      <Calendar className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">
                          Future Exit Logged
                        </span>
                        <h2 className="text-sm font-bold text-slate-900 mt-0.5">
                          {preset.unitName} · Available from {formatShortDate(futureExitDate)}
                        </h2>
                        <p className="text-xs text-slate-600 mt-1">
                          Rent and tenancy remain active until {formatFullDate(futureExitDate)}.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsNoticeSaved(false)}
                        className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 text-xs font-bold transition-colors"
                      >
                        Change Date
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMoveOutDate(futureExitDate);
                          setActiveTab('now');
                        }}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                      >
                        Proceed to Final Move-Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Expected Move-Out Date
                      </label>
                      <input
                        type="date"
                        value={futureExitDate}
                        onChange={(e) => setFutureExitDate(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <p className="text-xs text-slate-500 flex items-start gap-1.5">
                      <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        Unit will display &ldquo;Available from {formatShortDate(futureExitDate)}
                        &rdquo; while keeping rent active until actual move-out.
                      </span>
                    </p>

                    <button
                      type="button"
                      onClick={() => setIsNoticeSaved(true)}
                      className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xs transition-colors"
                    >
                      Save Expected Exit Date
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* =============================================================== */}
            {/* TAB 1: MOVE OUT NOW (STREAMLINED FINANCIAL FLOW)                */}
            {/* =============================================================== */}
            {activeTab === 'now' && (
              <div className="space-y-3.5">
                {/* Move-Out Date Row */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-xs px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <label
                      htmlFor="moveOutDateInput"
                      className="text-xs font-bold text-slate-800 block"
                    >
                      Move-Out Date
                    </label>
                    <span className="text-[11px] font-semibold text-indigo-600">
                      {isLastDayOfMonth
                        ? `Last day of ${dateInfo.shortMonth} (${daysInMonth} days)`
                        : `${stayDays} of ${daysInMonth} days in ${dateInfo.shortMonth}`}
                    </span>
                  </div>
                  <input
                    id="moveOutDateInput"
                    type="date"
                    value={moveOutDate}
                    onChange={(e) => {
                      setMoveOutDate(e.target.value);
                      setIsRentOverridden(false);
                    }}
                    className="px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </section>

                {/* =========================================================== */}
                {/* SECTION 1: FINAL BILL & DEPOSIT CALCULATION                 */}
                {/* =========================================================== */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      1. Final Bill & Deposit Calculation
                    </h2>
                    {!showPriorDuesInput && safePriorDues === 0 && (
                      <button
                        type="button"
                        onClick={() => setShowPriorDuesInput(true)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        + Prior Dues
                      </button>
                    )}
                  </div>

                  {/* CRITICAL UI REQUIREMENT: EXACTLY TWO SIDE-BY-SIDE CARDS */}
                  <div className="space-y-2">
                    {/* Header Row: "[Month Name] Rent" on left, active amount in bold on right */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {dateInfo.fullMonth} Rent
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {formatINR(selectedRent)}
                      </span>
                    </div>

                    {/* Grid of 2 Cards (NEVER 3 cards) */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Card 1: Already Paid */}
                      <button
                        type="button"
                        onClick={() => setRentCard('paid')}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          rentCard === 'paid'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <span className="text-xs font-bold block">Already Paid</span>
                        <span
                          className={`text-sm font-extrabold block mt-0.5 ${
                            rentCard === 'paid' ? 'text-indigo-100' : 'text-slate-900'
                          }`}
                        >
                          ₹0
                        </span>
                      </button>

                      {/* Card 2: Dynamic Single Card ("[X] Days" mid-month OR "Full Month" on last day) */}
                      <button
                        type="button"
                        onClick={() => setRentCard('stay')}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          rentCard === 'stay'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <span className="text-xs font-bold block">
                          {isLastDayOfMonth ? 'Full Month' : `${stayDays} Days`}
                        </span>
                        <span
                          className={`text-sm font-extrabold block mt-0.5 ${
                            rentCard === 'stay' ? 'text-indigo-100' : 'text-slate-900'
                          }`}
                        >
                          {formatINR(activeCard2Rent)}
                        </span>
                      </button>
                    </div>

                    {/* Subtle Compact Caption Below the 2 Cards when Card 2 is selected */}
                    {rentCard === 'stay' && (
                      <div className="space-y-2 pt-0.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                          <span>
                            {isLastDayOfMonth
                              ? `Full month · ${daysInMonth} days`
                              : `${stayDays} of ${daysInMonth} days · ${formatINR(dailyRate)}/day`}
                          </span>
                          {!isRentOverridden ? (
                            <button
                              type="button"
                              onClick={() => {
                                setCustomRentAmount(autoStayRent);
                                setIsRentOverridden(true);
                              }}
                              className="font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                              Override ₹
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIsRentOverridden(false)}
                              className="font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                              Reset auto
                            </button>
                          )}
                        </div>

                        {/* Custom Rent Override Input (only shown when owner clicks "Override ₹") */}
                        {isRentOverridden && (
                          <div className="flex items-center justify-between gap-2 bg-indigo-50/70 border border-indigo-200 rounded-xl px-3 py-2">
                            <span className="text-xs font-semibold text-indigo-900">
                              Custom {dateInfo.shortMonth} Rent
                            </span>
                            <div className="relative w-32">
                              <span className="absolute left-3 top-1.5 text-xs font-bold text-slate-500">
                                ₹
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={customRentAmount}
                                onChange={(e) => setCustomRentAmount(e.target.value)}
                                className="w-full pl-6 pr-2.5 py-1 text-xs font-bold text-right bg-white border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Optional Prior Dues Row */}
                  {(safePriorDues > 0 || showPriorDuesInput) && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <label className="text-xs font-bold text-slate-800">Prior Dues</label>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={priorDues}
                          onChange={(e) => setPriorDues(e.target.value)}
                          className="w-full pl-6 pr-2.5 py-1.5 text-sm font-bold text-right border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Electricity / Utilities Row + Collapsible Calc by Meter */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800">
                          Electricity / Utilities
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowMeterCalc((v) => !v)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-colors ${
                            showMeterCalc
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <Zap className="w-3 h-3 text-amber-600" />
                          Calc by Meter
                        </button>
                      </div>

                      <div className="relative w-28 shrink-0">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-500">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={electricityAmount}
                          onChange={(e) => setElectricityAmount(e.target.value)}
                          className="w-full pl-6 pr-2.5 py-1.5 text-sm font-bold text-right border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Collapsible Meter Calculator */}
                    {showMeterCalc && (
                      <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                              Prev Reading
                            </label>
                            <input
                              type="number"
                              value={prevMeter}
                              onChange={(e) => handleMeterChange('prev', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                              Curr Reading
                            </label>
                            <input
                              type="number"
                              value={currMeter}
                              onChange={(e) => handleMeterChange('curr', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                              Rate / Unit (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={meterRate}
                              onChange={(e) => handleMeterChange('rate', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                            />
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-amber-950 flex items-center justify-between pt-1 border-t border-amber-200/70">
                          <span>
                            {unitsConsumed} units × ₹{meterRate}
                          </span>
                          <span>= {formatINR(safeElectricity)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Collapsible Optional Adjustments */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setShowChargeDrawer((v) => !v);
                          setShowDiscountDrawer(false);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Charge / Deduction
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowDiscountDrawer((v) => !v);
                          setShowChargeDrawer(false);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                        Add Discount / Waiver
                      </button>
                    </div>

                    {/* Add Charge Drawer */}
                    {showChargeDrawer && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: 'Cleaning', amount: 500 },
                            { label: 'Painting', amount: 2000 },
                            { label: 'Damage', amount: 1000 }
                          ].map((chip) => (
                            <button
                              key={chip.label}
                              type="button"
                              onClick={() => addQuickCharge(chip.label, chip.amount)}
                              className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-indigo-400 text-xs font-semibold text-slate-800"
                            >
                              + {chip.label} {formatINR(chip.amount)}
                            </button>
                          ))}
                        </div>

                        <form onSubmit={handleAddCustomCharge} className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Custom label"
                            value={customChargeName}
                            onChange={(e) => setCustomChargeName(e.target.value)}
                            className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                          />
                          <input
                            type="number"
                            min="1"
                            placeholder="₹"
                            value={customChargeVal}
                            onChange={(e) => setCustomChargeVal(e.target.value)}
                            className="w-20 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                          >
                            Add
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Add Discount / Waiver Drawer */}
                    {showDiscountDrawer && (
                      <form
                        onSubmit={handleApplyDiscount}
                        className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex gap-1.5"
                      >
                        <input
                          type="text"
                          placeholder="Reason (optional)"
                          value={draftDiscountNote}
                          onChange={(e) => setDraftDiscountNote(e.target.value)}
                          className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                        />
                        <input
                          type="number"
                          min="1"
                          placeholder="₹ Off"
                          value={draftDiscountVal}
                          onChange={(e) => setDraftDiscountVal(e.target.value)}
                          className="w-24 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                        >
                          Apply
                        </button>
                      </form>
                    )}

                    {/* Removable Rows for Added Charges & Discounts */}
                    {(extraCharges.length > 0 || safeDiscount > 0) && (
                      <div className="space-y-1.5">
                        {extraCharges.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                          >
                            <span className="font-medium text-slate-800">+ {item.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">
                                {formatINR(item.amount)}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeCharge(item.id)}
                                className="text-slate-400 hover:text-rose-600 p-0.5"
                                aria-label="Remove charge"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {safeDiscount > 0 && (
                          <div className="flex items-center justify-between bg-emerald-50/70 px-3 py-2 rounded-xl border border-emerald-200 text-xs">
                            <span className="font-medium text-emerald-800">
                              − {discountNote}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-emerald-700">
                                -{formatINR(safeDiscount)}
                              </span>
                              <button
                                type="button"
                                onClick={clearDiscount}
                                className="text-emerald-600 hover:text-rose-600 p-0.5"
                                aria-label="Remove discount"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Live Calculation Summary Box */}
                  <div className="pt-3 border-t border-slate-200 space-y-2.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>Total Charges</span>
                      <span>{formatINR(totalCharges)}</span>
                    </div>

                    {/* Editable Less: Security Deposit Held */}
                    <div className="flex items-center justify-between gap-2 text-xs font-bold text-emerald-700">
                      <span>Less: Security Deposit Held</span>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1.5 text-xs font-bold text-emerald-700">
                          - ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={depositHeld}
                          onChange={(e) => setDepositHeld(e.target.value)}
                          className="w-full pl-8 pr-2.5 py-1 text-xs font-bold text-right text-emerald-800 bg-emerald-50/60 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Dynamic Color-Coded Net Result Banner */}
                    <div
                      className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-colors ${
                        isZero
                          ? 'bg-slate-100 border-slate-300 text-slate-900'
                          : isRefund
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                          : 'bg-amber-50 border-amber-400 text-amber-950'
                      }`}
                    >
                      <div>
                        <span
                          className={`text-xs font-extrabold uppercase tracking-wider block ${
                            isZero
                              ? 'text-slate-600'
                              : isRefund
                              ? 'text-emerald-700'
                              : 'text-amber-800'
                          }`}
                        >
                          {isZero
                            ? 'All Settled · ₹0 Balance'
                            : isRefund
                            ? 'You Refund Tenant'
                            : 'Tenant Pays You'}
                        </span>
                        <span className="text-2xl font-extrabold tracking-tight block mt-0.5">
                          {formatINR(netAbs)}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* =========================================================== */}
                {/* SECTION 2: SETTLEMENT SECTION                               */}
                {/* =========================================================== */}
                {!isZero && (
                  <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3.5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      2. Settlement
                    </h2>

                    <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => setSettlementTiming('now')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                          settlementTiming === 'now'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Settled Now
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettlementTiming('later')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                          settlementTiming === 'later'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Settle Later
                      </button>
                    </div>

                    {settlementTiming === 'now' ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {isRefund ? 'Amount Refunded' : 'Amount Received'}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-500">
                              ₹
                            </span>
                            <input
                              type="number"
                              min="0"
                              max={netAbs}
                              value={settledAmountInput}
                              onChange={(e) => setSettledAmountInput(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 text-base font-extrabold border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>

                          {isPartial && (
                            <div className="mt-2 inline-block px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800">
                              Remaining {formatINR(remainingPending)} will be tracked in Pending{' '}
                              {isRefund ? 'Refunds' : 'Dues'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Payment Mode
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {['UPI', 'Cash', 'Bank'].map((mode) => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => setPaymentMode(mode)}
                                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                                  paymentMode === mode
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Note / Ref (Optional)"
                            value={paymentNote}
                            onChange={(e) => setPaymentNote(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed">
                        Move-out will complete now, and{' '}
                        <strong className="text-slate-900">{formatINR(netAbs)}</strong> will be
                        tracked in{' '}
                        <strong className="text-slate-900">
                          {isRefund ? 'Pending Refunds' : 'Pending Dues'}
                        </strong>
                        .
                      </div>
                    )}
                  </section>
                )}

                {/* =========================================================== */}
                {/* PRIMARY CTA BUTTON                                          */}
                {/* =========================================================== */}
                <div className="pt-1 space-y-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => setIsCompleted(true)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-colors"
                  >
                    Complete Move-Out
                  </button>
                  <p className="text-[11px] text-slate-500">
                    Closes tenancy &amp; stops future rent
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}