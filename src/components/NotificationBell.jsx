import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBell({ userEmail }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const queryClient = useQueryClient();

  const { data: unreadMessages = [] } = useQuery({
    queryKey: ['notif-bell', userEmail],
    queryFn: () => base44.entities.Message.filter({ recipient_email: userEmail }),
    enabled: !!userEmail,
    refetchInterval: 30000,
    select: (msgs) => msgs.filter(m => !m.read)
  });

  // Real-time subscription
  useEffect(() => {
    if (!userEmail) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.recipient_email === userEmail) {
        queryClient.invalidateQueries({ queryKey: ['notif-bell', userEmail] });
      }
    });
    return unsub;
  }, [userEmail, queryClient]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const total = unreadMessages.length;

  // Group by binome
  const byBinome = unreadMessages.reduce((acc, m) => {
    if (!acc[m.binome_id]) acc[m.binome_id] = { binomeId: m.binome_id, senderName: m.sender_name, count: 0, latest: m };
    acc[m.binome_id].count++;
    return acc;
  }, {});

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 text-white" />
        {total > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-[#1e5631] text-white">
              <span className="font-semibold text-sm">Notifications</span>
              <button onClick={() => setOpen(false)}><X className="h-4 w-4" /></button>
            </div>

            {total === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {Object.values(byBinome).map(({ binomeId, senderName, count }) => (
                  <Link
                    key={binomeId}
                    to={`${createPageUrl('Messagerie')}?binome_id=${binomeId}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1e5631] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {senderName?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{senderName}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {count} message{count > 1 ? 's' : ''} non lu{count > 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1" />
                  </Link>
                ))}
              </div>
            )}

            <div className="px-4 py-2 border-t border-gray-100">
              <Link to={createPageUrl('Messagerie')} onClick={() => setOpen(false)}
                className="text-xs text-[#1e5631] font-semibold hover:underline">
                Ouvrir la messagerie →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}