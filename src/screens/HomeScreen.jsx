import React from 'react';

export default function HomeScreen({ gudangList, onSelect, itemCounts, theme, onToggleTheme }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Selamat Pagi ☀️' : hour < 18 ? 'Selamat Siang 🌤️' : 'Selamat Malam 🌙';
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="home-screen">
      {/* Header */}
      <div className="home-header">
        <div className="home-brand">
          <img src="/src/assets/img/KIRA-logo.png" alt="KIRA Logo" style={{ height: '40px', width: 'auto', marginRight: '12px' }} />
          <div className="home-brand-text">
            <div className="name"><span>KIRA</span> PROJECT</div>
            <div className="sub">Manajemen Stok Gudang</div>
          </div>
        </div>
        {/* Theme toggle */}
        <button
          className="theme-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          aria-label="Toggle tema"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="home-greeting">
        <strong>{greeting}</strong> &mdash; {dateStr}
      </div>

      {/* Warehouse cards */}
      <div className="home-grid">
        {gudangList.map(g => (
          <button
            key={g.id}
            className={`warehouse-card ${g.cls}`}
            onClick={() => onSelect(g)}
          >
            <div className="card-dot" />
            <div className="card-icon">{g.icon}</div>
            <div className="card-label">{g.label}</div>
            <div className="card-count">
              {itemCounts[g.id] || 0} item
            </div>
          </button>
        ))}
      </div>

      <div className="home-footer">
        <p>Tap gudang untuk melihat &amp; mengelola stok</p>
      </div>
    </div>
  );
}
