import React from 'react';

export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="toast-wrap">
      <div key={toast.key} className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
        {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
      </div>
    </div>
  );
}
