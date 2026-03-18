import React from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import client from './lib/apolloClient';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Roadmap from './pages/Roadmap';
import ModuleDetail from './pages/ModuleDetail';
import Assessment from './pages/Assessment';
import Progress from './pages/Progress';
import AIAssistant from './pages/AIAssistant';
import Profile from './pages/Profile';

import loginIllustration from './assets/login-illustration.png';

const AuthLayout = ({ children }) => (
  <div className="min-h-screen bg-[#f0fdf8] flex items-center justify-center px-6">
    <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl grid grid-cols-1 md:grid-cols-2 overflow-hidden">

      {/* LEFT PANEL */}
      <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>

      {/* RIGHT PANEL */}
      <div className="bg-gradient-to-br from-emerald-600 to-green-900 text-white p-10 flex flex-col justify-between">
        <h1 className="text-3xl font-bold">ANUBHAVA</h1>

        <div>
          <h2 className="text-2xl font-semibold mb-4">
            Learn. Track. Grow.
          </h2>
          <p className="text-emerald-100 max-w-sm mb-10">
            A personalized education platform designed to help students
            learn smarter, track progress, and achieve goals efficiently.
          </p>

          <div className="flex justify-center">
            <div className="w-64 h-64 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <img
                src={loginIllustration}
                alt="Authentication illustration"
                className="w-44"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={
                <AuthLayout>
                  <Login />
                </AuthLayout>
              }
            />
            <Route
              path="/register"
              element={
                <AuthLayout>
                  <Register />
                </AuthLayout>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="roadmap" element={<Roadmap />} />
              {/* <Route path="roadmap/create" element={<CreateRoadmap />} /> */}
              <Route path="roadmap/module/:moduleId" element={<ModuleDetail />} />
              <Route path="assessment/:moduleId" element={<Assessment />} />
              <Route path="progress" element={<Progress />} />
              <Route path="ai-assistant" element={<AIAssistant />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ApolloProvider>
  );
}

export default App;