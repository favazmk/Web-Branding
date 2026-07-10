import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import Lanyard from './components/Lanyard';

// Team members data
const TEAM_MEMBERS = [
  {
    id: 'hashir',
    name: 'Hashir Nisam',
    role: 'Founder & CEO',
    avatar: '/founder.png',
    bgColor: 'linear-gradient(135deg, #2b1055 0%, #752207 100%)',
    badgeColor: '#e11d48'
  },
  {
    id: 'sarah',
    name: 'Sarah Ahmed',
    role: 'Creative Director',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
    bgColor: 'linear-gradient(135deg, #1e0b36 0%, #4b1a8a 100%)',
    badgeColor: '#8b3dff'
  },
  {
    id: 'rahul',
    name: 'Rahul Nair',
    role: 'Head of Web Development',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    bgColor: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    badgeColor: '#0ea5e9'
  },
  {
    id: 'jessica',
    name: 'Jessica Lopez',
    role: 'Digital Marketing Strategist',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
    bgColor: 'linear-gradient(135deg, #1c1917 0%, #44403c 100%)',
    badgeColor: '#f59e0b'
  }
];

// Helper function to generate high-fidelity ID Badge texture using Canvas API
const useBadgeTextures = (member) => {
  return useMemo(() => {
    if (!member) return { front: null, back: null };

    // Front Texture Canvas
    const canvasF = document.createElement('canvas');
    canvasF.width = 512;
    canvasF.height = 768;
    const ctxF = canvasF.getContext('2d');

    // Draw background gradient
    const gradF = ctxF.createLinearGradient(0, 0, 0, 768);
    gradF.addColorStop(0, '#1a0b2e');
    gradF.addColorStop(0.5, '#0c0517');
    gradF.addColorStop(1, '#020005');
    ctxF.fillStyle = gradF;
    ctxF.fillRect(0, 0, 512, 768);

    // Decorative glass border and overlay glow
    ctxF.strokeStyle = 'rgba(139, 61, 255, 0.3)';
    ctxF.lineWidth = 8;
    ctxF.strokeRect(20, 20, 472, 728);

    // TOP: Logo Text / Branding
    ctxF.fillStyle = '#ffffff';
    ctxF.font = 'bold 24px Outfit, sans-serif';
    ctxF.textAlign = 'center';
    ctxF.fillText('THE WEB BRANDING', 256, 75);

    // TOP SUB: Hub Locations
    ctxF.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctxF.font = '700 12px Inter, sans-serif';
    ctxF.fillText('DUBAI  •  KERALA', 256, 100);

    // CENTER-ish: User Name & Role
    ctxF.fillStyle = '#ffffff';
    ctxF.font = '900 32px Outfit, sans-serif';
    ctxF.fillText(member.name.toUpperCase(), 256, 440);

    ctxF.fillStyle = member.badgeColor || '#8b3dff';
    ctxF.font = 'bold 18px Inter, sans-serif';
    ctxF.fillText(member.role, 256, 475);

    // MIDDLE: ID Card clip hole indicator
    ctxF.fillStyle = '#0f0c1b';
    ctxF.beginPath();
    ctxF.arc(256, 30, 15, 0, Math.PI * 2);
    ctxF.fill();

    // BOTTOM: Barcode design
    ctxF.fillStyle = '#ffffff';
    // Draw 30 barcode lines of varying widths
    let startX = 120;
    const barcodeWidths = [2, 4, 1, 6, 2, 1, 4, 2, 7, 1, 3, 2, 6, 1, 2, 4, 1, 7, 2, 1, 3, 5, 2, 1, 4, 3, 2, 6, 1, 4];
    for (let w of barcodeWidths) {
      ctxF.fillRect(startX, 630, w, 50);
      startX += w + 3;
    }
    ctxF.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctxF.font = '10px monospace';
    ctxF.fillText(`TWB-EMP-${member.id.toUpperCase()}-2026`, 256, 700);

    // Back Texture Canvas
    const canvasB = document.createElement('canvas');
    canvasB.width = 512;
    canvasB.height = 768;
    const ctxB = canvasB.getContext('2d');

    // Draw background
    ctxB.fillStyle = '#080312';
    ctxB.fillRect(0, 0, 512, 768);

    ctxB.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctxB.lineWidth = 8;
    ctxB.strokeRect(20, 20, 472, 728);

    // Back logo
    ctxB.fillStyle = '#ffffff';
    ctxB.font = 'bold 28px Outfit, sans-serif';
    ctxB.textAlign = 'center';
    ctxB.fillText('T W B', 256, 180);

    ctxB.fillStyle = 'rgba(255,255,255,0.2)';
    ctxB.font = '12px Inter, sans-serif';
    ctxB.fillText('DIGITAL TRANSFORMATION AGENTS', 256, 215);

    // Back disclaimer text
    ctxB.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctxB.font = '12px Inter, sans-serif';
    ctxB.fillText('This card is property of The Web Branding.', 256, 400);
    ctxB.fillText('If found, please return to any local office:', 256, 425);
    ctxB.fillText('Dubai HQ: Hor Al Anz East, Deira', 256, 450);
    ctxB.fillText('Kerala Hub: Calicut Bypass Road', 256, 475);

    // QR Code visual placeholder
    ctxB.fillStyle = '#ffffff';
    ctxB.fillRect(206, 540, 100, 100);
    // inner dots
    ctxB.fillStyle = '#080312';
    ctxB.fillRect(216, 550, 80, 80);
    ctxB.fillStyle = '#ffffff';
    ctxB.fillRect(226, 560, 60, 60);
    ctxB.fillStyle = '#080312';
    ctxB.fillRect(236, 570, 40, 40);

    return {
      front: canvasF.toDataURL(),
      back: canvasB.toDataURL()
    };
  }, [member]);
};

