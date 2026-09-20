'use client';

import React, { useState } from 'react';
import { useRealtimeKanban } from '../hooks/useRealtimeKanban';
import { Header } from '../components/Header';
import { Board } from '../components/Board';
import { CardModal } from '../components/CardModal';
import { ActivityDrawer } from '../components/ActivityDrawer';
import { UserIdentityModal } from '../components/UserIdentityModal';
import { SupabaseSetupModal } from '../components/SupabaseSetupModal';
import { Sidebar } from '../components/Sidebar';
import { AttendanceView } from '../components/AttendanceView';
import { ClientsView } from '../components/ClientsView';
import { KanbanCard, ActiveNavView } from '../types/kanban';
import { INITIAL_CLIENTS } from '../lib/mockData';
import { getStoredTeamMembers, TEAM_UPDATED_EVENT } from '../lib/teamMembers';

// Default evening river ghats background resembling the screenshot
const DEFAULT_WALLPAPER =
  'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=2076&auto=format&fit=crop';
const STORAGE_KEY_WALLPAPER = 'webglow_local_wallpaper_v1';

export default function Home() {
  const {
    columns,
    cards,
    activeUsers,
    currentUser,
    activityLog,
    isSupabaseMode,
    filter,
    setFilter,
    moveCard,
    updateCard,
    addCard,
    deleteCard,
    addColumn,
    deleteColumn,
    setCardViewing,
    updateUserIdentity,
    resetToDemoData,
  } = useRealtimeKanban();

  // Navigation View State
  const [activeView, setActiveView] = useState<ActiveNavView>('board');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modals state
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isIdentityOpen, setIsIdentityOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  // Local-only wallpaper background state (saved only in browser localStorage)
  const [wallpaper, setWallpaper] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_WALLPAPER);
      if (saved) return saved;
    }
    return DEFAULT_WALLPAPER;
  });

  const handleUploadWallpaper = (dataUrl: string) => {
    setWallpaper(dataUrl);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_WALLPAPER, dataUrl);
      } catch (err) {
        console.warn('Could not save wallpaper to localStorage', err);
      }
    }
  };

  const handleResetWallpaper = () => {
    setWallpaper(DEFAULT_WALLPAPER);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_WALLPAPER);
    }
  };

  const handleCardClick = (card: KanbanCard) => {
    setSelectedCard(card);
    setCardViewing(card.id);
  };

  const handleCloseCardModal = () => {
    setSelectedCard(null);
    setCardViewing(null);
  };

  const handleUpdateCardModal = (updated: KanbanCard) => {
    setSelectedCard(updated);
    updateCard(updated);
  };

  // Dynamic team members count for sidebar pill
  const [teamCount, setTeamCount] = useState<number>(() => getStoredTeamMembers().length);

  React.useEffect(() => {
    const handleUpdate = () => {
      setTeamCount(getStoredTeamMembers().length);
    };
    window.addEventListener(TEAM_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(TEAM_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  // Compute total revenue for sidebar pill
  const totalRevenue = INITIAL_CLIENTS.reduce((sum, c) => sum + c.revenueCollected, 0);

  return (
    <div
      className="min-h-screen flex relative bg-cover bg-center bg-no-repeat bg-fixed text-[#b6c2cf] selection:bg-sky-500/30 selection:text-sky-200"
      style={{ backgroundImage: `url("${wallpaper}")` }}
    >
      {/* Dark Ambient Overlay over wallpaper for Trello list readability */}
      <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />

      {/* Modern Collapsible Agency Sidebar */}
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        leadsCount={cards.length}
        presentCount={Math.max(1, teamCount)}
        totalRevenue={totalRevenue}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        currentUser={currentUser}
        onOpenIdentityModal={() => setIsIdentityOpen(true)}
        isSupabaseMode={isSupabaseMode}
      />

      <div className="relative z-10 flex flex-col flex-1 min-w-0 min-h-screen">
        {/* Navigation & Live Collaborators Header */}
        <Header
          currentUser={currentUser}
          activeUsers={activeUsers}
          filter={filter}
          setFilter={setFilter}
          isSupabaseMode={isSupabaseMode}
          activityCount={activityLog.length}
          onOpenIdentityModal={() => setIsIdentityOpen(true)}
          onToggleActivityDrawer={() => setIsActivityOpen(!isActivityOpen)}
          onOpenSetupModal={() => setIsSetupOpen(true)}
          onResetBoard={resetToDemoData}
          onUploadWallpaper={handleUploadWallpaper}
          onResetWallpaper={handleResetWallpaper}
          currentWallpaper={wallpaper}
        />

        {/* View Switcher: Sales Board, Daily Attendance, Clients & Revenue */}
        {activeView === 'board' && (
          <main className="flex-1 flex flex-col min-w-0">
            <Board
              columns={columns}
              cards={cards}
              activeUsers={activeUsers}
              currentUserId={currentUser.id}
              onCardClick={handleCardClick}
              onAddCard={addCard}
              onDeleteCard={deleteCard}
              onMoveCard={moveCard}
              onAddColumn={addColumn}
              onDeleteColumn={deleteColumn}
            />
          </main>
        )}

        {activeView === 'attendance' && (
          <main className="flex-1 flex flex-col min-w-0">
            <AttendanceView currentUser={currentUser} />
          </main>
        )}

        {activeView === 'clients' && (
          <main className="flex-1 flex flex-col min-w-0">
            <ClientsView />
          </main>
        )}
      </div>

      {/* Card Detail & Edit Modal */}
      <CardModal
        card={selectedCard}
        columns={columns}
        isOpen={!!selectedCard}
        onClose={handleCloseCardModal}
        onUpdateCard={handleUpdateCardModal}
        onDeleteCard={deleteCard}
      />

      {/* Realtime Activity Feed Drawer */}
      <ActivityDrawer
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        activityLog={activityLog}
      />

      {/* Collaborator Profile & Persona Switcher */}
      <UserIdentityModal
        isOpen={isIdentityOpen}
        currentUser={currentUser}
        onClose={() => setIsIdentityOpen(false)}
        onSave={updateUserIdentity}
      />

      {/* Supabase & Vercel Free Deployment Guide */}
      <SupabaseSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        isSupabaseMode={isSupabaseMode}
      />
    </div>
  );
}
