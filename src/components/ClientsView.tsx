'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { ClientRecord, ClientType, ClientStatus } from '../types/kanban';
import { INITIAL_CLIENTS } from '../lib/mockData';

const STORAGE_KEY_CLIENTS = 'webglow_clients_data_v1';

export const ClientsView: React.FC = () => {
  // Lazy initialize clients from localStorage
  const [clients, setClients] = useState<ClientRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_CLIENTS);
        if (saved) return JSON.parse(saved);
      } catch (err) {
        console.error('Failed to load clients from localStorage', err);
      }
    }
    return INITIAL_CLIENTS;
  });

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
      const updatedList = clients.map((c) => {
        if (c.id === editingClient.id) {
          return {
            ...c,
            name: formName.trim(),
            type: formType,
            status: formStatus,
            services: formServices.trim(),
            revenueCollected: revNum,
            monthlyRetainer: retNum,
            contactName: formContactName.trim() || undefined,
            contactEmail: formContactEmail.trim() || undefined,
            contactPhone: formContactPhone.trim() || undefined,
            notes: formNotes.trim() || undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      });
      saveClients(updatedList);
    } else {
      const newClient: ClientRecord = {
        id: `client-${Date.now()}`,
        name: formName.trim(),
        type: formType,
        status: formStatus,
        services: formServices.trim(),
        revenueCollected: revNum,
        monthlyRetainer: retNum,
        contactName: formContactName.trim() || undefined,
        contactEmail: formContactEmail.trim() || undefined,
        contactPhone: formContactPhone.trim() || undefined,
        startDate: new Date().toISOString().split('T')[0],
        notes: formNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveClients([newClient, ...clients]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteClient = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove client "${name}"?`)) {
      const filtered = clients.filter((c) => c.id !== id);
      saveClients(filtered);
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
    setInlineEditId(null);
  };

  const handleResetSampleData = () => {
    if (window.confirm('Reset clients to initial sample agency accounts?')) {
      saveClients(INITIAL_CLIENTS);
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
  const maintenanceRevenue = clients
    .filter((c) => c.type === 'maintenance')
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

  if (!isLoaded) return null;

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
            Production clients served, active monthly maintenance SLAs, and business revenue calculator.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
      </div>

      {/* Clients Cards Grid */}
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
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${
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

              {/* Type & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Client Engagement Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ClientType)}
                    className="w-full px-3 py-2 rounded-xl bg-[#161a1d] border border-[#384148] text-white text-xs focus:outline-none focus:border-sky-400"
                  >
                    <option value="production">Production Client (Projects served)</option>
                    <option value="maintenance">Maintenance SLA (Retainer)</option>
                    <option value="both">Both (Production + Maintenance)</option>
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
