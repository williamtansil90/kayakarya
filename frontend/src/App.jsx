import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { useRoleRedirect } from './hooks/useRoleRedirect';
import Home from './pages/Home';
import CourseDetail from './pages/CourseDetail';
import MyCourses from './pages/MyCourses';
import TutorHome from './pages/tutor/TutorHome';
import TutorCourses from './pages/tutor/TutorCourses';
import CreateCourse from './pages/tutor/CreateCourse';
import EditCourse from './pages/tutor/EditCourse';
import TutorCourseDetail from './pages/tutor/TutorCourseDetail';
import TutorSales from './pages/tutor/TutorSales';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTutors from './pages/admin/AdminTutors';
import AdminCourses from './pages/admin/AdminCourses';
import AdminSales from './pages/admin/AdminSales';
import AdminWithdraws from './pages/admin/AdminWithdraws';
import AdminCommunity from './pages/admin/AdminCommunity';
import AdminHomepage from './pages/admin/AdminHomepage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AppRoutes() {
  useRoleRedirect();

  return (
    <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/course/:id" element={<CourseDetail />} />
            <Route path="/my-courses" element={<MyCourses />} />

            <Route path="/tutor" element={<TutorHome />} />
            <Route path="/tutor/courses" element={<TutorCourses />} />
            <Route path="/tutor/courses/new" element={<CreateCourse />} />
            <Route path="/tutor/courses/:id/edit" element={<EditCourse />} />
            <Route path="/tutor/courses/:id" element={<TutorCourseDetail />} />
            <Route path="/tutor/sales" element={<TutorSales />} />

            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/tutors" element={<AdminTutors />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/sales" element={<AdminSales />} />
            <Route path="/admin/withdraws" element={<AdminWithdraws />} />
            <Route path="/admin/community" element={<AdminCommunity />} />
            <Route path="/admin/homepage" element={<AdminHomepage />} />
          </Routes>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
