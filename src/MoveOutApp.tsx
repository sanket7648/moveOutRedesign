import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Zap,
  Plus,
  Minus,
  X,
  Edit3,
  Wrench,
  Home,
  Receipt,
  Info,
  Check
} from 'lucide-react';

// --- TYPES FOR CLEAN .TSX & .JSX COMPATIBILITY ---
interface ExtraCharge {
  id: string;
  label: string;
  amount: number;
}

interface DateDetails {
  day: number;
  daysInMonth: number;
  isLastDayOfMonth: boolean;
  shortMonth: string;
  fullMonth: string;
  year: number;
}

type ModeTab = 'now' | 'future';
type RentCardOption = 'paid' | 'stay';
type SettlementTiming = 'now' | 'later';
type PaymentMode = 'UPI' | 'Cash' | 'Bank';
type UnitPostStatus = 'available' | 'repair';

// --- DEFAULT TENANT & PROPERTY RECORD ---
const TENANT_RECORD = {
  tenantName: 'Peter',
  propertyUnit: 'Sai PG · Single Bed 2',
  monthlyRent: 9000,
  defaultDeposit: 10000,
  defaultMoveOutDate: '2026-11-25',
  defaultNoticeDate: '2026-11-30',
  defaultPrevMeter: 1420,
  defaultCurrMeter: 1465,
  defaultMeterRate: 10,
  receiptId: 'STL-2026-102'
};

// Format currency in Indian Rupees (e.g., ₹10,000)
const formatINR = (val: number): string => {
  const num = Math.round(Number(val) || 0);
  return `₹${num.toLocaleString('en-IN')}`;
};

