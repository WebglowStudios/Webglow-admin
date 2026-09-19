'use client';

import React, { useState } from 'react';
import {
  CalendarCheck,
  Clock,
  MessageSquare,
  PhoneCall,
  Users,
  Target,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Briefcase,
  Trash2,
} from 'lucide-react';
import { DailyWorkLog, UserPresence } from '../types/kanban';
import { AGENCY_MEMBERS, INITIAL_WORK_LOGS } from '../lib/mockData';

const STORAGE_KEY_WORK_LOGS = 'webglow_daily_work_logs_v1';

interface AttendanceViewProps {
  currentUser: UserPresence;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ currentUser }) => {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  // Lazy load work logs from localStorage
  const [logs, setLogs] = useState<DailyWorkLog[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_WORK_LOGS);
        if (saved) return JSON.parse(saved);
      } catch (err) {
        console.error('Error reading daily work logs from localStorage', err);
      }
    }
    return INITIAL_WORK_LOGS;
  });

  // Selected member filter ('all' or memberId)
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');

  // Form state for logging today's work
  const [formDate, setFormDate] = useState<string>(getTodayStr());
  const [formIsPresent, setFormIsPresent] = useState<boolean>(true);
  const [formHours, setFormHours] = useState<string>('7.5');
  const [formTasks, setFormTasks] = useState<string>('');
  const [formDms, setFormDms] = useState<string>('10');
  const [formCalls, setFormCalls] = useState<string>('4');
  const [formClients, setFormClients] = useState<string>('3');
  const [formOutcome, setFormOutcome] = useState<string>('');

  const saveLogs = (updated: DailyWorkLog[]) => {
    setLogs(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_WORK_LOGS, JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving daily work logs', err);
      }
    }
  };

  const handleResetSampleData = () => {
    if (window.confirm('Reset all work logs to default sample week data?')) {
      saveLogs(INITIAL_WORK_LOGS);
    }
  };

  const handleSubmitLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTasks.trim()) {
      alert('Please enter what you did today.');
      return;
    }

    const hours = parseFloat(formHours) || 0;
    const dms = parseInt(formDms, 10) || 0;
    const calls = parseInt(formCalls, 10) || 0;
    const clients = parseInt(formClients, 10) || 0;

    const newLog: DailyWorkLog = {
      id: `log-${Date.now()}`,
      memberId: currentUser.id,
      memberName: currentUser.name,
      memberRole: currentUser.role,
      avatarColor: currentUser.avatarColor || '#388bff',
      date: formDate,
      isPresent: formIsPresent,
      hoursWorked: hours,
      tasksDone: formTasks.trim(),
      dmsSent: dms,
      callsDone: calls,
      clientsCount: clients,
      outcome: formOutcome.trim() || 'Work in progress',
      createdAt: new Date().toISOString(),
    };

    // Remove any existing log for this user on the same date, then prepend
    const filtered = logs.filter(
      (l) => !(l.memberId === currentUser.id && l.date === formDate)
    );
    saveLogs([newLog, ...filtered]);

    // Reset form fields
    setFormTasks('');
    setFormOutcome('');
    alert('Daily work log saved successfully!');
  };

  const handleDeleteLog = (logId: string) => {
    if (window.confirm('Are you sure you want to delete this daily work log?')) {
      saveLogs(logs.filter((l) => l.id !== logId));
    }
  };

  // Group team members: all distinct members that have logs or are in AGENCY_MEMBERS
  const allTeamMembers = Array.from(
    new Map(
      [
        ...AGENCY_MEMBERS.map((m) => ({
          id: m.id,
          name: m.name,
          role: m.role,
          avatarColor: m.avatarColor,
        })),
        {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          avatarColor: currentUser.avatarColor,
        },
        ...logs.map((l) => ({
          id: l.memberId,
          name: l.memberName,
          role: l.memberRole,
          avatarColor: l.avatarColor,
        })),
      ].map((m) => [m.id, m])
    ).values()
  );

  // Overall Weekly Totals
  const totalTeamHours = logs.reduce((sum, l) => sum + (l.hoursWorked || 0), 0);
  const totalTeamDms = logs.reduce((sum, l) => sum + (l.dmsSent || 0), 0);
  const totalTeamCalls = logs.reduce((sum, l) => sum + (l.callsDone || 0), 0);
  const totalTeamClients = logs.reduce((sum, l) => sum + (l.clientsCount || 0), 0);

  // Filtered members for the segregated view
  const visibleMembers =
    selectedMemberFilter === 'all'
      ? allTeamMembers
      : allTeamMembers.filter((m) => m.id === selectedMemberFilter);

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex-1 w-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#101214]/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-[#22272b] shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Daily Attendance & Weekly Work Logs
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Track daily presence, hours of effort, sales activity (DMs, calls, clients), and weekly outcomes segregated per team member.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetSampleData}
            title="Reset to sample week logs"
            className="p-2 rounded-xl bg-[#161a1d] hover:bg-[#22272b] border border-[#384148] text-neutral-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Aggregate Weekly Performance Rollup Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#101214]/80 backdrop-blur-md border border-[#22272b] shadow-lg">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Total Effort Logged</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {totalTeamHours.toFixed(1)} <span className="text-xs font-normal text-neutral-400">hours</span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">Accumulated effort this week</p>
        </div>

        <div className="p-4 rounded-xl bg-[#101214]/80 backdrop-blur-md border border-[#22272b] shadow-lg">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Total DMs Sent</span>
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 font-mono">
            {totalTeamDms} <span className="text-xs font-normal text-neutral-400">outbound</span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">Client and prospect direct messages</p>
        </div>

        <div className="p-4 rounded-xl bg-[#101214]/80 backdrop-blur-md border border-[#22272b] shadow-lg">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Calls Conducted</span>
            <PhoneCall className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono">
            {totalTeamCalls} <span className="text-xs font-normal text-neutral-400">calls</span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">Discovery, demo, & support calls</p>
        </div>

        <div className="p-4 rounded-xl bg-[#101214]/80 backdrop-blur-md border border-[#22272b] shadow-lg">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Clients Engaged</span>
            <Briefcase className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono">
            {totalTeamClients} <span className="text-xs font-normal text-neutral-400">accounts</span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">Active client relationships handled</p>
        </div>
      </div>

      {/* "Log Today's Work" Card for the Current User */}
      <div className="p-5 rounded-2xl bg-[#1d2125]/90 backdrop-blur-md border border-[#384148] shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#282e33]">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: currentUser.avatarColor || '#388bff' }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-sky-400/40 shadow-sm"
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Log Daily Work & Attendance</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {currentUser.name}
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Log your presence, hours worked, activity metrics, and outcomes for today.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] text-neutral-400">Date:</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[#161a1d] border border-[#384148] text-white text-xs focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>

        <form onSubmit={handleSubmitLog} className="space-y-4 pt-4 text-xs">
          {/* Row 1: Presence Toggle & Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Are you present / willing to work? */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium text-neutral-300 uppercase tracking-wider block mb-1.5">
                Are you present / willing to work today?
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormIsPresent(true)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                    formIsPresent
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 ring-1 ring-emerald-400/30'
                      : 'bg-[#161a1d] text-neutral-400 border-[#282e33] hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Yes, Present & Working</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormIsPresent(false)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                    !formIsPresent
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 ring-1 ring-rose-400/30'
                      : 'bg-[#161a1d] text-neutral-400 border-[#282e33] hover:text-white'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>Day Off / Not Available</span>
                </button>
              </div>
            </div>

            {/* Hours of Effort */}
            <div>
              <label className="text-[11px] font-medium text-neutral-300 uppercase tracking-wider block mb-1.5">
                Hours of Effort Put In
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={formHours}
                  onChange={(e) => setFormHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#161a1d] border border-[#384148] text-white font-mono text-xs focus:outline-none focus:border-sky-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400 pointer-events-none">
                  hours
                </span>
              </div>
            </div>

            {/* Clients Handled */}
            <div>
              <label className="text-[11px] font-medium text-neutral-300 uppercase tracking-wider block mb-1.5">
                Clients Handled Today
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={formClients}
                  onChange={(e) => setFormClients(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#161a1d] border border-[#384148] text-white font-mono text-xs focus:outline-none focus:border-sky-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400 pointer-events-none">
                  clients
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Sales Metrics (DMs Sent, Calls Done) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#161a1d]/70 border border-[#282e33]">
            <div>
              <label className="text-[11px] font-medium text-neutral-300 flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Number of DMs Sent</span>
              </label>
              <input
                type="number"
                min="0"
                value={formDms}
                onChange={(e) => setFormDms(e.target.value)}
                placeholder="e.g. 15"
                className="w-full px-3 py-1.5 rounded-lg bg-[#1d2125] border border-[#384148] text-white font-mono text-xs focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-300 flex items-center gap-1.5 mb-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                <span>Number of Calls Conducted</span>
              </label>
              <input
                type="number"
                min="0"
                value={formCalls}
                onChange={(e) => setFormCalls(e.target.value)}
                placeholder="e.g. 5"
                className="w-full px-3 py-1.5 rounded-lg bg-[#1d2125] border border-[#384148] text-white font-mono text-xs focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          {/* Row 3: What did you do? */}
          <div>
            <label className="text-[11px] font-medium text-neutral-300 uppercase tracking-wider block mb-1.5">
              What did you do today? *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Detail your accomplishments, tasks delivered, outreach campaigns, or roadblocks resolved..."
              value={formTasks}
              onChange={(e) => setFormTasks(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#161a1d] border border-[#384148] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-sky-400 resize-none transition-colors"
            />
          </div>

          {/* Row 4: Outcome & Results */}
          <div>
            <label className="text-[11px] font-medium text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Target className="w-3.5 h-3.5 text-sky-400" />
              <span>What was the outcome / results?</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Booked 2 discovery calls, client signed $2k agreement, 1 design approved..."
              value={formOutcome}
              onChange={(e) => setFormOutcome(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#161a1d] border border-[#384148] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-sky-400"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Daily Work Log</span>
            </button>
          </div>
        </form>
      </div>

      {/* Segregated Work Monitoring per Team Member */}
      <div className="space-y-4">
        {/* Filter bar for members */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#101214]/70 p-3.5 rounded-2xl border border-[#22272b]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Segregated Work Monitoring by Member
            </h2>
          </div>

          {/* Member Selection Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedMemberFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedMemberFilter === 'all'
                  ? 'bg-sky-500 text-white font-semibold shadow-xs'
                  : 'bg-[#161a1d] text-neutral-400 hover:text-white border border-[#282e33]'
              }`}
            >
              All Members ({allTeamMembers.length})
            </button>
            {allTeamMembers.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMemberFilter(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  selectedMemberFilter === m.id
                    ? 'bg-sky-500 text-white font-semibold shadow-xs'
                    : 'bg-[#161a1d] text-neutral-400 hover:text-white border border-[#282e33]'
                }`}
              >
                <span
                  style={{ backgroundColor: m.avatarColor }}
                  className="w-2 h-2 rounded-full shrink-0"
                />
                <span>{m.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Segregated List of Each Member */}
        <div className="space-y-6">
          {visibleMembers.map((member) => {
            // Get all logs for this member, sorted by date descending
            const memberLogs = logs
              .filter((l) => l.memberId === member.id)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            // Compute member's weekly totals
            const memberHours = memberLogs.reduce((sum, l) => sum + (l.hoursWorked || 0), 0);
            const memberDms = memberLogs.reduce((sum, l) => sum + (l.dmsSent || 0), 0);
            const memberCalls = memberLogs.reduce((sum, l) => sum + (l.callsDone || 0), 0);
            const memberClients = memberLogs.reduce((sum, l) => sum + (l.clientsCount || 0), 0);

            return (
              <div
                key={member.id}
                className="rounded-2xl bg-[#101214]/90 backdrop-blur-md border border-[#22272b] overflow-hidden shadow-2xl"
              >
                {/* Member Header Strip */}
                <div className="p-4 sm:p-5 border-b border-[#22272b] bg-[#161a1d]/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: member.avatarColor || '#388bff' }}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md ring-2 ring-white/10"
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{member.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          {member.role}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {memberLogs.length} work logs recorded
                      </p>
                    </div>
                  </div>

                  {/* Weekly Rollup Statistics Pill for this user */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <div className="px-3 py-1.5 rounded-xl bg-[#1d2125] border border-[#384148] text-neutral-300 font-mono">
                      <span className="text-sky-400 font-bold">{memberHours.toFixed(1)}</span> hrs
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-[#1d2125] border border-[#384148] text-neutral-300 font-mono">
                      <span className="text-emerald-400 font-bold">{memberDms}</span> DMs
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-[#1d2125] border border-[#384148] text-neutral-300 font-mono">
                      <span className="text-amber-400 font-bold">{memberCalls}</span> Calls
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-[#1d2125] border border-[#384148] text-neutral-300 font-mono">
                      <span className="text-purple-400 font-bold">{memberClients}</span> Clients
                    </div>
                  </div>
                </div>

                {/* List of Daily Entries for this Member */}
                <div className="p-4 sm:p-5 space-y-3">
                  {memberLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-xl bg-[#161a1d] border border-[#282e33] hover:border-[#384148] transition-all space-y-2.5"
                    >
                      {/* Top metadata line: Date, Presence, Hours, Metrics */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#22272b] text-white border border-[#384148]">
                            {formatDateDisplay(log.date)}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              log.isPresent
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {log.isPresent ? 'Present & Working' : 'Day Off'}
                          </span>

                          <span className="text-xs font-mono font-bold text-sky-400">
                            {log.hoursWorked} hrs effort
                          </span>
                        </div>

                        {/* Activity Badges */}
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            💬 {log.dmsSent} DMs
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            📞 {log.callsDone} Calls
                          </span>
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            💼 {log.clientsCount} Clients
                          </span>

                          <button
                            type="button"
                            onClick={() => handleDeleteLog(log.id)}
                            title="Delete log"
                            className="p-1 text-neutral-500 hover:text-rose-400 transition-colors ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* What did they do? */}
                      <div>
                        <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-0.5">
                          Tasks & Deliverables
                        </div>
                        <p className="text-xs text-neutral-200 leading-relaxed">
                          {log.tasksDone}
                        </p>
                      </div>

                      {/* Outcome & Results */}
                      {log.outcome && (
                        <div className="p-2.5 rounded-lg bg-sky-950/30 border border-sky-500/30 text-xs flex items-start gap-2">
                          <Target className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider block">
                              Outcome & Results
                            </span>
                            <span className="text-sky-100 text-xs">{log.outcome}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {memberLogs.length === 0 && (
                    <div className="p-6 text-center text-xs text-neutral-500 border border-dashed border-[#282e33] rounded-xl">
                      No daily work logs recorded for {member.name} yet.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
