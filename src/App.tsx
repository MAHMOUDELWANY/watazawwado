import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TeacherAuthProvider } from './lib/auth';
import { LandingPage } from './LandingPage';
import { DashboardApp } from './dashboard/DashboardApp';
import StudentApp from './student/StudentApp';

export default function App() {
  return (
    <TeacherAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard/*" element={<DashboardApp />} />
          <Route path="/student/*" element={<StudentApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TeacherAuthProvider>
  );
}
