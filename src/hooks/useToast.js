import { useState, useCallback } from 'react';

let _toastTimer = null;

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    if (_toastTimer) clearTimeout(_toastTimer);
    setToast({ msg, type, key: Date.now() });
    _toastTimer = setTimeout(() => setToast(null), 2600);
  }, []);

  return { toast, showToast };
}
