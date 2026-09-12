import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, UserCircle, Target, Book, Sparkles, Calendar, Clock, Video, Plus } from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { DateTime } from 'luxon';

export default function StudentHomePage() {
  const { user, session } = useTeacherAuth();
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!session) return;
      try {
        const res = await fetch('/api/student/me', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }

        const bRes = await fetch('/api/student/bookings', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        if (bRes.ok) {
          const bData = await bRes.json();
          setBookings(bData);
        }
      } catch (err) {
        console.error('Error fetching student data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8FAE9B]"></div>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const nextBooking = upcomingBookings.length > 0 ? upcomingBookings[0] : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#362E3B] dark:text-[#F5E6D3]">
            Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm opacity-70 mt-1">
            Continue your learning journey with Ustadh Mahmoud
          </p>
        </div>
        <Link
          to="/student/book"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#8FAE9B] hover:bg-[#6F907D] text-white rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Book a Lesson</span>
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-[#362E3B] dark:text-[#F5E6D3]">Next Lesson</h3>
            </div>
            {upcomingBookings.length > 0 && (
              <span className="text-xs font-medium px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md">
                {upcomingBookings.length} Upcoming
              </span>
            )}
          </div>
          
          {nextBooking ? (
            <div className="py-2">
              <h4 className="font-medium text-lg mb-2">{nextBooking.serviceTitle || nextBooking.services?.title || 'Lesson'}</h4>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm opacity-80">
                  <Calendar className="w-4 h-4" />
                  <span>{DateTime.fromISO(nextBooking.scheduledStart || nextBooking.lesson_date).toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm opacity-80">
                  <Clock className="w-4 h-4" />
                  <span>
                    {DateTime.fromISO(nextBooking.scheduledStart || nextBooking.lesson_date).toLocaleString(DateTime.TIME_SIMPLE)}
                    {' '}({nextBooking.durationMinutes || nextBooking.duration} min)
                  </span>
                </div>
              </div>
              {(nextBooking.zoomMeetingLink || nextBooking.zoom_join_url) ? (
                <a 
                  href={nextBooking.zoomMeetingLink || nextBooking.zoom_join_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#8FAE9B] hover:bg-[#6F907D] text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <Video className="w-4 h-4" />
                  Join Class
                </a>
              ) : (
                <div className="w-full text-center py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl text-sm font-medium">
                  Meeting link will appear soon
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs">
                <span className="opacity-70">Need another session?</span>
                <Link
                  to="/student/book"
                  className="font-medium text-[#6F907D] dark:text-[#8FAE9B] hover:underline"
                >
                  Book another lesson →
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm opacity-60 mb-4">Your learning journey will appear here after your first booking.</p>
              <Link 
                to="/student/book"
                className="inline-flex px-4 py-2 bg-[#8FAE9B] hover:bg-[#6F907D] text-white rounded-xl text-sm font-medium transition-colors"
              >
                Book a Lesson
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-[#362E3B] dark:text-[#F5E6D3]">Learning History</h3>
          </div>
          
          <div className="py-2 max-h-[220px] overflow-y-auto">
            {bookings.length > 0 ? (
              <ul className="space-y-3">
                {bookings.map(b => (
                  <li key={b.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <div className="text-sm font-medium">{b.serviceTitle || b.services?.title || 'Lesson'}</div>
                      <div className="text-xs opacity-60">{DateTime.fromISO(b.scheduledStart || b.lesson_date).toLocaleString(DateTime.DATE_MED)}</div>
                    </div>
                    <div className="text-xs capitalize font-medium px-2 py-1 rounded bg-white dark:bg-stone-700 shadow-sm border border-stone-100 dark:border-stone-600">
                      {b.status}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm opacity-60 mb-2">No past lessons found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