// Parse YYYY-MM-DD safely and compute exact calendar days in that month
const parseDateDetails = (dateStr: string): DateDetails => {
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

const formatShortDate = (dateStr: string): string => {
  const { day, shortMonth } = parseDateDetails(dateStr);
  return `${day} ${shortMonth}`;
};

const formatFullDate = (dateStr: string): string => {
  const { day, shortMonth, year } = parseDateDetails(dateStr);
  return `${day} ${shortMonth} ${year}`;
};

export default function App() {
  // --- TOP MODE TABS: 'now' | 'future' ---
  const [activeTab, setActiveTab] = useState<ModeTab>('now');

  // --- POST-COMPLETION & FEEDBACK STATES ---
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isDoneConfirmed, setIsDoneConfirmed] = useState<boolean>(false);
  const [headerBannerMsg, setHeaderBannerMsg] = useState<string>('');

  // --- NOTICE GIVEN (FUTURE EXIT) STATE ---
  const [futureExitDate, setFutureExitDate] = useState<string>(TENANT_RECORD.defaultNoticeDate);
  const [noticeNote, setNoticeNote] = useState<string>('');
  const [isNoticeSaved, setIsNoticeSaved] = useState<boolean>(false);

  // --- MOVE OUT NOW: DATE & CURRENT MONTH RENT (2-CARD STATE) ---
  const [moveOutDate, setMoveOutDate] = useState<string>(TENANT_RECORD.defaultMoveOutDate);
  const [rentCard, setRentCard] = useState<RentCardOption>('stay'); // 'paid' (Card 1) | 'stay' (Card 2)
  const [isRentOverridden, setIsRentOverridden] = useState<boolean>(false);
  const [customRentAmount, setCustomRentAmount] = useState<number>(7500);

  // --- PRIOR DUES & EDITABLE SECURITY DEPOSIT ---
  const [priorDues, setPriorDues] = useState<number>(0);
  const [showPriorDuesInput, setShowPriorDuesInput] = useState<boolean>(false);
  const [depositHeld, setDepositHeld] = useState<number>(TENANT_RECORD.defaultDeposit);

  // --- ELECTRICITY / UTILITIES ---
  const [electricityAmount, setElectricityAmount] = useState<number>(450);
  const [showMeterCalc, setShowMeterCalc] = useState<boolean>(false);
  const [prevMeter, setPrevMeter] = useState<number>(TENANT_RECORD.defaultPrevMeter);
  const [currMeter, setCurrMeter] = useState<number>(TENANT_RECORD.defaultCurrMeter);
  const [meterRate, setMeterRate] = useState<number>(TENANT_RECORD.defaultMeterRate);

  // --- COLLAPSIBLE CHARGES & DISCOUNTS ---
  const [showChargeDrawer, setShowChargeDrawer] = useState<boolean>(false);
  const [showDiscountDrawer, setShowDiscountDrawer] = useState<boolean>(false);
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountNote, setDiscountNote] = useState<string>('');

  // Draft inputs for custom charge / discount
  const [customChargeName, setCustomChargeName] = useState<string>('');
  const [customChargeVal, setCustomChargeVal] = useState<string>('');
  const [draftDiscountVal, setDraftDiscountVal] = useState<string>('');
  const [draftDiscountNote, setDraftDiscountNote] = useState<string>('');

  // --- SETTLEMENT STATUS STATE ---
  const [settlementTiming, setSettlementTiming] = useState<SettlementTiming>('now');
  const [settledAmountInput, setSettledAmountInput] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [paymentNote, setPaymentNote] = useState<string>('');

  // --- POST-SETTLEMENT UNIT STATUS ---
  const [unitStatus, setUnitStatus] = useState<UnitPostStatus>('available');

  // --- LIVE RENT & DATE CALCULATIONS ---
  const dateInfo = parseDateDetails(moveOutDate);
  const stayDays = dateInfo.day;
  const daysInMonth = dateInfo.daysInMonth;
  const isLastDayOfMonth = dateInfo.isLastDayOfMonth;

  const dailyRate = TENANT_RECORD.monthlyRent / daysInMonth;
  const autoStayRent = isLastDayOfMonth
    ? TENANT_RECORD.monthlyRent
    : Math.round(dailyRate * stayDays);

  const activeCard2Rent = isRentOverridden
    ? Math.max(0, Number(customRentAmount) || 0)
    : autoStayRent;

  const selectedRent = rentCard === 'paid' ? 0 : activeCard2Rent;

  // --- LIVE BILL & DEPOSIT TOTALS ---
  const safePriorDues = Math.max(0, Number(priorDues) || 0);
  const safeElectricity = Math.max(0, Number(electricityAmount) || 0);
  const extraChargesSum = extraCharges.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const safeDiscount = Math.max(0, Number(discountAmount) || 0);
  const safeDeposit = Math.max(0, Number(depositHeld) || 0);

  const rawBill = selectedRent + safePriorDues + safeElectricity + extraChargesSum;
  const totalBill = Math.max(0, rawBill - safeDiscount);

  const netBalance = safeDeposit - totalBill;
  const isRefund = netBalance > 0;
  const isZero = netBalance === 0;
  const netAbs = Math.abs(netBalance);

  // Keep settled amount input synced to full net amount whenever calculations change
  useEffect(() => {
    setSettledAmountInput(netAbs);
  }, [netAbs]);

  const safeSettledInput = Math.max(0, Number(settledAmountInput) || 0);
  const remainingPending =
    settlementTiming === 'later' ? netAbs : Math.max(0, netAbs - safeSettledInput);
  const isPartial =
    settlementTiming === 'now' && netAbs > 0 && safeSettledInput > 0 && safeSettledInput < netAbs;

  // --- METER CALCULATOR HANDLERS ---
  const unitsConsumed = Math.max(0, (Number(currMeter) || 0) - (Number(prevMeter) || 0));

  const handleMeterChange = (field: 'prev' | 'curr' | 'rate', rawVal: string) => {
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

  // --- EXTRA CHARGES & DISCOUNTS HANDLERS ---
  const addQuickCharge = (label: string, amount: number) => {
    setExtraCharges((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, label, amount }
    ]);
  };

  const handleAddCustomCharge = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amt = Number(customChargeVal);
    if (!customChargeName.trim() || Number.isNaN(amt) || amt <= 0) return;
    addQuickCharge(customChargeName.trim(), Math.round(amt));
    setCustomChargeName('');
    setCustomChargeVal('');
    setShowChargeDrawer(false);
  };

  const removeCharge = (id: string) => {
    setExtraCharges((prev) => prev.filter((item) => item.id !== id));
  };

  const handleApplyDiscount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amt = Number(draftDiscountVal);
    if (Number.isNaN(amt) || amt <= 0) return;
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

  const handleBackClick = () => {
    if (isCompleted) {
      setIsCompleted(false);
      setIsDoneConfirmed(false);
      return;
    }
    setHeaderBannerMsg('Returned to tenant profile view');
    setTimeout(() => setHeaderBannerMsg(''), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-12">
      {/* ===================================================================== */}
      {/* 1. CLEAN WHITE APP HEADER                                             */}
      {/* ===================================================================== */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleBackClick}
              aria-label="Back"
              className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-slate-900 leading-tight">Move Out</h1>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {TENANT_RECORD.tenantName} · {TENANT_RECORD.propertyUnit}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Rent
            </span>
            <span className="text-xs font-extrabold text-slate-800">
              {formatINR(TENANT_RECORD.monthlyRent)}/mo
            </span>
          </div>
        </div>

        {headerBannerMsg && (
          <div className="max-w-md mx-auto px-4 pb-2.5">
            <div className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5">
              {headerBannerMsg}
            </div>
          </div>
        )}
      </header>

      {/* ===================================================================== */}
      {/* 2. MOBILE-FIRST CONTAINER                                             */}
      {/* ===================================================================== */}
      <main className="max-w-md mx-auto px-3 pt-4 space-y-3.5">
        {/* =================================================================== */}
        {/* POST-SETTLEMENT COMPLETION VIEW                                     */}
        {/* =================================================================== */}
        {isCompleted ? (
          <div className="space-y-3.5">
            {/* Completion Status Card */}
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
                    <h2 className="text-base font-bold text-slate-900 mt-1">
                      {TENANT_RECORD.tenantName} · {TENANT_RECORD.propertyUnit}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Exited on {formatFullDate(moveOutDate)} · Future rent stopped
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Unit Status After Exit (Placed at the end AFTER settlement is done) */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">Unit Status After Exit</h3>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    unitStatus === 'available'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {unitStatus === 'available'
                    ? 'Ready for next tenant'
                    : 'Hold listing temporarily'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setUnitStatus('available');
                    setIsDoneConfirmed(false);
                  }}
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
                  onClick={() => {
                    setUnitStatus('repair');
                    setIsDoneConfirmed(false);
                  }}
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

            {/* Itemized Move-Out Settlement Receipt (Displayed directly on screen) */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Move-Out Settlement Receipt
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-300">{TENANT_RECORD.receiptId}</span>
              </div>

              <div className="p-4 space-y-3 text-xs">
                {/* Receipt Meta Header */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tenant &amp; Unit</span>
                    <span className="font-bold text-slate-900">
                      {TENANT_RECORD.tenantName} · {TENANT_RECORD.propertyUnit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Move-Out Date</span>
                    <span className="font-semibold text-slate-800">
                      {formatFullDate(moveOutDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Unit Status</span>
                    <span className="font-semibold text-slate-800">
                      {unitStatus === 'available'
                        ? 'Available to Rent'
                        : 'Needs Painting / Repair'}
                    </span>
                  </div>
                </div>

                {/* Line-by-Line Financial Breakdown */}
                <div className="space-y-2 pt-1">
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
                      <span className="font-semibold text-slate-900">
                        {formatINR(item.amount)}
                      </span>
                    </div>
                  ))}

                  {safeDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>− {discountNote}</span>
                      <span className="font-semibold">-{formatINR(safeDiscount)}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                    <span>Total Bill</span>
                    <span>{formatINR(totalBill)}</span>
                  </div>

                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Less: Security Deposit Adjusted</span>
                    <span>- {formatINR(safeDeposit)}</span>
                  </div>
                </div>

                {/* Highlighted Net Result Box */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
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

                {/* Settlement Status & Payment Mode */}
                {!isZero && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Settlement Status</span>
                      <span className="font-bold text-slate-900">
                        {settlementTiming === 'later'
                          ? `Settle Later (${isRefund ? 'Pending Refund' : 'Pending Due'})`
                          : isPartial
                          ? 'Partially Settled'
                          : 'Settled Now'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        {isRefund ? 'Amount Refunded' : 'Amount Received'}
                      </span>
                      <span className="font-bold text-slate-900">
                        {settlementTiming === 'later'
                          ? '₹0'
                          : `${formatINR(safeSettledInput)} via ${paymentMode}`}
                      </span>
                    </div>
                    {paymentNote && settlementTiming === 'now' && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Reference / Note</span>
                        <span className="font-medium text-slate-700">{paymentNote}</span>
                      </div>
                    )}
                    {remainingPending > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          {isRefund ? 'Pending Refund Balance' : 'Pending Due Balance'}
                        </span>
                        <span className="font-bold text-amber-700">
                          {formatINR(remainingPending)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Saved Banner if Done Clicked */}
            {isDoneConfirmed && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Move-out record saved and {TENANT_RECORD.propertyUnit} status updated.
                </span>
              </div>
            )}

            {/* Bottom Completion Actions: Edit Settlement & Done */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsCompleted(false);
                  setIsDoneConfirmed(false);
                }}
                className="py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Settlement
              </button>

              <button
                type="button"
                onClick={() => setIsDoneConfirmed(true)}
                className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* =============================================================== */}
            {/* 3. TOP MODE SWITCHER (2 CLEAN TABS)                             */}
            {/* =============================================================== */}
            <div className="bg-slate-200/80 p-1 rounded-2xl grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('now')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
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
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'future'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Notice Given (Future Exit)
              </button>
            </div>

            {/* =============================================================== */}
            {/* TAB B: NOTICE GIVEN (FUTURE EXIT)                               */}
            {/* =============================================================== */}
            {activeTab === 'future' && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
                {isNoticeSaved ? (
                  <div className="space-y-3.5">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex items-start gap-2.5">
                      <Calendar className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">
                          Notice Saved
                        </span>
                        <h2 className="text-sm font-bold text-slate-900">
                          Available from {formatShortDate(futureExitDate)}
                        </h2>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {TENANT_RECORD.propertyUnit} is marked &ldquo;Available from{' '}
                          {formatShortDate(futureExitDate)}&rdquo;. Rent continues until actual
                          exit on {formatFullDate(futureExitDate)}.
                        </p>
                        {noticeNote.trim() && (
                          <p className="text-xs text-slate-700 bg-white/80 px-2.5 py-1.5 rounded-lg border border-indigo-100 mt-1.5">
                            Note: {noticeNote.trim()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsNoticeSaved(false)}
                        className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold transition-colors"
                      >
                        Cancel Notice
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMoveOutDate(futureExitDate);
                          setIsRentOverridden(false);
                          setActiveTab('now');
                        }}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                      >
                        Proceed to Move Out Now
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div>
                      <label
                        htmlFor="futureExitDate"
                        className="block text-xs font-bold text-slate-700 mb-1.5"
                      >
                        Expected Move-Out Date
                      </label>
                      <input
                        id="futureExitDate"
                        type="date"
                        value={futureExitDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFutureExitDate(e.target.value)
                        }
                        className="w-full px-3 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="noticeNoteInput"
                        className="block text-xs font-bold text-slate-700 mb-1.5"
                      >
                        Short Note (Optional)
                      </label>
                      <input
                        id="noticeNoteInput"
                        type="text"
                        placeholder="e.g., Relocating at month end"
                        value={noticeNote}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNoticeNote(e.target.value)
                        }
                        className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <p className="text-xs text-slate-500 flex items-start gap-1.5">
                      <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        Marks the unit &ldquo;Available from {formatShortDate(futureExitDate)}
                        &rdquo; while keeping rent active until actual move-out.
                      </span>
                    </p>

                    <button
                      type="button"
                      onClick={() => setIsNoticeSaved(true)}
                      className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xs transition-colors"
                    >
                      Save Notice
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* =============================================================== */}
            {/* TAB A: MOVE OUT NOW (SINGLE-SCREEN FINANCIAL SETTLEMENT)        */}
            {/* =============================================================== */}
            {activeTab === 'now' && (
              <div className="space-y-3.5">
                {/* Move-Out Date Card */}
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
                        ? `Last day of ${dateInfo.fullMonth} (${daysInMonth} days)`
                        : `${stayDays} of ${daysInMonth} days in ${dateInfo.fullMonth}`}
                    </span>
                  </div>
                  <input
                    id="moveOutDateInput"
                    type="date"
                    value={moveOutDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setMoveOutDate(e.target.value);
                      setIsRentOverridden(false);
                    }}
                    className="px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </section>

                {/* =========================================================== */}
                {/* BILLING INPUTS CARD                                         */}
                {/* =========================================================== */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Final Bill Details
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

                  {/* CURRENT MONTH RENT: EXACTLY TWO SIDE-BY-SIDE CARDS */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {dateInfo.fullMonth} Rent
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {formatINR(selectedRent)}
                      </span>
                    </div>

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

                      {/* Card 2: [Day] Days OR Full Month on last day of month */}
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

                    {/* Daily rate caption + Override ₹ toggle directly below Card 2 */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5 pt-0.5">
                      <span>
                        {formatINR(dailyRate)}/day · {daysInMonth}-day month
                      </span>
                      {rentCard === 'stay' &&
                        (!isRentOverridden ? (
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
                        ))}
                    </div>

                    {/* Custom Rent Override Input */}
                    {rentCard === 'stay' && isRentOverridden && (
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
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setCustomRentAmount(Math.max(0, Number(e.target.value) || 0))
                            }
                            className="w-full pl-6 pr-2.5 py-1 text-xs font-bold text-right bg-white border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Optional Prior Dues Row */}
                  {(safePriorDues > 0 || showPriorDuesInput) && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <label
                        htmlFor="priorDuesInput"
                        className="text-xs font-bold text-slate-800"
                      >
                        Prior Dues
                      </label>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">
                          ₹
                        </span>
                        <input
                          id="priorDuesInput"
                          type="number"
                          min="0"
                          value={priorDues}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setPriorDues(Math.max(0, Number(e.target.value) || 0))
                          }
                          className="w-full pl-6 pr-2.5 py-1.5 text-sm font-bold text-right border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Electricity / Utilities + Collapsible Calc by Meter */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label
                          htmlFor="electricityInput"
                          className="text-xs font-bold text-slate-800"
                        >
                          Electricity / Utilities
                        </label>
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
                          id="electricityInput"
                          type="number"
                          min="0"
                          value={electricityAmount}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setElectricityAmount(Math.max(0, Number(e.target.value) || 0))
                          }
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
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleMeterChange('prev', e.target.value)
                              }
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
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleMeterChange('curr', e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                              Rate ₹/unit
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={meterRate}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleMeterChange('rate', e.target.value)
                              }
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

                  {/* Collapsible Adjustments: + Add Charge / Deduction & - Add Discount / Waiver */}
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
                            placeholder="Charge description"
                            value={customChargeName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setCustomChargeName(e.target.value)
                            }
                            className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                          />
                          <input
                            type="number"
                            min="1"
                            placeholder="₹"
                            value={customChargeVal}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setCustomChargeVal(e.target.value)
                            }
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
                          placeholder="Discount label (optional)"
                          value={draftDiscountNote}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setDraftDiscountNote(e.target.value)
                          }
                          className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                        />
                        <input
                          type="number"
                          min="1"
                          placeholder="₹ Off"
                          value={draftDiscountVal}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setDraftDiscountVal(e.target.value)
                          }
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
                </section>

                {/* =========================================================== */}
                {/* LIVE BILL & SECURITY DEPOSIT SUMMARY CARD                   */}
                {/* =========================================================== */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Bill &amp; Deposit Summary
                  </h2>

                  <div className="space-y-2 text-xs">
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
                      <span className="font-semibold text-slate-900">
                        {formatINR(selectedRent)}
                      </span>
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
                        <span className="font-semibold text-slate-900">
                          {formatINR(item.amount)}
                        </span>
                      </div>
                    ))}

                    {safeDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>− {discountNote}</span>
                        <span className="font-semibold">-{formatINR(safeDiscount)}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200 flex justify-between text-xs font-extrabold text-slate-900">
                      <span>Total Bill</span>
                      <span>{formatINR(totalBill)}</span>
                    </div>

                    {/* Directly Editable Less: Security Deposit Held */}
                    <div className="flex items-center justify-between gap-2 text-xs font-bold text-emerald-700 pt-1">
                      <label htmlFor="depositHeldInput">Less: Security Deposit Held</label>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1.5 text-xs font-bold text-emerald-700">
                          - ₹
                        </span>
                        <input
                          id="depositHeldInput"
                          type="number"
                          min="0"
                          value={depositHeld}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setDepositHeld(Math.max(0, Number(e.target.value) || 0))
                          }
                          className="w-full pl-8 pr-2.5 py-1 text-xs font-bold text-right text-emerald-800 bg-emerald-50/60 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Net Result Banner */}
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
                </section>

                {/* =========================================================== */}
                {/* SETTLEMENT STATUS SECTION (SHOWN WHEN NET AMOUNT > 0)       */}
                {/* =========================================================== */}
                {!isZero && (
                  <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3.5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Settlement Status
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
                        Settle Later (Pending)
                      </button>
                    </div>

                    {settlementTiming === 'now' ? (
                      <div className="space-y-3">
                        <div>
                          <label
                            htmlFor="settledAmountInput"
                            className="block text-xs font-bold text-slate-700 mb-1"
                          >
                            {isRefund ? 'Amount Refunded' : 'Amount Received'}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-500">
                              ₹
                            </span>
                            <input
                              id="settledAmountInput"
                              type="number"
                              min="0"
                              max={netAbs}
                              value={settledAmountInput}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setSettledAmountInput(Math.max(0, Number(e.target.value) || 0))
                              }
                              className="w-full pl-8 pr-3 py-2 text-base font-extrabold border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>

                          {isPartial && (
                            <div className="mt-2 inline-block px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800">
                              Remaining {formatINR(remainingPending)} will be saved as Pending{' '}
                              {isRefund ? 'Refund' : 'Due'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Payment Mode
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['UPI', 'Cash', 'Bank'] as PaymentMode[]).map((mode) => (
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
                            placeholder="Reference / Note (Optional)"
                            value={paymentNote}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setPaymentNote(e.target.value)
                            }
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed">
                        Move-out finishes now, and{' '}
                        <strong className="text-slate-900">{formatINR(netAbs)}</strong> is tracked
                        in{' '}
                        <strong className="text-slate-900">
                          {isRefund ? 'Pending Refunds' : 'Pending Dues'}
                        </strong>
                        .
                      </div>
                    )}
                  </section>
                )}

                {/* =========================================================== */}
                {/* PRIMARY ACTION BUTTON                                       */}
                {/* =========================================================== */}
                <div className="pt-1 space-y-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCompleted(true);
                      setIsDoneConfirmed(false);
                    }}
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