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
    <div className="min-h-screen flex flex-col bg-[#060b18] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Dynamic Bluish Background Glow Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[160px]" />
      </div>

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
