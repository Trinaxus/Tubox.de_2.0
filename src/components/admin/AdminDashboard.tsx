import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GalleryManager } from './GalleryManager';
import { BlogManager } from './BlogManager';
import { FolderManager } from './FolderManager';
import { AdminAppearanceSettings } from './AdminAppearanceSettings';
import { AdminAnalytics } from './AdminAnalytics';

export const AdminDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-transparent">
      <header className="border-b border-border p-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-primary">Trinax Admin</h1>
              <p className="text-muted-foreground">Willkommen, {user?.displayName}</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout}>
            Abmelden
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="galleries" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="galleries" className="flex items-center gap-2">
              <span className="text-primary">📁</span>
              Galerien
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex items-center gap-2">
              <span className="text-primary">✏️</span>
              Blog-Management
            </TabsTrigger>
            <TabsTrigger value="folders" className="flex items-center gap-2">
              <span className="text-primary">🗂️</span>
              Ordnerverwaltung
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <span className="text-primary">⚙️</span>
              Einstellungen
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <span className="text-primary">📈</span>
              Analyse
            </TabsTrigger>
          </TabsList>

          <TabsContent value="galleries">
            <GalleryManager />
          </TabsContent>

          <TabsContent value="blog">
            <BlogManager />
          </TabsContent>

          <TabsContent value="folders">
            <FolderManager />
          </TabsContent>

          <TabsContent value="settings">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-xl font-semibold mb-4">Darstellung</h2>
              <p className="text-sm text-muted-foreground mb-6">Hintergrund-Orb konfigurieren (URL, Größe, Geschwindigkeit, Transparenz, Blend, Sichtbarkeit).</p>
              <AdminAppearanceSettings />
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="max-w-7xl mx-auto">
              <AdminAnalytics />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};