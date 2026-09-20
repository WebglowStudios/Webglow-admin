'use client';

import React, { useState } from 'react';
import {
  CalendarCheck,
  Clock,
  MessageSquare,
  PhoneCall,
  Users,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Trash2,
  Code,
} from 'lucide-react';
import { DailyWorkLog, UserPresence, AgencyMember } from '../types/kanban';
import { INITIAL_WORK_LOGS } from '../lib/mockData';
import {
  getStoredTeamMembers,
  deleteStoredTeamMember,
  TEAM_UPDATED_EVENT,
} from '../lib/teamMembers';

const STORAGE_KEY_WORK_LOGS = 'webglow_daily_work_logs_v1';

interface AttendanceViewProps {
  currentUser: UserPresence;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ currentUser }) => {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  // Dynamic team members list
  const [teamMembers, setTeamMembers] = useState<AgencyMember[]>(() => getStoredTeamMembers());

  // Developer vs Sales toggle (auto-detected from role, can be switched anytime)
  const [isDevMode, setIsDevMode] = useState<boolean>(() =>
    /engineer|dev|developer|architect|designer|qa/i.test(currentUser.role)
  );

  React.useEffect(() => {
    setIsDevMode(/engineer|dev|developer|architect|designer|qa/i.test(currentUser.role));
  }, [currentUser.role]);

  // Listen for team member changes
  React.useEffect(() => {
    const handleUpdate = () => {
      setTeamMembers(getStoredTeamMembers());
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem(STORAGE_KEY_WORK_LOGS);
          if (saved) setLogs(JSON.parse(saved));
        } catch {}
      }
    };
    window.addEventListener(TEAM_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(TEAM_UPDATED_EVENT, handleUpdate);
    };
  }, []);

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
    const dms = isDevMode ? 0 : (parseInt(formDms, 10) || 0);
    const calls = isDevMode ? 0 : (parseInt(formCalls, 10) || 0);

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
      logType: isDevMode ? 'developer' : 'sales',
      dmsSent: dms,
      callsDone: calls,
      createdAt: new Date().toISOString(),
    };

    // Remove any existing log for this user on the same date, then prepend
    const filtered = logs.filter(
      (l) => !(l.memberId === currentUser.id && l.date === formDate)
    );
    saveLogs([newLog, ...filtered]);

    // Reset form fields
    setFormTasks('');
    alert(isDevMode ? 'Developer work log saved successfully!' : 'Sales work log saved successfully!');
  };

  const handleDeleteLog = (logId: string) => {
    if (window.confirm('Are you sure you want to delete this daily work log?')) {
      saveLogs(logs.filter((l) => l.id !== logId));
    }
  };

  const handleDeleteMember = (memberId: string, memberName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${memberName}"? This will remove this user from the agency team and permanently erase all their daily work logs.`
      )
    ) {
      const remaining = deleteStoredTeamMember(memberId);
      setTeamMembers(remaining);
      const updatedLogs = logs.filter((l) => l.memberId !== memberId);
      saveLogs(updatedLogs);
      if (selectedMemberFilter === memberId) {
        setSelectedMemberFilter('all');
      }
    }
  };

  // Group team members: active stored members + currentUser
  const allTeamMembers = Array.from(
    new Map(
      [
        ...teamMembers.map((m) => ({
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
      ].map((m) => [m.id, m])
    ).values()
  );

  // Overall Weekly Totals
  const totalTeamHours = logs.reduce((sum, l) => sum + (l.hoursWorked || 0), 0);
  const totalTeamDms = logs.reduce((sum, l) => sum + (l.dmsSent || 0), 0);
  const totalTeamCalls = logs.reduce((sum, l) => sum + (l.callsDone || 0), 0);

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
            Track daily presence, hours of effort, sales outreach (DMs, calls), and work deliverables segregated per team member.
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
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
          <p className="text-[10px] text-neutral-500 mt-1">Direct outreach messages sent</p>
        </div>

        <div className="p-4 rounded-xl bg-[#101214]/80 backdrop-blur-md border border-[#22272b] shadow-lg">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Calls Conducted</span>
            <PhoneCall className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono">
            {totalTeamCalls} <span className="text-xs font-normal text-neutral-400">calls</span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">Discovery, demo & close calls</p>
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
                Log your presence, hours worked, and deliverables for today.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Developer vs Sales Mode Toggle */}
            <div className="flex items-center bg-[#161a1d] p-0.5 rounded-xl border border-[#384148]">
              <button
                type="button"
                onClick={() => setIsDevMode(false)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  !isDevMode
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>💼 Sales</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDevMode(true)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isDevMode
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>💻 Developer</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-neutral-400">Date:</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-[#161a1d] border border-[#384148] text-white text-xs focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmitLog} className="space-y-4 pt-4 text-xs">
          {/* Row 1: Presence Toggle & Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          </div>

          {/* Row 2: Sales Metrics (DMs Sent, Calls Done) - Only shown in Sales Mode */}
          {!isDevMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#161a1d]/70 border border-[#282e33] animate-in fade-in duration-100">
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
          )}

          {/* Row 3: What did you do? */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-neutral-300 uppercase tracking-wider">
                {isDevMode ? 'What did you build / fix today? *' : 'What did you do today? *'}
              </label>
              {isDevMode && (
                <span className="text-[10px] text-indigo-400 font-medium">
                  Developer Mode &bull; Simplistic log with no sales outreach required
                </span>
              )}
            </div>
            <textarea
              rows={3}
              required
              placeholder={
                isDevMode
                  ? "Detail code shipped, bugs resolved, features implemented, commits or reviews completed..."
                  : "Detail your accomplishments, tasks delivered, outreach results, outcomes, or roadblocks resolved..."
              }
              value={formTasks}
              onChange={(e) => setFormTasks(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#161a1d] border border-[#384148] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-sky-400 resize-none transition-colors"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className={`px-5 py-2.5 text-white rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2 transition-all ${
                isDevMode
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 shadow-indigo-500/20'
                  : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-sky-500/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isDevMode ? 'Submit Developer Work Log' : 'Submit Daily Work Log'}</span>
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
                    {(memberDms > 0 || memberCalls > 0) ? (
                      <>
                        <div className="px-3 py-1.5 rounded-xl bg-[#1d2125] border border-[#384148] text-neutral-300 font-mono">
                          <span className="text-emerald-400 font-bold">{memberDms}</span> DMs
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-[#1d2125] border border-[#384148] text-neutral-300 font-mono">
                          <span className="text-amber-400 font-bold">{memberCalls}</span> Calls
                        </div>
                      </>
                    ) : (
                      <div className="px-2.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium flex items-center gap-1 font-sans">
                        <Code className="w-3 h-3" />
                        <span>Dev / Engineering</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteMember(member.id, member.name)}
                      title={`Delete ${member.name} and all work logs`}
                      className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 border border-[#384148] hover:border-rose-800/40 transition-colors ml-1 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium hidden sm:inline">Delete Member</span>
                    </button>
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

                        {/* Activity Badges: Dev Tag vs Sales Metrics */}
                        <div className="flex items-center gap-2 text-[11px]">
                          {log.logType === 'developer' || ((log.dmsSent ?? 0) === 0 && (log.callsDone ?? 0) === 0) ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                              <Code className="w-3 h-3" />
                              <span>Dev</span>
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">
                                💬 {log.dmsSent ?? 0} DMs
                              </span>
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">
                                📞 {log.callsDone ?? 0} Calls
                              </span>
                            </div>
                          )}

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

