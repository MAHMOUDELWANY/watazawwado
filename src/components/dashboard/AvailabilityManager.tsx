import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { dashboardFetch } from '../../dashboard/lib/dashboardApi';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AvailabilityManager() {
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const res = await dashboardFetch('/api/dashboard/availability');
      if (res.success && res.availability) {
        setAvailability(res.availability);
      }
    } catch (err: any) {
      console.error('Failed to load availability', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAvailability = async () => {
    setSaving(true);
    try {
      await dashboardFetch('/api/dashboard/availability', {
        method: 'PUT',
        body: JSON.stringify({ schedule: availability })
      });
      alert('Availability saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const addInterval = (weekday: number) => {
    setAvailability([...availability, { weekday, start_time: '09:00:00', end_time: '17:00:00', is_active: true }]);
  };

  const removeInterval = (index: number) => {
    const newAvail = [...availability];
    newAvail.splice(index, 1);
    setAvailability(newAvail);
  };

  const updateInterval = (index: number, field: string, value: any) => {
    const newAvail = [...availability];
    newAvail[index] = { ...newAvail[index], [field]: value };
    setAvailability(newAvail);
  };

  return (
    <div className="bg-surface rounded-2xl border border-border p-6 space-y-6 shadow-2xs">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-serif font-semibold text-foreground">Availability & Schedule</h2>
          <p className="text-xs text-muted-foreground mt-1">Configure your weekly working hours. These hours will be used to generate your bookable slots.</p>
        </div>
        <button
          onClick={handleSaveAvailability}
          disabled={saving || loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Schedule'}
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground text-center py-10">Loading schedule...</div>
      ) : (
        <div className="space-y-6">
          {DAYS.map((dayName, dayIndex) => {
            const dayIntervals = availability.map((a, i) => ({ ...a, originalIndex: i })).filter(a => a.weekday === dayIndex);
            const isActive = dayIntervals.length > 0;

            return (
              <div key={dayIndex} className="p-4 border border-border rounded-xl bg-surface-subtle">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer min-h-[24px]">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isActive}
                        onChange={(e) => {
                          if (e.target.checked) {
                            addInterval(dayIndex);
                          } else {
                            setAvailability(availability.filter(a => a.weekday !== dayIndex));
                          }
                        }}
                      />
                      <div className="w-9 h-5 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                    <span className="font-medium text-foreground text-sm">{dayName}</span>
                  </div>
                  {isActive && (
                    <button onClick={() => addInterval(dayIndex)} className="text-xs flex items-center gap-1 text-primary hover:text-primary/80">
                      <Plus className="w-3 h-3" /> Add Hours
                    </button>
                  )}
                </div>

                {isActive && (
                  <div className="space-y-3 pl-12">
                    {dayIntervals.map((interval, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <input
                          type="time"
                          value={interval.start_time.substring(0, 5)}
                          onChange={(e) => updateInterval(interval.originalIndex, 'start_time', e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-border bg-surface text-sm focus:border-primary outline-none w-[110px]"
                        />
                        <span className="text-muted-foreground text-sm">to</span>
                        <input
                          type="time"
                          value={interval.end_time.substring(0, 5)}
                          onChange={(e) => updateInterval(interval.originalIndex, 'end_time', e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-border bg-surface text-sm focus:border-primary outline-none w-[110px]"
                        />
                        <button
                          onClick={() => removeInterval(interval.originalIndex)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {!isActive && (
                  <div className="pl-12 text-sm text-muted-foreground opacity-60">Unavailable</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