function TeamRoot() {
  const [selectedMember, setSelectedMember] = useState(null);
  const textures = useBadgeTextures(selectedMember);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedMember(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Re-trigger scroll reveal observer for dynamically rendered cards
  useEffect(() => {
    if (typeof window !== 'undefined' && window.IntersectionObserver) {
      const animatedElements = document.querySelectorAll('#team-root .reveal-3d-fold');
      const revealCallback = (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('appeared');
          } else {
            entry.target.classList.remove('appeared');
          }
        });
      };
      
      const observer = new IntersectionObserver(revealCallback, {
        root: null,
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });
      
      animatedElements.forEach(el => observer.observe(el));
      return () => observer.disconnect();
    }
  }, []);

  return (
    <div>
      {/* 2D Team Grid */}
      <div className="team-grid">
        {TEAM_MEMBERS.map((member) => (
          <div key={member.id} className="team-card glass-card reveal-3d-fold">
            <div className="team-avatar-wrapper" style={{ background: member.bgColor }}>
              <img 
                src={member.avatar} 
                alt={member.name} 
                className="team-avatar"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop';
                }}
              />
              <span className="team-badge" style={{ backgroundColor: member.badgeColor }}>
                ACTIVE
              </span>
            </div>
            
            <div className="team-info">
              <h3 className="team-name">{member.name}</h3>
              <p className="team-role">{member.role}</p>
            </div>
            
            <button 
              className="btn btn-secondary team-btn"
              onClick={() => setSelectedMember(member)}
              aria-label={`View 3D ID badge for ${member.name}`}
            >
              <span>Inspect 3D ID</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* 3D Lanyard Lightbox Modal */}
      {selectedMember && (
        <div className="modal-overlay" onClick={() => setSelectedMember(null)}>
          <div className="modal-container glass-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{selectedMember.name}</h3>
                <p className="modal-subtitle">{selectedMember.role} — Virtual ID</p>
              </div>
              <button 
                className="modal-close-btn" 
                onClick={() => setSelectedMember(null)}
                aria-label="Close modal"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Canvas Container */}
            <div className="modal-canvas-wrapper">
              <Lanyard 
                position={[0, 0, 20]} 
                gravity={[0, -40, 0]} 
                frontImage={textures.front}
                backImage={textures.back}
                imageFit="cover"
                lanyardWidth={1.2}
              />
              
              {/* Overlay hint */}
              <div className="modal-hint">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ marginRight: '6px' }}>
                  <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
                  <path d="M9 18h6M10 22h4"/>
                </svg>
                <span>Click and drag card to swing with physics</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mount the React Application
const container = document.getElementById('team-root');
if (container) {
  const root = createRoot(container);
  root.render(<TeamRoot />);
}
