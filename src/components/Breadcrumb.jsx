import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function Breadcrumb({ items }) {
  // items = [{ label, to }] — last item has no `to`
  return (
    <nav className="flex items-center gap-1.5 text-xs text-emerald-200 mb-4 flex-wrap">
      <Link to={createPageUrl('Home')} className="flex items-center gap-1 hover:text-white transition-colors">
        <Home className="h-3 w-3" />
        <span>Accueil</span>
      </Link>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight className="h-3 w-3 text-emerald-400" />
          {item.to ? (
            <Link to={item.to} className="hover:text-white transition-colors">{item.label}</Link>
          ) : (
            <span className="text-white font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}