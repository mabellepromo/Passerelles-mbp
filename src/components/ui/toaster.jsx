import { useToast } from "@/components/ui/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ICONS = {
  default:     <Info className="h-4 w-4 text-white" />,
  success:     <CheckCircle2 className="h-4 w-4 text-white" />,
  destructive: <AlertCircle className="h-4 w-4 text-white" />,
};

const BG = {
  default:     'linear-gradient(135deg, #1a7a45, #0f5530)',
  success:     'linear-gradient(135deg, #1a7a45, #0f5530)',
  destructive: 'linear-gradient(135deg, #dc2626, #b91c1c)',
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence mode="sync">
        {toasts.map(({ id, title, description, variant = 'default' }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 8,  scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white min-w-[240px] max-w-sm"
            style={{
              background: BG[variant] || BG.default,
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            }}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.18)' }}>
              {ICONS[variant] || ICONS.default}
            </div>
            <div className="flex-1 min-w-0">
              {title       && <p className="text-sm font-semibold leading-tight">{title}</p>}
              {description && <p className="text-xs text-white/75 mt-0.5 leading-snug">{description}</p>}
            </div>
            <button
              onClick={() => dismiss(id)}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-white/70" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
