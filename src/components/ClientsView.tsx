'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  DollarSign,
  Briefcase,
  Wrench,
  Plus,
  Search,
  TrendingUp,
  RotateCcw,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  Calendar,
  LayoutGrid,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { ClientRecord, ClientType, ClientStatus } from '../types/kanban';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import {
  loadOrSeedClients,
  dbSaveClient,
  dbDeleteClient,
  mapDbClientToClientRecord,
} from '../lib/supabaseService';

const STORAGE_KEY_CLIENTS = 'webglow_clients_data_v1';

export const ClientsView: React.FC = () => {
  // Lazy initialize clients from localStorage
  const [clients, setClients] = useState<ClientRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_CLIENTS);
        if (saved !== null) return JSON.parse(saved);
      } catch (err) {
        console.error('Failed to load clients from localStorage', err);
      }
    }
    return [];
  });

  // Load clients from Supabase cloud on mount
  React.useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let isMounted = true;
    async function initCloudClients() {
      try {
        const cloudClients = await loadOrSeedClients();
        if (isMounted && Array.isArray(cloudClients)) {
          setClients(cloudClients);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(cloudClients));
          }
        }
      } catch (err) {
        console.warn('Could not load clients from Supabase:', err);
      }
    }
    initCloudClients();
    return () => {
      isMounted = false;
    };
  }, []);

  // Subscribe to real-time Postgres changes for clients
  React.useEffect(() => {
    const supa = getSupabase();
    if (!supa) return;

    const channel = supa
      .channel('webglow-clients-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newClient = mapDbClientToClientRecord(payload.new as Record<string, unknown>);
            setClients((prev) => {
              if (prev.some((c) => c.id === newClient.id)) return prev;
              const next = [newClient, ...prev];
              if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(next));
              }
              return next;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapDbClientToClientRecord(payload.new as Record<string, unknown>);
            setClients((prev) => {
              const next = prev.map((c) => (c.id === updated.id ? updated : c));
              if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(next));
              }
              return next;
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = String((payload.old as Record<string, unknown>).id);
            setClients((prev) => {
              const next = prev.filter((c) => c.id !== oldId);
              if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(next));
              }
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supa.removeChannel(channel);
    };
  }, []);

  // View Mode: Grid (Directory) or Monthly (Month-wise Closed Deals)
  const [activeViewMode, setActiveViewMode] = useState<'grid' | 'monthly'>('grid');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | ClientType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | ClientStatus>('all');

  // Modal State for Add / Edit Client
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<ClientType>('production');
  const [formStatus, setFormStatus] = useState<ClientStatus>('active');
  const [formClosedDate, setFormClosedDate] = useState('');
  const [formServices, setFormServices] = useState('');
  const [formRevenue, setFormRevenue] = useState('');
  const [formRetainer, setFormRetainer] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Inline revenue edit state
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineRevenueVal, setInlineRevenueVal] = useState('');

  const saveClients = (updated: ClientRecord[]) => {
    setClients(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save clients', err);
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingClient(null);
    setFormName('');
    setFormType('production');
    setFormStatus('active');
    setFormClosedDate(new Date().toISOString().split('T')[0]);
    setFormServices('');
    setFormRevenue('');
    setFormRetainer('');
    setFormContactName('');
    setFormContactEmail('');
    setFormContactPhone('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client: ClientRecord) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormType(client.type);
    setFormStatus(client.status);
    setFormClosedDate(client.closedDate || client.startDate || new Date().toISOString().split('T')[0]);
    setFormServices(client.services);
    setFormRevenue(client.revenueCollected.toString());
    setFormRetainer(client.monthlyRetainer ? client.monthlyRetainer.toString() : '');
    setFormContactName(client.contactName || '');
    setFormContactEmail(client.contactEmail || '');
    setFormContactPhone(client.contactPhone || '');
    setFormNotes(client.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveClientForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const revNum = parseFloat(formRevenue.replace(/[^0-9.]/g, '')) || 0;
    const retNum = parseFloat(formRetainer.replace(/[^0-9.]/g, '')) || undefined;

    if (editingClient) {
      let updatedClientObj: ClientRecord | null = null;
      const updatedList = clients.map((c) => {
        if (c.id === editingClient.id) {
          const updated: ClientRecord = {
            ...c,
            name: formName.trim(),
            type: formType,
            status: formStatus,
            closedDate: formClosedDate.trim() || undefined,
            services: formServices.trim(),
            revenueCollected: revNum,
            monthlyRetainer: retNum,
            contactName: formContactName.trim() || undefined,
            contactEmail: formContactEmail.trim() || undefined,
            contactPhone: formContactPhone.trim() || undefined,
            notes: formNotes.trim() || undefined,
            updatedAt: new Date().toISOString(),
          };
          updatedClientObj = updated;
          return updated;
        }
        return c;
      });
      saveClients(updatedList);
      if (updatedClientObj) {
        dbSaveClient(updatedClientObj);
      }
    } else {
      const newClient: ClientRecord = {
        id: `client-${Date.now()}`,
        name: formName.trim(),
        type: formType,
        status: formStatus,
        closedDate: formClosedDate.trim() || new Date().toISOString().split('T')[0],
        services: formServices.trim(),
        revenueCollected: revNum,
        monthlyRetainer: retNum,
        contactName: formContactName.trim() || undefined,
        contactEmail: formContactEmail.trim() || undefined,
        contactPhone: formContactPhone.trim() || undefined,
        startDate: formClosedDate.trim() || new Date().toISOString().split('T')[0],
        notes: formNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveClients([newClient, ...clients]);
      dbSaveClient(newClient);
    }

    setIsModalOpen(false);
  };

  const handleDeleteClient = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove client "${name}"?`)) {
      const filtered = clients.filter((c) => c.id !== id);
      saveClients(filtered);
      dbDeleteClient(id);
    }
  };

  const handleQuickUpdateRevenue = (id: string) => {
    const revNum = parseFloat(inlineRevenueVal.replace(/[^0-9.]/g, ''));
    if (isNaN(revNum)) {
      setInlineEditId(null);
      return;
    }
    const updated = clients.map((c) => (c.id === id ? { ...c, revenueCollected: revNum } : c));
    saveClients(updated);
    const target = updated.find((c) => c.id === id);
    if (target) {
      dbSaveClient(target);
    }
    setInlineEditId(null);
  };

  const handleResetSampleData = () => {
    if (window.confirm('Clear all clients from the list?')) {
      saveClients([]);
    }
  };

  // Calculations for Aggregate Revenue
  const totalAggregateRevenue = clients.reduce((sum, c) => sum + (c.revenueCollected || 0), 0);
  const activeMonthlyRetainer = clients
    .filter((c) => (c.type === 'maintenance' || c.type === 'both') && c.status === 'active')
    .reduce((sum, c) => sum + (c.monthlyRetainer || 0), 0);
  const productionRevenue = clients
    .filter((c) => c.type === 'production' || c.type === 'both')
    .reduce((sum, c) => sum + (c.revenueCollected || 0), 0);

  const productionClientsCount = clients.filter((c) => c.type === 'production' || c.type === 'both').length;
  const maintenanceClientsCount = clients.filter((c) => c.type === 'maintenance' || c.type === 'both').length;

  // Filtered clients list
  const filteredClients = clients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.services.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.contactName && c.contactName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchType =
      filterType === 'all'
        ? true
        : filterType === 'production'
        ? c.type === 'production' || c.type === 'both'
        : c.type === 'maintenance' || c.type === 'both';

    const matchStatus = filterStatus === 'all' ? true : c.status === filterStatus;

    return matchSearch && matchType && matchStatus;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatMonthTitle = (monthKey: string) => {
    if (monthKey === 'Unspecified') return 'Unspecified Closing Month';
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };

  // Month-wise grouping for clients
  const monthGroups = useMemo(() => {
    const groups: { [key: string]: ClientRecord[] } = {};
    filteredClients.forEach((c) => {
      const key = c.closedDate ? c.closedDate.slice(0, 7) : 'Unspecified';
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });

    // Sort keys descending (newest month first, with 'Unspecified' at the end)
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'Unspecified') return 1;
      if (b === 'Unspecified') return -1;
      return b.localeCompare(a);
    });

    return sortedKeys.map((key) => {
      const groupClients = groups[key].sort((a, b) => {
        const da = a.closedDate || a.createdAt;
        const db = b.closedDate || b.createdAt;
        return db.localeCompare(da);
      });
      const monthRev = groupClients.reduce((sum, c) => sum + (c.revenueCollected || 0), 0);
      const monthRetainer = groupClients.reduce((sum, c) => sum + (c.monthlyRetainer || 0), 0);
      return {
        monthKey: key,
        title: formatMonthTitle(key),
        clients: groupClients,
        totalRevenue: monthRev,
        totalRetainer: monthRetainer,
      };
    });
  }, [filteredClients]);

  return (
    <div className="flex-1 w-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#101214]/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-[#22272b] shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Clients & Revenue</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
              {formatCurrency(totalAggregateRevenue)} Total
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Production clients served, monthly closed deals track, and aggregate revenue calculator.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-[#161a1d] border border-[#282e33] rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActiveViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeViewMode === 'grid'
                  ? 'bg-sky-500 text-white font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>All Clients</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode('monthly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeViewMode === 'monthly'
                  ? 'bg-sky-500 text-white font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Month-wise Closed Track</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetSampleData}
            title="Reset to sample client data"
            className="p-2 rounded-xl bg-[#161a1d] hover:bg-[#22272b] border border-[#384148] text-neutral-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Client</span>
          </button>
        </div>
      </div>

      {/* Aggregate Revenue Calculator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Aggregate Revenue */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#101214]/90 to-[#171b1f]/90 backdrop-blur-md border border-emerald-500/30 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-emerald-300 font-medium mb-1">
            <span>Total Revenue Collected</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white font-mono tracking-tight">
            {formatCurrency(totalAggregateRevenue)}
          </div>
          <p className="text-[10px] text-neutral-400 mt-2">
            All-time collected revenue across {clients.length} accounts
          </p>
        </div>

        {/* Active Maintenance Retainer MRR */}
        <div className="p-4 rounded-xl bg-[#101214]/80 backdrop-blur-md border border-[#22272b] shadow-lg">
          <div className="flex items-center justify-between text-xs text-amber-300 font-medium mb-1">
            <span>Maintenance Retainer (MRR)</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-amber-300 font-mono tracking-tight">
            {formatCurrency(activeMonthlyRetainer)}
            <span className="text-xs font-normal text-neutral-400 font-sans"> / mo</span>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2">
            {formatCurrency(activeMonthlyRetainer * 12)} / year recurring SLA
          </p>
        </div>

        {/* Production Projects Revenue */}
        <div className="p-4 rounded-xl bg-[#101214]/80 backdrop-blur-md border border-[#22272b] shadow-lg">
          <div className="flex items-center justify-between text-xs text-sky-300 font-medium mb-1">
            <span>Production Projects</span>
            <Briefcase className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-sky-300 font-mono tracking-tight">
            {formatCurrency(productionRevenue)}
          </div>
          <p className="text-[10px] text-neutral-400 mt-2">
            {productionClientsCount} production clients served
          </p>
        </div>

        {/* Total Clients Served */}
        <div className="p-4 rounded-xl bg-[#101214]/80 backdrop-blur-md border border-[#22272b] shadow-lg">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-medium mb-1">
            <span>Client Portfolios</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-white font-mono tracking-tight">
            {clients.length}
            <span className="text-xs font-normal text-neutral-400 font-sans"> total</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-neutral-400 mt-2">
            <span>{productionClientsCount} Production</span>
            <span>•</span>
            <span>{maintenanceClientsCount} Maintenance</span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#101214]/70 p-3 rounded-xl border border-[#22272b]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search clients by company, contact, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[#161a1d] border border-[#384148] text-white placeholder-neutral-500 focus:outline-none focus:border-sky-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 'production', 'maintenance'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterType === type
                    ? 'bg-sky-500 text-white font-semibold shadow-xs'
                    : 'bg-[#161a1d] text-neutral-400 hover:text-white border border-[#282e33]'
                }`}
              >
                {type === 'all'
                  ? `All (${clients.length})`
                  : type === 'production'
                  ? `Production (${productionClientsCount})`
                  : `Maintenance (${maintenanceClientsCount})`}
              </button>
            ))}
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | ClientStatus)}
            className="bg-[#161a1d] border border-[#282e33] text-neutral-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-400 capitalize"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: All Clients Grid View */}
      {activeViewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const isInlineEditing = inlineEditId === client.id;
            return (
              <div
                key={client.id}
                className="p-4 rounded-2xl bg-[#101214]/90 backdrop-blur-md border border-[#22272b] hover:border-[#384148] shadow-xl transition-all group flex flex-col justify-between"
              >
                <div>
                  {/* Top Strip: Client Name, Category & Actions */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1d2125] to-[#282e33] border border-[#384148] flex items-center justify-center text-xs font-bold text-sky-400 shrink-0 shadow-xs">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{client.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                              client.type === 'production'
                                ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                : client.type === 'maintenance'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            {client.type === 'both'
                              ? 'Production & Maintenance'
                              : client.type === 'production'
                              ? 'Production Client'
                              : 'Maintenance SLA'}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono capitalize">
                            • {client.status.replace('_', ' ')}
                          </span>
                          {client.closedDate && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-neutral-300 bg-[#1d2125] border border-[#384148] flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5 text-sky-400" />
                              <span>Closed {formatDateDisplay(client.closedDate)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(client)}
                        title="Edit Client Details"
                        className="p-1 rounded-md hover:bg-[#1d2125] text-neutral-400 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClient(client.id, client.name)}
                        title="Remove Client"
                        className="p-1 rounded-md hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Scope & Description */}
                  <p className="text-xs text-neutral-300 line-clamp-2 mb-3 leading-relaxed">
                    {client.services}
                  </p>

                  {/* Contact Info (if available) */}
                  {(client.contactName || client.contactEmail || client.contactPhone) && (
                    <div className="p-2 rounded-xl bg-[#161a1d] border border-[#22272b] mb-3 text-[11px] text-neutral-300 space-y-1">
                      {client.contactName && (
                        <div className="font-semibold text-neutral-200">{client.contactName}</div>
                      )}
                      <div className="flex items-center gap-3 text-neutral-400 flex-wrap">
                        {client.contactEmail && (
                          <a
                            href={`mailto:${client.contactEmail}`}
                            className="flex items-center gap-1 hover:text-sky-300 transition-colors"
                          >
                            <Mail className="w-3 h-3 text-sky-400" />
                            <span>{client.contactEmail}</span>
                          </a>
                        )}
                        {client.contactPhone && (
                          <a
                            href={`tel:${client.contactPhone}`}
                            className="flex items-center gap-1 hover:text-emerald-300 transition-colors"
                          >
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span>{client.contactPhone}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Financial Metrics Strip */}
                <div className="pt-2.5 border-t border-[#22272b] space-y-2">
                  {/* Revenue Collected Display / Inline Edit */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400">Revenue Collected:</span>
                    {isInlineEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          type="text"
                          value={inlineRevenueVal}
                          onChange={(e) => setInlineRevenueVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleQuickUpdateRevenue(client.id);
                            if (e.key === 'Escape') setInlineEditId(null);
                          }}
                          className="w-24 px-2 py-0.5 rounded bg-[#161a1d] border border-sky-400 text-right text-xs font-mono text-emerald-300 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuickUpdateRevenue(client.id)}
                          className="p-1 rounded bg-sky-500 hover:bg-sky-600 text-white text-[10px]"
                        >
                          ✓
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setInlineEditId(client.id);
                          setInlineRevenueVal(client.revenueCollected.toString());
                        }}
                        title="Click to quickly update collected revenue"
                        className="group/rev flex items-center gap-1 text-sm font-bold font-mono text-emerald-300 hover:text-emerald-200"
                      >
                        <span>{formatCurrency(client.revenueCollected)}</span>
                        <Edit2 className="w-3 h-3 opacity-0 group-hover/rev:opacity-100 text-neutral-400" />
                      </button>
                    )}
                  </div>

                  {/* Monthly Retainer if applicable */}
                  {client.monthlyRetainer ? (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">Monthly Maintenance:</span>
                      <span className="font-semibold text-amber-300 font-mono">
                        {formatCurrency(client.monthlyRetainer)} / mo
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {filteredClients.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 rounded-2xl bg-[#101214]/60 border border-dashed border-[#282e33] text-center">
              <Building2 className="w-10 h-10 text-neutral-500 mb-2" />
              <h3 className="text-sm font-semibold text-neutral-300">No clients match your filter</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                Try changing the search query or category filter above, or add a new client to track.
              </p>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="mt-4 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold"
              >
                Add First Client
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Month-wise Closed Deals View */}
      {activeViewMode === 'monthly' && (
        <div className="space-y-6">
          {/* Monthly Velocity Timeline Strip */}
          <div className="bg-[#101214]/80 p-4 rounded-2xl border border-[#22272b] backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Monthly Deal Closing Performance
                </h2>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                {monthGroups.length} Active {monthGroups.length === 1 ? 'Month' : 'Months'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {monthGroups.map((group) => (
                <div
                  key={group.monthKey}
                  className="p-3 rounded-xl bg-[#161a1d] border border-[#282e33] hover:border-sky-500/40 transition-all text-center"
                >
                  <div className="text-[11px] font-semibold text-neutral-300 truncate">
                    {group.title}
                  </div>
                  <div className="text-base font-extrabold text-emerald-300 font-mono mt-1">
                    {formatCurrency(group.totalRevenue)}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    {group.clients.length} {group.clients.length === 1 ? 'deal' : 'deals'} closed
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Month Groups List */}
          <div className="space-y-6">
            {monthGroups.map((group) => (
              <div
                key={group.monthKey}
                className="rounded-2xl bg-[#101214]/90 backdrop-blur-md border border-[#22272b] overflow-hidden shadow-2xl"
              >
                {/* Month Group Header */}
                <div className="p-4 sm:p-5 border-b border-[#22272b] bg-[#161a1d]/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-bold text-white">{group.title}</h3>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold">
                          {group.clients.length} {group.clients.length === 1 ? 'Client Closed' : 'Clients Closed'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Deals won and contracts signed in {group.title}
                      </p>
                    </div>
                  </div>

                  {/* Month Total Closed Revenue & Added Retainer */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="px-3.5 py-1.5 rounded-xl bg-[#1d2125] border border-emerald-500/30 text-xs">
                      <span className="text-neutral-400 mr-1.5">Closed Revenue:</span>
                      <span className="text-emerald-300 font-bold font-mono text-sm">
                        {formatCurrency(group.totalRevenue)}
                      </span>
                    </div>

                    {group.totalRetainer > 0 && (
                      <div className="px-3.5 py-1.5 rounded-xl bg-[#1d2125] border border-amber-500/30 text-xs">
                        <span className="text-neutral-400 mr-1.5">Added MRR:</span>
                        <span className="text-amber-300 font-bold font-mono text-sm">
                          +{formatCurrency(group.totalRetainer)}/mo
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clients Closed in this Month */}
                <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.clients.map((client) => {
                    const isInlineEditing = inlineEditId === client.id;
                    return (
                      <div
                        key={client.id}
                        className="p-4 rounded-xl bg-[#161a1d] border border-[#282e33] hover:border-[#384148] transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-white truncate">{client.name}</h4>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${
                                    client.type === 'production'
                                      ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                      : client.type === 'maintenance'
                                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  }`}
                                >
                                  {client.type === 'both' ? 'Prod + Maint' : client.type}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400 font-mono">
                                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Closed: {formatDateDisplay(client.closedDate)}</span>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(client)}
                                title="Edit Client"
                                className="p-1 rounded hover:bg-[#1d2125] text-neutral-400 hover:text-white"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteClient(client.id, client.name)}
                                title="Remove Client"
                                className="p-1 rounded hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-neutral-300 line-clamp-2 mb-3 leading-relaxed">
                            {client.services}
                          </p>

                          {client.contactName && (
                            <div className="text-[11px] text-neutral-400 mb-2">
                              Contact: <span className="text-neutral-200">{client.contactName}</span>
                            </div>
                          )}
                        </div>

                        {/* Revenue & Retainer */}
                        <div className="pt-2 border-t border-[#22272b] flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-neutral-400 block">Revenue Closed</span>
                            {isInlineEditing ? (
                              <div className="flex items-center gap-1 mt-0.5">
                                <input
                                  autoFocus
                                  type="text"
                                  value={inlineRevenueVal}
                                  onChange={(e) => setInlineRevenueVal(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleQuickUpdateRevenue(client.id);
                                    if (e.key === 'Escape') setInlineEditId(null);
                                  }}
                                  className="w-20 px-1.5 py-0.5 rounded bg-[#161a1d] border border-sky-400 text-xs font-mono text-emerald-300 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQuickUpdateRevenue(client.id)}
                                  className="p-0.5 px-1 rounded bg-sky-500 text-white text-[10px]"
                                >
                                  ✓
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setInlineEditId(client.id);
                                  setInlineRevenueVal(client.revenueCollected.toString());
                                }}
                                className="font-mono font-bold text-emerald-300 hover:underline flex items-center gap-1"
                              >
                                <span>{formatCurrency(client.revenueCollected)}</span>
                                <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                              </button>
                            )}
                          </div>

                          {client.monthlyRetainer ? (
                            <div className="text-right">
                              <span className="text-[10px] text-neutral-400 block">Retainer SLA</span>
                              <span className="font-mono font-bold text-amber-300">
                                {formatCurrency(client.monthlyRetainer)}/mo
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {monthGroups.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-[#101214]/60 border border-dashed border-[#282e33] text-center">
                <Calendar className="w-10 h-10 text-neutral-500 mb-2" />
                <h3 className="text-sm font-semibold text-neutral-300">No closed clients found</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                  Add clients and set their closed date to monitor month-by-month closed revenue.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="mt-4 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold"
                >
                  Add First Client
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-xl rounded-2xl bg-[#1d2125] border border-[#384148] shadow-2xl p-6 text-neutral-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#282e33] mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white">
                  {editingClient ? 'Edit Client Details' : 'Add New Client'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#282e33] text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClientForm} className="space-y-4 text-xs">
              {/* Company Name */}
              <div>
                <label className="block font-medium text-neutral-300 mb-1">Company / Client Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Apex Dynamics Ltd."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#161a1d] border border-[#384148] text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              {/* Type, Status & Closed Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Engagement Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ClientType)}
                    className="w-full px-3 py-2 rounded-xl bg-[#161a1d] border border-[#384148] text-white text-xs focus:outline-none focus:border-sky-400"
                  >
                    <option value="production">Production Client</option>
                    <option value="maintenance">Maintenance SLA</option>
                    <option value="both">Both (Prod + Maint)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ClientStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-[#161a1d] border border-[#384148] text-white text-xs focus:outline-none focus:border-sky-400 capitalize"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-300 mb-1">
                    Date Client Closed *
                  </label>
                  <input
                    required
                    type="date"
                    value={formClosedDate}
                    onChange={(e) => setFormClosedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#161a1d] border border-[#384148] text-white text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              {/* Revenue Collected & Monthly Retainer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">
                    Revenue Collected ($) *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 24000"
                    value={formRevenue}
                    onChange={(e) => setFormRevenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#161a1d] border border-[#384148] text-emerald-300 font-mono text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="block font-medium text-neutral-300 mb-1">
                    Monthly Maintenance Fee ($ / mo)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1800 (optional)"
                    value={formRetainer}
                    onChange={(e) => setFormRetainer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#161a1d] border border-[#384148] text-amber-300 font-mono text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              {/* Scope & Services */}
              <div>
                <label className="block font-medium text-neutral-300 mb-1">Services / Project Scope</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Next.js SaaS Web App, 3D WebGL animations, monthly DevOps SLA..."
                  value={formServices}
                  onChange={(e) => setFormServices(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#161a1d] border border-[#384148] text-white text-xs focus:outline-none focus:border-sky-400 resize-none"
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Sarah Connor"
                    value={formContactName}
                    onChange={(e) => setFormContactName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#161a1d] border border-[#384148] text-white text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="sarah@client.com"
                    value={formContactEmail}
                    onChange={(e) => setFormContactEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#161a1d] border border-[#384148] text-white text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={formContactPhone}
                    onChange={(e) => setFormContactPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#161a1d] border border-[#384148] text-white text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#282e33]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl hover:bg-[#282e33] text-neutral-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded-xl text-xs font-semibold shadow transition-all"
                >
                  {editingClient ? 'Save Changes' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
