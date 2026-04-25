import React from 'react';

export default function Layout({ children, currentPageName }) {
  // Admin pages have their own layout
  if (currentPageName === 'AdminDashboard') {
    return <>{children}</>;
  }

  // Public pages also have their own full layout
  return <>{children}</>;
}