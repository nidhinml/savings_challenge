import React from 'react';
import { useApp } from '../../context/AppContext';
import { Download, X, Sparkles } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { canInstallPwa, promptPwaInstall } = useApp();
  const [dismissed, setDismissed] = React.useState(false);

  if (!canInstallPwa || dismissed) return null;

  return (
    <div className="mb-4 p-4 rounded-3xl bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg flex items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div>
          <h4 className="text-sm font-bold flex items-center gap-1.5">
            Install SaveSmart App <Sparkles className="w-3.5 h-3.5" />
          </h4>
          <p className="text-xs text-brand-100">
            Add to home screen for faster daily savings check-ins & offline use.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={promptPwaInstall}
          className="px-3 py-1.5 rounded-xl bg-white text-brand-800 font-bold text-xs shadow hover:bg-brand-50 active:scale-95 transition-all"
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg text-brand-200 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
