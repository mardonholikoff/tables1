import React, { useState } from 'react';
import {
  Wand2,
  Check,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Layers,
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  AreaChart as AreaIcon,
  Compass,
  Calculator,
  Trophy,
  ScatterChart as ScatterIcon,
} from 'lucide-react';
import {
  AVAILABLE_INSTRUMENTS,
  INSTRUMENT_PRESETS,
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
    <div className="bg-white border border-sky-200 rounded-2xl p-4 space-y-3.5 shadow-sm font-mono text-sky-950">
      {/* Top Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs border border-sky-700">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-950 uppercase tracking-wider font-mono">
                Analitik Instrumentlar
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300">
                {selectedInstruments.length} / {AVAILABLE_INSTRUMENTS.length} ta faol
              </span>
            </div>
            <p className="text-[11px] text-sky-900 font-medium">
              Dashboardda ko'rsatiladigan tahliliy vidjet va grafiklarni sozlang
            </p>
          </div>
        </div>

        {/* Quick Presets & Toggle dropdown */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-sky-50 text-sky-900 text-xs font-bold rounded-xl border border-sky-300 transition cursor-pointer font-mono shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-700" />
            <span>Instrumentlarni sozlash</span>
            {isOpen ? (
              <ChevronUp className="w-3 h-3 text-sky-700" />
            ) : (
              <ChevronDown className="w-3 h-3 text-sky-700" />
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer border font-mono ${
                isSelected
                  ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                  : 'bg-white text-sky-900 border-sky-300 hover:bg-sky-50'
              }`}
              title={inst.description}
            >
              <span className={isSelected ? 'text-white' : 'text-sky-700'}>
                {getIcon(inst.icon)}
              </span>
              <span>{inst.name}</span>
              {isSelected ? (
                <Check className="w-3 h-3 text-white stroke-[3]" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-300" />
              )}
            </button>
          );
        })}
      </div>

      {/* Expanded Instrument Studio (when opened) */}
      {isOpen && (
        <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Preset Buttons */}
          <div>
            <span className="text-[11px] font-bold text-sky-950 uppercase tracking-wider block mb-2 font-mono">
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
                    className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between font-mono ${
                      isCurrentPreset
                        ? 'bg-sky-600 border-sky-700 text-white shadow-xs'
                        : 'bg-white border-sky-300 text-sky-950 hover:bg-sky-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold truncate ${isCurrentPreset ? 'text-white' : 'text-sky-950'}`}>{preset.name}</span>
                      {isCurrentPreset && (
                        <Check className="w-3.5 h-3.5 text-white shrink-0" />
                      )}
                    </div>
                    <p className={`text-[10px] leading-tight ${isCurrentPreset ? 'text-sky-100' : 'text-sky-900'}`}>
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
              <span className="text-[11px] font-bold text-sky-950 uppercase tracking-wider font-mono">
                Barcha Mavjud Instrumentlar:
              </span>
              <div className="flex items-center gap-2 text-xs font-mono">
                <button
                  onClick={() => onChange(AVAILABLE_INSTRUMENTS.map((i) => i.id))}
                  className="text-sky-700 font-bold hover:text-sky-950 hover:underline cursor-pointer"
                >
                  Barchasini yoqish
                </button>
                <span className="text-sky-300">•</span>
                <button
                  onClick={() => onChange(['kpi_cards', 'dynamics_trend'])}
                  className="text-sky-700 hover:text-sky-950 hover:underline cursor-pointer font-bold"
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
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-2.5 select-none font-mono ${
                      isSelected
                        ? 'bg-white border-sky-500 shadow-sm'
                        : 'bg-white/60 border-sky-200 hover:bg-white opacity-80'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-sky-600 text-white font-bold'
                          : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {getIcon(inst.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-sky-950' : 'text-sky-900'
                          }`}
                        >
                          {inst.name}
                        </span>
                        {inst.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 border border-sky-300">
                            {inst.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-sky-900 leading-snug font-medium">
                        {inst.description}
                      </p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-sky-600 border-sky-600 text-white'
                          : 'border-sky-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3] text-white" />}
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
