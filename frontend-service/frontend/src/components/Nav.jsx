import { useState } from 'react';
import Logo from './Logo';
import Icon from './Icon';

const Nav = ({ page, setPage }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = ['Home', 'About', 'Projects', 'Impact', 'Legal'];
  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="nav-logo" onClick={() => setPage('Home')}>
          <Logo size={44} />
          <div>
            <div className="nav-logo-text">Headstart Education</div>
            <div className="nav-logo-sub">Empowering Australian Learners</div>
          </div>
        </div>
        <div className="nav-links">
          {links.map(l => (
            <span key={l} className={`nav-link${page === l ? ' active' : ''}`} onClick={() => setPage(l)}>{l}</span>
          ))}
          <button className="nav-cta" onClick={() => setPage('Donate')}>Donate Now</button>
        </div>
        <div className="nav-hamburger" onClick={() => setMobileOpen(o => !o)}>
          <Icon name={mobileOpen ? 'x' : 'menu'} size={22} />
        </div>
      </div>
      <div className={`nav-mobile${mobileOpen ? ' open' : ''}`}>
        {links.map(l => (
          <span key={l} className={`nav-link${page === l ? ' active' : ''}`}
            onClick={() => { setPage(l); setMobileOpen(false); }}>{l}</span>
        ))}
        <button className="nav-cta" style={{ marginTop: '0.75rem', width: 'fit-content' }}
          onClick={() => { setPage('Donate'); setMobileOpen(false); }}>Donate Now</button>
      </div>
    </nav>
  );
};

export default Nav;
