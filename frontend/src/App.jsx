import { useState, useEffect } from 'react';
import GlobalStyles from './components/GlobalStyles';
import Nav from './components/Nav';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ProjectsPage from './pages/ProjectsPage';
import ImpactPage from './pages/ImpactPage';
import DonatePage from './pages/DonatePage';
import LegalPage from './pages/LegalPage';
import ContactPage from './pages/ContactPage';
import AdminPage from './pages/AdminPage';
import { installImageFallback } from './images';

export default function App() {
  const [page, setPage] = useState('Home');

  useEffect(() => { installImageFallback(); }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const pages = {
    Home:     <HomePage    setPage={setPage} />,
    About:    <AboutPage   setPage={setPage} />,
    Projects: <ProjectsPage setPage={setPage} />,
    Impact:   <ImpactPage />,
    Donate:   <DonatePage />,
    Legal:    <LegalPage />,
    Contact:  <ContactPage />,
    // Admin is a normal page, reached only via the Footer link (it's not
    // in the main nav). It handles its own login — see AdminPage.jsx —
    // the real access control is enforced server-side by requireAdmin.
    Admin:    <AdminPage />,
  };

  return (
    <>
      <GlobalStyles />
      <Nav page={page} setPage={setPage} />
      <main>{pages[page]}</main>
      <Footer setPage={setPage} />
    </>
  );
}
