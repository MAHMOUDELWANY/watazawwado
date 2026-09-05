import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { X, User, Mail, Phone, Globe, Shield, BookOpen, AlertCircle, Check } from 'lucide-react';
import { DashboardStudentDetail } from '../types';
import { dashboardFetch } from '../lib/dashboardApi';

interface StudentEditModalProps {
  studentDetail: DashboardStudentDetail;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedDetail: DashboardStudentDetail) => void;
}

const COMMON_TIMEZONES = [
  { label: 'Select or keep current', value: '' },
  { label: 'America/New_York (US Eastern)', value: 'America/New_York' },
  { label: 'America/Chicago (US Central)', value: 'America/Chicago' },
  { label: 'America/Denver (US Mountain)', value: 'America/Denver' },
  { label: 'America/Los_Angeles (US Pacific)', value: 'America/Los_Angeles' },
  { label: 'America/Toronto (Canada Eastern)', value: 'America/Toronto' },
  { label: 'Europe/London (UK GMT/BST)', value: 'Europe/London' },
  { label: 'Australia/Sydney (AEST)', value: 'Australia/Sydney' },
  { label: 'Australia/Melbourne (AEST)', value: 'Australia/Melbourne' },
  { label: 'Africa/Cairo (Egypt Time)', value: 'Africa/Cairo' },
  { label: 'Asia/Dubai (GST)', value: 'Asia/Dubai' },
  { label: 'Asia/Riyadh (AST)', value: 'Asia/Riyadh' },
  { label: 'Europe/Paris (CET)', value: 'Europe/Paris' },
  { label: 'UTC', value: 'UTC' }
];

