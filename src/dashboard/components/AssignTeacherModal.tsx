import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  UserCheck,
  Sparkles,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { TeacherOption } from '../types';
import { dashboardFetch } from '../lib/dashboardApi';

export interface AssignTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    name: string;
    email?: string | null;
    learner_type?: 'adult' | 'child' | null;
    parent_name?: string | null;
    assigned_teacher_id?: string | null;
    assigned_teacher_name?: string | null;
    assigned_teacher_email?: string | null;
    assigned_teacher_gender?: 'male' | 'female' | null;
    preferred_teacher_gender?: 'male' | 'female' | 'any' | null;
    assignment_status?: 'assigned' | 'unassigned' | 'preference_mismatch';
  };
  onUpdated: (updatedStudent: any) => void;
}

export function AssignTeacherModal({
  isOpen,
  onClose,
  student,
  onUpdated
}: AssignTeacherModalProps) {
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [selectedTeacherEmail, setSelectedTeacherEmail] = useState<string>(
    student.assigned_teacher_email || (student.assigned_teacher_id ? 'mahmoudelwany98@gmail.com' : '')
  );
  const [preferredGender, setPreferredGender] = useState<'male' | 'female' | 'any'>(
    student.preferred_teacher_gender || 'any'
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when modal opens or student changes
  useEffect(() => {
    if (isOpen) {
      setSelectedTeacherEmail(student.assigned_teacher_email || (student.assigned_teacher_id ? 'mahmoudelwany98@gmail.com' : ''));
      setPreferredGender(student.preferred_teacher_gender || 'any');
      setError(null);
    }
  }, [isOpen, student]);

  // Fetch available active teachers from API
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingTeachers(true);

    dashboardFetch('/api/dashboard/teachers')
      .then(res => {
        if (isMounted) {
          setTeachers(res.teachers || []);
        }
      })
      .catch(err => {
        if (isMounted) {
          // Graceful fallback to canonical teachers
          setTeachers([
            {
              id: null,
              email: 'mahmoudelwany98@gmail.com',
              name: 'Ustadh Mahmoud Elwany',
              role: 'super_admin',
              gender: 'male',
              is_active: true
            },
            {
              id: null,
              email: 'mhmwdlwany4222@gmail.com',
              name: 'Ustadh Mahmoud (Staff)',
              role: 'teacher',
              gender: 'male',
              is_active: true
            }
          ]);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingTeachers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Selected teacher details
  const selectedTeacher = teachers.find(t => t.email.toLowerCase() === selectedTeacherEmail.toLowerCase());

  // Determine computed assignment status based on current selections
  let computedStatus: 'assigned' | 'unassigned' | 'preference_mismatch' = 'unassigned';
  if (selectedTeacherEmail) {
    if (preferredGender === 'female' && selectedTeacher?.gender === 'male') {
      computedStatus = 'preference_mismatch';
    } else if (preferredGender === 'male' && selectedTeacher?.gender === 'female') {
      computedStatus = 'preference_mismatch';
    } else {
      computedStatus = 'assigned';
    }
  } else {
    computedStatus = 'unassigned';
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        preferred_teacher_gender: preferredGender,
        assigned_teacher_email: selectedTeacherEmail ? selectedTeacherEmail.trim().toLowerCase() : null
      };

      if (!selectedTeacherEmail) {
        payload.assigned_teacher_id = null;
      } else if (selectedTeacher?.id) {
        payload.assigned_teacher_id = selectedTeacher.id;
      }

      const res = await dashboardFetch(`/api/dashboard/students/${student.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      // Refetch latest student details to ensure total synchronization
      let updatedData = res.student;
      try {
        const fullDetail = await dashboardFetch(`/api/dashboard/students/${student.id}`);
        if (fullDetail) updatedData = fullDetail;
      } catch {
        // Fallback to returned student
      }

      onUpdated(updatedData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update teacher assignment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-xl bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-subtle">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-serif font-bold text-foreground">
                Assign / Change Teacher
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage instructor assignment and gender preferences for this learner.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Student Identity Header */}
          <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif font-bold text-sm border border-primary/20">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-serif font-bold text-foreground">
                    {student.name}
                  </span>
                  {student.learner_type === 'child' ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25 font-medium">
                      Child {student.parent_name ? `(${student.parent_name})` : ''}
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                      Adult
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {student.email || 'No email associated'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-muted-foreground block">Student ID</span>
              <span className="font-mono text-[11px] text-foreground font-medium">
                {student.id.slice(0, 8)}...
              </span>
            </div>
          </div>

          {/* 2. Current Teacher & Assignment Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Current Teacher Display */}
            <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                Current Teacher
              </span>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {student.assigned_teacher_name || (student.assigned_teacher_id ? 'Ustadh Mahmoud Elwany' : 'Unassigned')}
                </span>
              </div>
              {student.assigned_teacher_email && (
                <p className="text-[11px] text-muted-foreground font-mono">
                  {student.assigned_teacher_email}
                </p>
              )}
            </div>

            {/* Assignment Status Display */}
            <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                Assignment Status
              </span>
              <div className="flex items-center gap-2 pt-0.5">
                {computedStatus === 'assigned' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Assigned</span>
                  </span>
                ) : computedStatus === 'preference_mismatch' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-warning/15 text-warning-foreground border border-warning/30">
                    <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                    <span>Preference Mismatch</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-warning/15 text-warning-foreground border border-warning/30">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Unassigned</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {computedStatus === 'assigned'
                  ? 'Active dedicated instructor assigned.'
                  : computedStatus === 'preference_mismatch'
                  ? 'Selected teacher differs from learner gender preference.'
                  : 'Needs teacher assignment.'}
              </p>
            </div>
          </div>

          {/* 3. Preferred Teacher Gender Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span>Preferred Teacher Gender</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  (Learner Preference)
                </span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                Current: <strong className="text-foreground capitalize">{preferredGender}</strong>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setPreferredGender('male')}
                className={`p-3 rounded-xl border text-xs font-medium transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  preferredGender === 'male'
                    ? 'border-primary bg-primary/10 text-primary font-semibold shadow-2xs'
                    : 'border-border bg-surface hover:bg-surface-subtle text-muted-foreground'
                }`}
              >
                <span className="text-base">👔</span>
                <span>Male (Ustadh)</span>
              </button>

              <button
                type="button"
                onClick={() => setPreferredGender('female')}
                className={`p-3 rounded-xl border text-xs font-medium transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  preferredGender === 'female'
                    ? 'border-accent bg-accent/15 text-accent font-semibold shadow-2xs'
                    : 'border-border bg-surface hover:bg-surface-subtle text-muted-foreground'
                }`}
              >
                <span className="text-base">🧕</span>
                <span>Female (Ustadha)</span>
              </button>

              <button
                type="button"
                onClick={() => setPreferredGender('any')}
                className={`p-3 rounded-xl border text-xs font-medium transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  preferredGender === 'any'
                    ? 'border-primary/50 bg-surface-subtle text-foreground font-semibold shadow-2xs'
                    : 'border-border bg-surface hover:bg-surface-subtle text-muted-foreground'
                }`}
              >
                <span className="text-base">⚖️</span>
                <span>No Preference</span>
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Used to respect cultural and personal preferences when matching learners for 1-on-1 Quran and Islamic studies.
            </p>
          </div>

          {/* 4. Teacher Selection Radio Cards */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Select Assigned Teacher</span>
              {loadingTeachers && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading staff...
                </span>
              )}
            </label>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {/* Unassigned Option */}
              <label
                className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                  !selectedTeacherEmail
                    ? 'border-warning/60 bg-warning/5 text-foreground shadow-2xs'
                    : 'border-border bg-surface hover:bg-surface-subtle text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="teacherSelection"
                    checked={!selectedTeacherEmail}
                    onChange={() => setSelectedTeacherEmail('')}
                    className="accent-primary"
                  />
                  <div>
                    <span className="font-semibold text-foreground">
                      Unassigned (No Instructor)
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Learner will have no dedicated assigned teacher.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/15 text-warning-foreground border border-warning/30 font-medium">
                  None
                </span>
              </label>

              {/* Teachers List */}
              {teachers.map(teacher => {
                const isSelected = selectedTeacherEmail.toLowerCase() === teacher.email.toLowerCase();
                const isGenderMatch = preferredGender === 'any' || preferredGender === teacher.gender;

                return (
                  <label
                    key={teacher.email}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-foreground shadow-2xs'
                        : 'border-border bg-surface hover:bg-surface-subtle text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="teacherSelection"
                        checked={isSelected}
                        onChange={() => setSelectedTeacherEmail(teacher.email)}
                        className="accent-primary"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {teacher.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-subtle border border-border-subtle text-muted-foreground">
                            {teacher.role === 'super_admin' ? 'Super Admin' : 'Teacher'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            {teacher.gender === 'female' ? 'Female' : 'Male'}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                          {teacher.email}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {preferredGender !== 'any' && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          isGenderMatch
                            ? 'bg-success/15 text-success border border-success/30'
                            : 'bg-warning/15 text-warning-foreground border border-warning/30'
                        }`}>
                          {isGenderMatch ? '✓ Matches Preference' : '⚠️ Gender Mismatch'}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Mismatch Warning Alert (if any) */}
          {computedStatus === 'preference_mismatch' && (
            <div className="p-3.5 rounded-xl bg-warning/10 border border-warning/30 text-xs text-warning-foreground flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Gender Preference Note</strong>
                <span>
                  The student specified a preference for a {preferredGender === 'female' ? 'Female (Ustadha)' : 'Male (Ustadh)'} instructor, but the assigned teacher is {selectedTeacher?.gender === 'female' ? 'Female' : 'Male'}. You may still confirm this assignment if agreed upon with the family.
                </span>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-foreground hover:bg-surface-subtle transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Assignment...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{student.assigned_teacher_id || student.assigned_teacher_email ? 'Save / Change Teacher' : 'Assign Teacher'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
