import { useState, useCallback, useEffect, useRef } from 'react';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const timeoutsRef = useRef(new Map());

  // Cleanup all timeouts on unmount
  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach(timeoutId => clearTimeout(timeoutId));
      timeouts.clear();
    };
  }, []);

  const addNotification = useCallback((message, type = 'info') => {
    const newNotification = { id: Date.now().toString(), message, type };
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);

    // Use requestIdleCallback for non-blocking timeout (fallback to setTimeout)
    const scheduleRemoval = () => {
      const removeNotification = () => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
        timeoutsRef.current.delete(newNotification.id);
      };

      if ('requestIdleCallback' in window) {
        // Wait 5 seconds, then schedule removal during idle time
        const timeoutId = setTimeout(() => {
          requestIdleCallback(removeNotification);
        }, 5000);
        timeoutsRef.current.set(newNotification.id, timeoutId);
      } else {
        // Fallback for browsers without requestIdleCallback
        const timeoutId = setTimeout(removeNotification, 5000);
        timeoutsRef.current.set(newNotification.id, timeoutId);
      }
    };

    scheduleRemoval();
  }, []);

  return { notifications, addNotification };
}