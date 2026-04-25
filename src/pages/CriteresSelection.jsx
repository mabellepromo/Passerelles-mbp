import { useEffect, useState } from 'react';

export default function CriteresSelection() {
  const [srcdoc, setSrcdoc] = useState('');

  useEffect(() => {
    document.title = 'Critères de Sélection — Programme PASSERELLES';
    fetch('/criteres-selection.html')
      .then(r => r.text())
      .then(setSrcdoc);
  }, []);

  return (
    <iframe
      srcDoc={srcdoc}
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        display: 'block',
      }}
      title="Critères de Sélection"
    />
  );
}
