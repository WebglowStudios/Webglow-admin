'use client';

import React, { useState } from 'react';
import {
  CalendarCheck,
  Clock,
  Laptop,
  Building,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, UserPresence } from '../types/kanban';
import { getInitialAttendanceForDate } from '../lib/mockData';

const STORAGE_KEY_ATTENDANCE = 'webglow_attendance_records_v1';

interface AttendanceViewProps {
  currentUser: UserPresence;
}

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ElementType }
> = {
  present: {
    label: 'Present',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    icon: CheckCircle2,
  },
  remote: {
    label: 'Remote',
    bg: 'bg-sky-500/15',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    icon: Laptop,
  },
  late: {
    label: 'Late',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: AlertCircle,
  },
  'half-day': {
    label: 'Half Day',
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    icon: Clock,
  },
  absent: {
    label: 'Absent',
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    icon: XCircle,
  },
};

export const AttendanceView: React.FC<AttendanceViewProps> = ({ currentUser }) => {
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());

  // Lazy initialize attendance state from localStorage
  const [recordsByDate, setRecordsByDate] = useState<Record<string, AttendanceRecord[]>>(() => {
    const today = new Date().toISOString().split('T')[0];
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
        if (saved) return JSON.parse(saved);
      } catch (err) {
        console.error('Error reading attendance from localStorage', err);
      }
    }
    return { [today]: getInitialAttendanceForDate(today) };
  });

  // Current user's overrides for the selected date
  const [myStatus, setMyStatus] = useState<AttendanceStatus | null>(null);
  const [myWorkMode, setMyWorkMode] = useState<'office' | 'remote' | null>(null);
  const [myNotes, setMyNotes] = useState<string | null>(null);

  // Save to localStorage
  const saveRecords = (updated: Record<string, AttendanceRecord[]>) => {
    setRecordsByDate(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving attendance records', err);
      }
    }
  };

  // Get current active records for the selected date
  const currentRecords: AttendanceRecord[] =
    recordsByDate[selectedDate] || getInitialAttendanceForDate(selectedDate);

  const currentUserRecord = currentRecords.find(
    (r) =>
      r.memberId === currentUser.id ||
      r.memberName.toLowerCase() === currentUser.name.toLowerCase()
  );

  const activeMyStatus = myStatus ?? currentUserRecord?.status ?? 'present';
  const activeMyWorkMode = myWorkMode ?? currentUserRecord?.workMode ?? 'office';
  const activeMyNotes = myNotes ?? currentUserRecord?.notes ?? '';

  // Handle previous / next date navigation
  const handleDateChange = (offsetDays: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offsetDays);
    setSelectedDate(d.toISOString().split('T')[0]);
    setMyStatus(null);
    setMyWorkMode(null);
    setMyNotes(null);
  };

  const handleResetToToday = () => {
    setSelectedDate(getTodayStr());
    setMyStatus(null);
    setMyWorkMode(null);
    setMyNotes(null);
  };

  // Format date display
  const formatDateTitle = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Mark current user attendance
  const handleSaveMyAttendance = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedList = [...currentRecords];
    const userIndex = updatedList.findIndex(
      (r) =>
        r.memberId === currentUser.id ||
        r.memberName.toLowerCase() === currentUser.name.toLowerCase()
    );

    const recordData: AttendanceRecord = {
      id: userIndex >= 0 ? updatedList[userIndex].id : `att-${selectedDate}-${currentUser.id}`,
      memberId: currentUser.id,
      memberName: currentUser.name,
      memberRole: currentUser.role,
      avatarColor: currentUser.avatarColor || '#388bff',
      date: selectedDate,
      status: activeMyStatus,
      checkInTime:
        userIndex >= 0 && updatedList[userIndex].checkInTime
          ? updatedList[userIndex].checkInTime
          : timeStr,
      workMode: activeMyWorkMode,
      notes: activeMyNotes.trim() || undefined,
    };

    if (userIndex >= 0) {
      updatedList[userIndex] = { ...updatedList[userIndex], ...recordData };
    } else {
      updatedList.unshift(recordData);
    }

    const nextAll = { ...recordsByDate, [selectedDate]: updatedList };
    saveRecords(nextAll);
  };

  // Update a specific member's status
  const handleUpdateMemberStatus = (recordId: string, status: AttendanceStatus) => {
    const updatedList = currentRecords.map((r) => {
      if (r.id === recordId) {
        return { ...r, status };
      }
      return r;
    });
    const nextAll = { ...recordsByDate, [selectedDate]: updatedList };
    saveRecords(nextAll);
  };

  // Update work mode
  const handleToggleWorkMode = (recordId: string) => {
    const updatedList = currentRecords.map((r) => {
      if (r.id === recordId) {
        const nextMode = r.workMode === 'office' ? 'remote' : 'office';
        return {
          ...r,
          workMode: nextMode,
          status: nextMode === 'remote' ? ('remote' as AttendanceStatus) : ('present' as AttendanceStatus),
        };
      }
      return r;
    });
    const nextAll = { ...recordsByDate, [selectedDate]: updatedList };
    saveRecords(nextAll);
  };

  // Reset current day attendance to defaults
  const handleResetDayData = () => {
    if (window.confirm('Reset attendance for this day back to default sample data?')) {
      const resetList = getInitialAttendanceForDate(selectedDate);
      const nextAll = { ...recordsByDate, [selectedDate]: resetList };
      saveRecords(nextAll);
    }
  };

  // Metrics calculation
  const totalCount = currentRecords.length;
  const presentCount = currentRecords.filter(
    (r) => r.status === 'present' || r.status === 'remote' || r.status === 'late'
  ).length;
  const officeCount = currentRecords.filter((r) => r.workMode === 'office' && r.status !== 'absent').length;
  const remoteCount = currentRecords.filter((r) => r.workMode === 'remote' && r.status !== 'absent').length;
  const lateCount = currentRecords.filter((r) => r.status === 'late').length;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="flex-1 w-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header & Date Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#101214]/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-[#22272b] shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Daily Attendance</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {attendanceRate}% Logged
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Agency team attendance, daily clock-in timestamps, and office/remote mode tracking.
          </p>
        </div>

        {/* Date Navigator Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => handleDateChange(-1)}
            title="Previous Day"
            className="p-2 rounded-xl bg-[#161a1d] hover:bg-[#22272b] border border-[#384148] text-neutral-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="px-3.5 py-1.5 rounded-xl bg-[#161a1d] border border-sky-500/30 text-xs font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span>{formatDateTitle(selectedDate)}</span>
          </div>

          <button
            type="button"
            onClick={() => handleDateChange(1)}
            title="Next Day"
            className="p-2 rounded-xl bg-[#161a1d] hover:bg-[#22272b] border border-[#384148] text-neutral-300 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {selectedDate !== getTodayStr() && (
            <button
              type="button"
              onClick={handleResetToToday}
              className="px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-xs font-semibold text-sky-300 transition-colors"
            >
              Today
            </button>
          )}

          <button
            type="button"
            onClick={handleResetDayData}
            title="Reset Day Sample"
            className="p-2 rounded-xl hover:bg-[#1d2125] text-neutral-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Aggregate Presence Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#101214]/80 backdrop-blur-md border border-[#22272b] shadow-lg">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Total Checked In</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{presentCount}</span>
            <span className="text-xs text-neutral-400 font-normal">/ {totalCount} members</span>
          </div>
          <div className="w-full bg-[#161a1d] h-1.5 rounded-full overflow-hidden mt-2.5">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#101214]/80 backdrop-blur-md border border-[#22272b] shadow-lg">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>In-Office vs Remote</span>
            <Building className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-sm font-semibold text-white">
              <span className="text-sky-400 font-mono text-xl">{officeCount}</span> Office
            </div>
            <div className="text-sm font-semibold text-white">
              <span className="text-cyan-400 font-mono text-xl">{remoteCount}</span> Remote
            </div>
          </div>
          <p className="text-[10px] text-neutral-500 mt-2">Flexible hybrid work policy</p>
        </div>

        <div className="p-4 rounded-xl bg-[#101214]/80 backdrop-blur-md border border-[#22272b] shadow-lg">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Punctuality / Late</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-300 font-mono">{lateCount}</span>
            <span className="text-xs text-neutral-400 font-normal">late arrivals</span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-2">
            {lateCount === 0 ? 'All members on time' : 'Clocked in past 10:00 AM'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#101214]/80 backdrop-blur-md border border-[#22272b] shadow-lg">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Daily Attendance Rate</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-300 font-mono">{attendanceRate}%</span>
            <span className="text-xs text-neutral-400 font-normal">active quota</span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-2">Target benchmark: 85%+</p>
        </div>
      </div>

      {/* Current User Interactive Check-In Card */}
      <div className="p-5 rounded-2xl bg-[#1d2125]/90 backdrop-blur-md border border-[#384148] shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#282e33]">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: currentUser.avatarColor || '#388bff' }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ring-2 ring-sky-400/40 shadow-md"
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{currentUser.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Mark your daily attendance status for {formatDateTitle(selectedDate)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveMyAttendance}
            className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Log Attendance</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {/* Status Selection */}
          <div>
            <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-2">
              Your Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['present', 'remote', 'late', 'half-day', 'absent'] as AttendanceStatus[]).map(
                (st) => {
                  const cfg = STATUS_CONFIG[st];
                  const Icon = cfg.icon;
                  const isSelected = activeMyStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setMyStatus(st);
                        if (st === 'remote') setMyWorkMode('remote');
                        if (st === 'present') setMyWorkMode('office');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                        isSelected
                          ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-white/20`
                          : 'bg-[#161a1d] text-neutral-400 border-[#282e33] hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cfg.label}</span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Work Mode Toggle */}
          <div>
            <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-2">
              Work Mode
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMyWorkMode('office')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  activeMyWorkMode === 'office'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 ring-1 ring-sky-400/20'
                    : 'bg-[#161a1d] text-neutral-400 border-[#282e33] hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>In-Office</span>
              </button>
              <button
                type="button"
                onClick={() => setMyWorkMode('remote')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  activeMyWorkMode === 'remote'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 ring-1 ring-sky-400/20'
                    : 'bg-[#161a1d] text-neutral-400 border-[#282e33] hover:text-white'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Remote</span>
              </button>
            </div>
          </div>

          {/* Daily Work Focus / Notes */}
          <div>
            <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-2">
              Focus / Note for Today
            </label>
            <input
              type="text"
              placeholder="e.g. Client meetings, sprint delivery, sales calls..."
              value={activeMyNotes}
              onChange={(e) => setMyNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#161a1d] border border-[#384148] text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-sky-400 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* All Team Members Attendance Roster */}
      <div className="rounded-2xl bg-[#101214]/90 backdrop-blur-md border border-[#22272b] overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-[#22272b] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Agency Team Roster</h2>
            <p className="text-xs text-neutral-400">
              Live status overview for all {currentRecords.length} listed team members.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#22272b] bg-[#161a1d]/60 text-neutral-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Member</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Work Mode</th>
                <th className="py-3 px-4 font-semibold">Clock-In</th>
                <th className="py-3 px-4 font-semibold">Focus & Notes</th>
                <th className="py-3 px-4 font-semibold text-right">Quick Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22272b]/60">
              {currentRecords.map((record) => {
                const cfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.present;
                const Icon = cfg.icon;
                return (
                  <tr
                    key={record.id}
                    className="hover:bg-[#161a1d]/50 transition-colors group"
                  >
                    {/* Member */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          style={{ backgroundColor: record.avatarColor || '#388bff' }}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-xs"
                        >
                          {record.memberName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate flex items-center gap-1.5">
                            <span>{record.memberName}</span>
                            {record.memberId === currentUser.id && (
                              <span className="px-1 py-0.2 rounded text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-400 truncate">
                            {record.memberRole}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{cfg.label}</span>
                      </span>
                    </td>

                    {/* Work Mode Toggle */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleWorkMode(record.id)}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                          record.workMode === 'office'
                            ? 'bg-sky-500/10 text-sky-300 border-sky-500/30 hover:bg-sky-500/20'
                            : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'
                        }`}
                        title="Click to toggle Office / Remote"
                      >
                        {record.workMode === 'office' ? (
                          <Building className="w-3 h-3 text-sky-400" />
                        ) : (
                          <Laptop className="w-3 h-3 text-indigo-400" />
                        )}
                        <span className="capitalize">{record.workMode}</span>
                      </button>
                    </td>

                    {/* Clock-In */}
                    <td className="py-3.5 px-4 font-mono text-neutral-300 text-[11px]">
                      {record.checkInTime || '--:--'}
                    </td>

                    {/* Notes */}
                    <td className="py-3.5 px-4 max-w-xs truncate text-neutral-300">
                      {record.notes ? (
                        <span className="text-xs text-neutral-300">{record.notes}</span>
                      ) : (
                        <span className="text-[10px] text-neutral-500 italic">No notes logged</span>
                      )}
                    </td>

                    {/* Status Switcher */}
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={record.status}
                        onChange={(e) =>
                          handleUpdateMemberStatus(record.id, e.target.value as AttendanceStatus)
                        }
                        className="bg-[#161a1d] border border-[#384148] text-white text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-sky-400 capitalize"
                      >
                        <option value="present">Present</option>
                        <option value="remote">Remote</option>
                        <option value="late">Late</option>
                        <option value="half-day">Half Day</option>
                        <option value="absent">Absent</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
