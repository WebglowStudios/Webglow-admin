'use client';

import React, { useState } from 'react';
import { useRealtimeKanban } from '../hooks/useRealtimeKanban';
import { Header } from '../components/Header';
import { StatsBar } from '../components/StatsBar';
import { Board } from '../components/Board';
import { CardModal } from '../components/CardModal';
import { ActivityDrawer } from '../components/ActivityDrawer';
import { UserIdentityModal } from '../components/UserIdentityModal';
import { SupabaseSetupModal } from '../components/SupabaseSetupModal';
import { KanbanCard } from '../types/kanban';

// Default evening river ghats background resembling the screenshot
const DEFAULT_WALLPAPER =
  'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=2076&auto=format&fit=crop';
const STORAGE_KEY_WALLPAPER = 'webglow_local_wallpaper_v1';

export default function Home() {
  const {
    columns,
    cards,
    allCards,
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

  return (
    <div
      className="min-h-screen flex flex-col relative bg-cover bg-center bg-no-repeat bg-fixed text-[#b6c2cf] selection:bg-sky-500/30 selection:text-sky-200"
      style={{ backgroundImage: `url("${wallpaper}")` }}
    >
      {/* Dark Ambient Overlay over wallpaper for Trello list readability */}
      <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col flex-1 min-h-screen">
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

        {/* Agency Metrics & Stats Bar */}
        <StatsBar
          cards={allCards}
          columns={columns}
          activeUsers={activeUsers}
        />

        {/* Main Kanban Board Container */}
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
