import { useEffect, useState } from 'react';
import { fetchCategoriesScoped, updateCategoriesScoped, CategoryScope } from '@/services/api';

export const useScopedCategories = (scope: CategoryScope) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCategoriesScoped(scope);
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const save = async (newCategories: string[]) => {
    try {
      await updateCategoriesScoped(scope, newCategories);
      setCategories(newCategories);
      setTimeout(() => load(), 100);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save categories');
      return false;
    }
  };

  const refresh = () => load();

  return { categories, loading, error, saveCategories: save, refreshCategories: refresh };
};
