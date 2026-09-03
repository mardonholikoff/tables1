import React from 'react';
import {
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  isDanger?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Ha, o'chirib yuborish",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/40 backdrop-blur-md animate-in fade-in duration-200 font-mono text-sky-950">
      <div className="bg-white border border-sky-300 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 border border-red-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-sky-950 tracking-tight font-mono">
              {title}
            </h3>
            <p className="text-xs text-sky-900 mt-0.5 font-mono font-medium">
              Ushbu amalni ortga qaytarib bo'lmaydi
            </p>
          </div>
        </div>

        <p className="text-sm text-sky-950 bg-sky-50 p-3.5 rounded-2xl border border-sky-200 leading-relaxed font-mono font-medium">
          {description}
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 font-mono">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-sky-100 text-sky-900 text-xs font-bold rounded-xl border border-sky-300 transition cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs border border-red-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-white" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
