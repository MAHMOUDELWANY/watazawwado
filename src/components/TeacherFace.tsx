import React from 'react';
import { useTeacherPhoto } from '../lib/teacherPhotos';

/** The teacher's own photo when they uploaded one; otherwise the page's existing initial badge (passed as children). */
export function TeacherFace({ name, id, size, className = '', children }: { name?: string | null; id?: string | null; size: number; className?: string; children: React.ReactNode }) {
  const photo = useTeacherPhoto({ id, name });
  if (!photo) return <>{children}</>;
  return <img src={photo} alt="" width={size} height={size} loading="lazy" decoding="async" className={`shrink-0 rounded-full object-cover object-top bg-[#D8C6AE] ${className}`} style={{ width: size, height: size }} />;
}
