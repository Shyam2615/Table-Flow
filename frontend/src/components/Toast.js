'use client';
import { useState, useCallback } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;
  return (
    <div className={`toast toast-${type}`} onClick={onClose}>
      {message}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const ToastComponent = toast ? (
    <div className={`toast toast-${toast.type}`} onClick={() => setToast(null)}>
      {toast.msg}
    </div>
  ) : null;

  return { toast: ToastComponent, showToast };
}
