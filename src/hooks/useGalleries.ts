import { useState, useEffect } from 'react';
import { fetchGalleries, Gallery } from '@/services/api';

export const useGalleries = () => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  const loadGalleries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchGalleries();
      setGalleries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load galleries');
      console.error('Error loading galleries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGalleries();
    
    // Refresh immediately after admin actions
    const onUpdated = () => loadGalleries();
    window.addEventListener('galleries:updated', onUpdated as EventListener);

    return () => {
      // Only event-based refresh remains
      window.removeEventListener('galleries:updated', onUpdated as EventListener);
    };
  }, []);

  const refreshGalleries = () => {
    loadGalleries();
  };

  return {
    galleries,
    loading,
    error,
    refreshGalleries
  };
};