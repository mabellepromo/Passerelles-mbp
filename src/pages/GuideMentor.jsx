import { useEffect, useState } from 'react';
import Footer from '@/components/Footer';

export default function GuideMentor() {
  const [srcdoc, setSrcdoc] = useState('');

  useEffect(() => {
    document.title = 'Guide du Mentor — Programme PASSERELLES';
    fetch('/guide-mentor.html')
      .then(r => r.text())
      .then(setSrcdoc);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <iframe
        srcDoc={srcdoc}
        style={{ width: '100%', flex: 1, minHeight: '80vh', border: 'none', display: 'block' }}
        title="Guide du Mentor"
      />
      <Footer />
    </div>
  );
}