export function StudentEditModal({ studentDetail, isOpen, onClose, onUpdated }: StudentEditModalProps) {
  const { student, guardian } = studentDetail;

  const [name, setName] = useState(student.name || '');
  const [parentName, setParentName] = useState(guardian?.parent_name || '');
  const [parentEmail, setParentEmail] = useState(guardian?.parent_email || '');
  const [parentWhatsapp, setParentWhatsapp] = useState(guardian?.parent_whatsapp || '');
  const [email, setEmail] = useState(student.email || '');
  const [whatsapp, setWhatsapp] = useState(student.whatsapp || '');
  const [learnerType, setLearnerType] = useState<'adult' | 'child' | ''>(student.learner_type || '');
  const [country, setCountry] = useState(student.country || '');
  const [timezone, setTimezone] = useState(student.timezone || '');
  const [customTimezone, setCustomTimezone] = useState(
    COMMON_TIMEZONES.some(tz => tz.value === student.timezone) ? '' : (student.timezone || '')
  );
  const [currentLevel, setCurrentLevel] = useState<string>(student.current_level || '');
  const [status, setStatus] = useState<'active' | 'paused' | 'inactive'>(student.status || 'active');
  const [notes, setNotes] = useState(student.notes || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Student name cannot be empty.');
      return;
    }

    const resolvedTimezone = customTimezone.trim() || timezone.trim() || null;
    if (resolvedTimezone) {
      const isValid = DateTime.now().setZone(resolvedTimezone).isValid;
      if (!isValid) {
        setError(`Invalid timezone: '${resolvedTimezone}'. Please provide a standard IANA timezone.`);
        return;
      }
    }

    const trimmedEmail = email.trim() || null;
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    const trimmedParentEmail = parentEmail.trim() || null;
    if (trimmedParentEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedParentEmail)) {
        setError('Please enter a valid parent/guardian email address.');
        return;
      }
    }

    setSaving(true);

    try {
      const payload: Record<string, any> = {
        name: trimmedName,
        parent_name: parentName.trim() || null,
        parent_email: trimmedParentEmail,
        parent_whatsapp: parentWhatsapp.trim() || null,
        email: trimmedEmail,
        whatsapp: whatsapp.trim() || null,
        learner_type: learnerType || null,
        country: country.trim() || null,
        timezone: resolvedTimezone,
        current_level: currentLevel || null,
        status,
        notes: notes.trim() || null
      };

      await dashboardFetch(`/api/dashboard/students/${student.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      // Refetch full student detail to guarantee complete synchronization
      const refreshedData = await dashboardFetch(`/api/dashboard/students/${student.id}`);
      onUpdated(refreshedData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update student profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-[#2A2431] rounded-2xl shadow-xl border border-[#D5D0CA]/40 dark:border-[#3E3545]/40 overflow-hidden my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D5D0CA]/30 dark:border-[#3E3545]/30 bg-[#F8F6F0] dark:bg-[#1E1923]">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#362E3B] dark:text-[#F5E6D3]">
              Edit Student Profile
            </h2>
            <p className="text-xs text-[#362E3B]/70 dark:text-[#D5D0CA]/70">
              Update details, parent contact, level assessment, and timezone.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#362E3B]/60 dark:text-[#D5D0CA]/60 hover:text-[#362E3B] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Core Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#D5D0CA]/80 mb-1.5">
                Student Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#1E1923] text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
                placeholder="e.g. Zaid Rahman"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#D5D0CA]/80 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#1E1923] text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
              >
                <option value="active">Active (Currently Learning)</option>
                <option value="paused">Paused (Temporarily on hold)</option>
                <option value="inactive">Inactive (Past Student)</option>
              </select>
            </div>
          </div>

          {/* Learner Type & Parent Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#D5D0CA]/80 mb-1.5">
                Learner Type
              </label>
              <select
                value={learnerType}
                onChange={e => setLearnerType(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#1E1923] text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
              >
                <option value="">Unspecified (Unknown)</option>
                <option value="adult">Adult Learner</option>
                <option value="child">Child / Youth Learner</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#D5D0CA]/80 mb-1.5">
                Parent / Guardian Name {learnerType === 'child' && <span className="text-amber-600 dark:text-amber-400 font-normal">(Recommended for Child)</span>}
              </label>
              <input
                type="text"
                value={parentName}
                onChange={e => setParentName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#1E1923] text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
                placeholder="e.g. Tariq Rahman"
              />
            </div>
          </div>

          {/* Parent / Guardian Contact Details (Optional) */}
          {(learnerType === 'child' || parentName.trim().length > 0) && (
            <div className="p-3.5 rounded-xl bg-[#F8F6F0]/80 dark:bg-[#1E1923]/60 border border-[#D5D0CA]/40 dark:border-[#3E3545]/40 space-y-3">
              <span className="text-xs font-semibold text-[#362E3B] dark:text-[#F5E6D3] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#8FAE9B]" />
                Parent / Guardian Contact (Optional)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#362E3B]/70 dark:text-[#D5D0CA]/70 mb-1">
                    Parent Email <span className="font-normal opacity-60">(leave blank if not provided)</span>
                  </label>
                  <input
                    type="email"
                    value={parentEmail}
                    onChange={e => setParentEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#1E1923] text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
                    placeholder="parent@example.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#362E3B]/70 dark:text-[#D5D0CA]/70 mb-1">
                    Parent WhatsApp <span className="font-normal opacity-60">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={parentWhatsapp}
                    onChange={e => setParentWhatsapp(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#1E1923] text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
                    placeholder="+1 555 987 6543"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#D5D0CA]/80 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#1E1923] text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
                placeholder="student@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#D5D0CA]/80 mb-1.5">
                WhatsApp Phone
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#1E1923] text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
                placeholder="+1 555 123 4567"
              />
            </div>
          </div>

          {/* Location & Timezone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#D5D0CA]/80 mb-1.5">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#1E1923] text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
                placeholder="e.g. Canada, United Kingdom, USA"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#D5D0CA]/80 mb-1.5">
                Student Timezone
              </label>
              <select
                value={timezone}
                onChange={e => {
                  setTimezone(e.target.value);
                  if (e.target.value) setCustomTimezone('');
                }}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#1E1923] text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
              >
                {COMMON_TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <div className="mt-1.5">
                <input
                  type="text"
                  value={customTimezone}
                  onChange={e => {
                    setCustomTimezone(e.target.value);
                    if (e.target.value) setTimezone('');
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#D5D0CA]/70 dark:border-[#3E3545]/70 bg-white dark:bg-[#1E1923] text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
                  placeholder="Or enter custom IANA zone (e.g. Europe/Dublin)"
                />
              </div>
            </div>
          </div>

          {/* Level Assessment */}
          <div>
            <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#D5D0CA]/80 mb-1.5">
              Assessed Level
            </label>
            <select
              value={currentLevel}
              onChange={e => setCurrentLevel(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#1E1923] text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
            >
              <option value="">Not assessed yet (Unknown)</option>
              <option value="beginner">Beginner (No prior knowledge)</option>
              <option value="elementary">Elementary (Basic letter recognition / reading)</option>
              <option value="intermediate">Intermediate (Fluent reader / learning rules)</option>
              <option value="advanced">Advanced (Tajweed mastery / memorization)</option>
            </select>
          </div>

          {/* General Profile Notes */}
          <div>
            <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#D5D0CA]/80 mb-1.5">
              General Profile Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#1E1923] text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
              placeholder="Background, student goals, special learning preferences..."
            />
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D5D0CA]/30 dark:border-[#3E3545]/30">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium rounded-xl text-[#362E3B]/80 dark:text-[#D5D0CA]/80 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-medium rounded-xl bg-[#6F907D] hover:bg-[#5A7A67] text-white shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <span>Saving Changes...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
