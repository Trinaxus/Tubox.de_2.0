import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/useCategories';

interface NavigationProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export const Navigation = ({ activeCategory, onCategoryChange }: NavigationProps) => {
  const { categories: dynamicCategories, loading } = useCategories();
  const [allCategories, setAllCategories] = useState<string[]>(['ALLE']);

  useEffect(() => {
    if (!loading && dynamicCategories.length > 0) {
      setAllCategories(['ALLE', ...dynamicCategories]);
    }
  }, [dynamicCategories, loading]);

  if (loading) {
    return (
      <nav className="flex items-center justify-center gap-1 mb-8">
        <div className="text-muted-foreground text-sm">Laden...</div>
      </nav>
    );
  }

  return (
    <nav className="flex items-center justify-center gap-1 mb-8">
      {allCategories.map((category) => (
        <Button
          key={category}
          variant={activeCategory === category ? 'active' : 'ghost'}
          size="sm"
          onClick={() => onCategoryChange(category)}
          className="text-sm font-medium transition-all duration-200 rounded-xl"
        >
          {category}
        </Button>
      ))}
    </nav>
  );
};