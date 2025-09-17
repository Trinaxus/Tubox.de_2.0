import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/useCategories';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Plus } from 'lucide-react';

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
      <nav className="mb-6 md:mb-8">
        <div className="md:hidden px-4">
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Filter laden...
          </Button>
        </div>
        <div className="hidden md:flex items-center justify-center gap-1">
          <div className="text-muted-foreground text-sm">Laden...</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="mb-6 md:mb-8">
      {/* Mobile: compact Filter button opens a sheet */}
      <div className="px-4 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              {activeCategory === 'ALLE' ? 'Filter' : `Filter: ${activeCategory}`}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh]">
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Kategorie wählen</div>
              <div className="grid grid-cols-2 gap-2">
                {allCategories.map((category) => (
                  <Button
                    key={category}
                    variant={activeCategory === category ? 'active' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      onCategoryChange(category);
                      // Close sheet by triggering a click on backdrop
                      const el = document.querySelector('[data-state="open"][data-vaul-drawer]');
                      if (el) (el as HTMLElement).click();
                    }}
                    className="w-full justify-center rounded-xl"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop/Tablet: pill bar */}
      <div className="hidden md:flex items-center justify-center gap-1">
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
      </div>
    </nav>
  );
};