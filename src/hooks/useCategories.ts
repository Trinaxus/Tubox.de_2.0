import { useState, useEffect } from 'react';
import { fetchCategories, updateCategories } from '@/services/api';

export const useCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const saveCategories = async (newCategories: string[]) => {
    try {
      await updateCategories(newCategories);
      setCategories(newCategories);
      // Refresh categories from storage to ensure consistency
      setTimeout(() => {
        loadCategories();
      }, 100);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save categories');
      console.error('Error saving categories:', err);
      return false;
    }
  };

  const refreshCategories = () => {
    loadCategories();
  };

  return {
    categories,
    loading,
    error,
    saveCategories,
    refreshCategories
  };
};