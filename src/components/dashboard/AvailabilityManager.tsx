import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, Plus, Trash2, Save, Loader2, Calendar as CalendarIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { dashboardFetch } from '../../dashboard/lib/dashboardApi';

interface TimeBlock {
  id?: string;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const WEEKDAYS = [
  { id: 1, label: 'Monday', short: 'Mon' },
  { id: 2, label: 'Tuesday', short: 'Tue' },
  { id: 3, label: 'Wednesday', short: 'Wed' },
  { id: 4, label: 'Thursday', short: 'Thu' },
  { id: 5, label: 'Friday', short: 'Fri' },
  { id: 6, label: 'Saturday', short: 'Sat' },
  { id: 0, label: 'Sunday', short: 'Sun' },
];

export default function AvailabilityManager() {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const data = await dashboardFetch('/api/dashboard/availability');
      setBlocks(data || []);
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to load availability', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // Validation to enforce that no silent invalid times are saved
      for (const b of blocks) {
        if (!b.start_time || !b.end_time) {
          throw new Error('Please enter valid start and end times for all active intervals.');
        }
        const startMinutes = parseInt(b.start_time.split(':')[0]) * 60 + parseInt(b.start_time.split(':')[1]);
        const endMinutes = parseInt(b.end_time.split(':')[0]) * 60 + parseInt(b.end_time.split(':')[1]);
        if (startMinutes >= endMinutes) {
          throw new Error('Start time must be before end time.');
        }
      }

      await dashboardFetch('/api/dashboard/availability', {
        method: 'PUT',
        body: JSON.stringify({ blocks: blocks.map(b => ({
          weekday: b.weekday,
          start_time: b.start_time.length === 5 ? `${b.start_time}:00` : b.start_time,
          end_time: b.end_time.length === 5 ? `${b.end_time}:00` : b.end_time,
          is_active: b.is_active
        })) })
      });

      setMessage({ text: 'Availability saved successfully', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const addBlock = (weekday: number) => {
    // Add empty explicit time selections rather than silently defaulting to 09:00 - 17:00
    setBlocks([...blocks, { weekday, start_time: '', end_time: '', is_active: true }]);
  };

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const updateBlock = (index: number, field: keyof TimeBlock, value: any) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], [field]: value };
    setBlocks(newBlocks);
  };

  const toggleDay = (weekday: number, active: boolean) => {
    if (active) {
      addBlock(weekday);
    } else {
      setBlocks(blocks.filter(b => b.weekday !== weekday));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#87A878]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="font-serif text-2xl font-bold text-[#362E3B] dark:text-[#F5E6D3] flex items-center gap-3 mb-2">
          <CalendarIcon className="w-6 h-6 text-[#87A878]" />
          Weekly Availability
        </h2>
        <p className="text-sm text-[#6B5B73] dark:text-[#B8A9C9]">
          Configure your standard teaching hours. All times are in Cairo timezone. Google Calendar will automatically block conflicts within these hours.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border text-sm flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="space-y-4">
        {WEEKDAYS.map((day) => {
          const dayBlocks = blocks.map((b, i) => ({ ...b, index: i })).filter(b => b.weekday === day.id);
          const isActive = dayBlocks.length > 0;

          return (
            <motion.div
              key={day.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-3xl border transition-all ${
                isActive
                  ? 'bg-white dark:bg-[#231D28] border-[#87A878]/30 shadow-xs'
                  : 'bg-[#FAF8F5] dark:bg-[#1E1923] border-[#E8E3DD] dark:border-[#3E3545] opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-full sm:w-40 flex items-center justify-between sm:justify-start gap-3 pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isActive}
                      onChange={(e) => toggleDay(day.id, e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-[#D5D0CA] peer-focus:outline-none rounded-full peer dark:bg-[#3E3545] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#87A878]"></div>
                  </label>
                  <span className={`font-medium ${isActive ? 'text-[#362E3B] dark:text-[#F5E6D3]' : 'text-[#6B5B73] dark:text-[#8A8191]'}`}>
                    {day.label}
                  </span>
                </div>

                <div className="flex-1 space-y-3">
                  {!isActive && (
                    <div className="text-sm text-[#6B5B73] dark:text-[#8A8191] pt-2">
                      Unavailable
                    </div>
                  )}

                  {dayBlocks.map((block) => (
                    <div key={block.index} className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Clock className="w-4 h-4 text-[#87A878] absolute left-3 top-2.5 pointer-events-none" />
                          <input
                            type="time"
                            value={block.start_time ? block.start_time.substring(0, 5) : ''}
                            onChange={(e) => updateBlock(block.index, 'start_time', e.target.value)}
                            className="pl-9 pr-3 py-2 rounded-xl border border-[#D5D0CA] dark:border-[#3E3545] bg-[#FBF9F5] dark:bg-[#1A1620] text-sm text-[#362E3B] dark:text-[#F5E6D3] focus:ring-2 focus:ring-[#87A878] focus:border-transparent outline-none"
                          />
                        </div>
                        <span className="text-[#6B5B73] dark:text-[#8A8191]">-</span>
                        <div className="relative">
                          <Clock className="w-4 h-4 text-[#87A878] absolute left-3 top-2.5 pointer-events-none" />
                          <input
                            type="time"
                            value={block.end_time ? block.end_time.substring(0, 5) : ''}
                            onChange={(e) => updateBlock(block.index, 'end_time', e.target.value)}
                            className="pl-9 pr-3 py-2 rounded-xl border border-[#D5D0CA] dark:border-[#3E3545] bg-[#FBF9F5] dark:bg-[#1A1620] text-sm text-[#362E3B] dark:text-[#F5E6D3] focus:ring-2 focus:ring-[#87A878] focus:border-transparent outline-none"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => removeBlock(block.index)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                        title="Remove time block"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {isActive && (
                    <button
                      onClick={() => addBlock(day.id)}
                      className="flex items-center gap-1.5 text-sm font-medium text-[#87A878] hover:text-[#729263] transition-colors mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add another interval</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="pt-6 border-t border-[#D5D0CA] dark:border-[#3E3545] flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-[#362E3B] dark:bg-[#F5E6D3] hover:bg-[#251F2C] dark:hover:bg-white text-white dark:text-[#362E3B] rounded-2xl font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>Save Availability</span>
        </button>
      </div>
    </div>
  );
}
