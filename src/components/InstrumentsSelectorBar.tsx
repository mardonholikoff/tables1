import React, { useState } from 'react';
import {
  Wand2,
  Check,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Layers,
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  AreaChart as AreaIcon,
  Compass,
  Calculator,
  Trophy,
  ScatterChart as ScatterIcon,
  Eye,
  RotateCcw,
} from 'lucide-react';
import {
  AVAILABLE_INSTRUMENTS,
  INSTRUMENT_PRESETS,
  AnalyticalInstrumentDef,
} from '../utils/analytics';

interface InstrumentsSelectorBarProps {
  selectedInstruments: string[];
  onChange: (instruments: string[]) => void;
}

export const InstrumentsSelectorBar: React.FC<InstrumentsSelectorBarProps> = ({
  selectedInstruments,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleInstrument = (id: string) => {
    if (selectedInstruments.includes(id)) {
      if (selectedInstruments.length > 1) {
        onChange(selectedInstruments.filter((item) => item !== id));
      }
    } else {
      onChange([...selectedInstruments, id]);
    }
  };

  const applyPreset = (presetInstruments: string[]) => {
    onChange(presetInstruments);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layers':
        return <Layers className="w-3.5 h-3.5" />;
      case 'TrendingUp':
        return <TrendingUp className="w-3.5 h-3.5" />;
      case 'BarChart2':
        return <BarChart2 className="w-3.5 h-3.5" />;
      case 'PieChart':
        return <PieIcon className="w-3.5 h-3.5" />;
      case 'AreaChart':
        return <AreaIcon className="w-3.5 h-3.5" />;
      case 'Compass':
        return <Compass className="w-3.5 h-3.5" />;
      case 'Calculator':
        return <Calculator className="w-3.5 h-3.5" />;
      case 'Trophy':
        return <Trophy className="w-3.5 h-3.5" />;
      case 'ScatterPlot':
        return <ScatterIcon className="w-3.5 h-3.5" />;
      default:
        return <BarChart2 className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3">
      {/* Top Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Analitik Instrumentlar
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {selectedInstruments.length} / {AVAILABLE_INSTRUMENTS.length} ta faol
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Dashboardda ko'rsatiladigan tahliliy vidjet va grafiklarni tanlang
            </p>
          </div>
        </div>

        {/* Quick Presets & Toggle dropdown */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Instrumentlarni sozlash</span>
            {isOpen ? (
              <ChevronUp className="w-3 h-3 text-slate-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Pills (Horizontal Scroller for fast on/off toggling) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {AVAILABLE_INSTRUMENTS.map((inst) => {
          const isSelected = selectedInstruments.includes(inst.id);
          return (
            <button
              key={inst.id}
              onClick={() => toggleInstrument(inst.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition cursor-pointer border ${
                isSelected
                  ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500/50 shadow-sm'
                  : 'bg-slate-950/60 text-slate-500 border-slate-800/80 hover:text-slate-300 hover:bg-slate-800/60'
              }`}
              title={inst.description}
            >
              <span className={isSelected ? 'text-indigo-400' : 'text-slate-500'}>
                {getIcon(inst.icon)}
              </span>
              <span>{inst.name}</span>
              {isSelected ? (
                <Check className="w-3 h-3 text-indigo-400 stroke-[3]" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              )}
            </button>
          );
        })}
      </div>

      {/* Expanded Instrument Studio (when opened) */}
      {isOpen && (
        <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800/90 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Preset Buttons */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Tayyor To'plamlar (Presets):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {INSTRUMENT_PRESETS.map((preset) => {
                const isCurrentPreset =
                  preset.instruments.length === selectedInstruments.length &&
                  preset.instruments.every((id) => selectedInstruments.includes(id));

                return (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.instruments)}
                    className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                      isCurrentPreset
                        ? 'bg-indigo-600/20 border-indigo-500/60 text-white'
                        : 'bg-slate-900 border-slate-800/80 text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold truncate">{preset.name}</span>
                      {isCurrentPreset && (
                        <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Grid of instruments with descriptions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Barcha Mavjud Instrumentlar:
              </span>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => onChange(AVAILABLE_INSTRUMENTS.map((i) => i.id))}
                  className="text-indigo-400 hover:underline cursor-pointer"
                >
                  Barchasini yoqish
                </button>
                <span className="text-slate-600">•</span>
                <button
                  onClick={() => onChange(['kpi_cards', 'dynamics_trend'])}
                  className="text-slate-400 hover:underline cursor-pointer"
                >
                  Ixcham ko'rinish
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {AVAILABLE_INSTRUMENTS.map((inst) => {
                const isSelected = selectedInstruments.includes(inst.id);

                return (
                  <div
                    key={inst.id}
                    onClick={() => toggleInstrument(inst.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-2.5 select-none ${
                      isSelected
                        ? 'bg-indigo-950/30 border-indigo-500/50 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800/70 hover:bg-slate-800/50 opacity-70'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {getIcon(inst.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-white' : 'text-slate-400'
                          }`}
                        >
                          {inst.name}
                        </span>
                        {inst.badge && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {inst.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        {inst.description}
                      </p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-700 bg-slate-950'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
