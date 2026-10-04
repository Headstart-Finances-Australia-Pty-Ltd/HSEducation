import { useState } from 'react';
import Logo from './Logo';
import Icon from './Icon';

const Nav = ({ page, setPage }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  // [page key, label] — Contact Us is the last tab
  const links = [['Home', 'Home'], ['About', 'About'], ['Projects', 'Projects'], ['Impact', 'Impact'], ['Legal', 'Legal'], ['Contact', 'Contact Us']];
  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="nav-logo" onClick={() => setPage('Home')}>
          <Logo size={44} />
          <div>
            <div className="nav-logo-text">Headstart Education</div>
            <div className="nav-logo-sub">Education for Children in Need</div>
          </div>
        </div>
        <div className="nav-links">
          {links.map(([k, label]) => (
            <span key={k} className={`nav-link${page === k ? ' active' : ''}`} onClick={() => setPage(k)}>{label}</span>
          ))}
          <button className="nav-cta" onClick={() => setPage('Donate')}>Donate Now</button>
        </div>
        <div className="nav-hamburger" onClick={() => setMobileOpen(o => !o)}>
          <Icon name={mobileOpen ? 'x' : 'menu'} size={22} />
        </div>
      </div>
      <div className={`nav-mobile${mobileOpen ? ' open' : ''}`}>
        {links.map(([k, label]) => (
          <span key={k} className={`nav-link${page === k ? ' active' : ''}`}
            onClick={() => { setPage(k); setMobileOpen(false); }}>{label}</span>
        ))}
        <button className="nav-cta" style={{ marginTop: '0.75rem', width: 'fit-content' }}
          onClick={() => { setPage('Donate'); setMobileOpen(false); }}>Donate Now</button>
      </div>
    </nav>
  );
};

export default Nav;
