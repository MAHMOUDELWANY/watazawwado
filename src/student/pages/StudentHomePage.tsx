import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, UserCircle, Target, Book, Sparkles, Calendar, Clock, Video, Plus, RotateCcw } from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { DateTime } from 'luxon';
import { findLastEligibleBooking, formatLastBookingSummary } from './StudentBookingPage';

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
  const lastEligibleBooking = findLastEligibleBooking(bookings);
  const lastBookingSummary = lastEligibleBooking ? formatLastBookingSummary(lastEligibleBooking, profile) : null;

  // Validate Zoom meeting link: never treat 'pending' or malformed strings as valid web URLs
  const rawZoom = (nextBooking?.zoomMeetingLink || nextBooking?.zoom_join_url || '').trim();
  const hasValidZoomUrl = Boolean(rawZoom && (rawZoom.startsWith('https://') || rawZoom.startsWith('http://')));

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
              {hasValidZoomUrl ? (
                <a 
                  href={rawZoom}
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
              {lastEligibleBooking ? (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs">
                  <span className="opacity-70">Schedule another session:</span>
                  <div className="flex items-center gap-2">
                    <Link
                      id="link-home-repeat-lesson"
                      to="/student/book?repeat=true"
                      className="font-medium text-[#6F907D] dark:text-[#8FAE9B] hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Repeat topic ({lastBookingSummary?.durationText})</span>
                    </Link>
                    <span className="opacity-30">•</span>
                    <Link
                      to="/student/book"
                      className="text-[#7A827B] dark:text-[#A69FA8] hover:underline"
                    >
                      New topic →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs">
                  <span className="opacity-70">Need another session?</span>
                  <Link
                    to="/student/book"
                    className="font-medium text-[#6F907D] dark:text-[#8FAE9B] hover:underline"
                  >
                    Book another lesson →
                  </Link>
                </div>
              )}
            </div>
          ) : lastEligibleBooking ? (
            <div className="py-2 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#557161] dark:text-[#A8C9B4]">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ready for your next session</span>
              </div>
              <div>
                <h4 className="font-medium text-lg text-[#362E3B] dark:text-[#F5E6D3]">
                  {lastBookingSummary?.serviceTitle || 'Continue Your Learning'}
                </h4>
                <p className="text-xs text-[#7A827B] dark:text-[#A69FA8] mt-0.5">
                  {lastBookingSummary?.summaryText ? `Last lesson: ${lastBookingSummary.summaryText}` : 'Continue from where you left off with Ustadh Mahmoud.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Link
                  id="btn-home-repeat-lesson"
                  to="/student/book?repeat=true"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#8FAE9B] hover:bg-[#6F907D] text-white rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Repeat Last Lesson</span>
                </Link>
                <Link
                  id="btn-home-book-different"
                  to="/student/book"
                  className="inline-flex items-center justify-center py-2.5 px-4 bg-[#FAF8F5] dark:bg-[#382F42] hover:bg-[#F2EFE9] dark:hover:bg-[#43394F] text-[#30332F] dark:text-[#F8F6F0] border border-[#E2DDD5] dark:border-[#473D50] rounded-xl text-xs sm:text-sm font-medium transition-colors"
                >
                  <span>Explore Topics</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm opacity-60 mb-4">Welcome to your student portal. Schedule your first lesson or trial with Ustadh Mahmoud.</p>
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
                {bookings.map(b => {
                  const isRepeatable = b.status === 'completed' || b.status === 'confirmed';
                  const bServiceId = b.serviceId || b.service_id || '';
                  return (
                    <li key={b.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div>
                        <div className="text-sm font-medium text-[#30332F] dark:text-[#F8F6F0]">
                          {b.serviceTitle || b.services?.title || 'Lesson'}
                        </div>
                        <div className="text-xs opacity-60">
                          {DateTime.fromISO(b.scheduledStart || b.lesson_date).toLocaleString(DateTime.DATE_MED)}
                          {b.durationMinutes || b.duration ? ` • ${b.durationMinutes || b.duration} min` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs capitalize font-medium px-2 py-1 rounded bg-white dark:bg-stone-700 shadow-xs border border-stone-100 dark:border-stone-600">
                          {b.status}
                        </span>
                        {isRepeatable && (
                          <Link
                            id={`btn-repeat-history-${b.id}`}
                            to={`/student/book?repeat=true${bServiceId ? `&service=${bServiceId}` : ''}`}
                            className="p-1.5 rounded-lg text-[#557161] hover:bg-[#8FAE9B]/15 dark:text-[#A8C9B4] transition-colors"
                            title="Repeat this lesson topic"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                })}
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
