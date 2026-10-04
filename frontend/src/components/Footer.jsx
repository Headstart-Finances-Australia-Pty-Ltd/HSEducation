import Logo from './Logo';

const Footer = ({ setPage }) => (
  <footer className="footer">
    <div className="footer-inner">
      <div className="footer-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', cursor: 'pointer' }} onClick={() => setPage('Home')}>
            <Logo size={28} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.85rem' }}>Headstart Education</div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>hseducation.com.au</div>
            </div>
          </div>
          <p className="footer-brand">An Australian charity founded by educators, social workers and experienced professionals, directly providing classroom infrastructure and learning materials to disadvantaged schools — starting in India.</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <div className="footer-acnc">ACNC Registered</div>
          </div>
          <div style={{ marginTop: '0.4rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>Headstart Education Australia Pty Ltd</div>
        </div>
        <div>
          <div className="footer-col-title">Navigation</div>
          <ul className="footer-links">
            {[['Home', 'Home'], ['About', 'About'], ['Projects', 'Projects'], ['Impact', 'Impact'], ['Donate', 'Donate'], ['Legal', 'Legal'], ['Contact', 'Contact Us']].map(([k, label]) => (
              <li key={k}><a onClick={() => setPage(k)}>{label}</a></li>
            ))}
            <li><a onClick={() => setPage('Admin')}>Admin</a></li>
          </ul>
        </div>
        <div>
          <div className="footer-col-title">Our Focus</div>
          <ul className="footer-links">
            {['Classroom Infrastructure', 'Learning Materials', 'Scholarships (Future)', 'Our First Project: India', 'Volunteer With Us', 'Fundraising Events'].map(t => (
              <li key={t}><a>{t}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <div className="footer-col-title">Contact</div>
          <ul className="footer-links">
            <li><a>📍 Sydney NSW 2000</a></li>
            <li><a>📧 info@hseducation.org</a></li>
          </ul>
          <div style={{ marginTop: '0.75rem' }}>
            <div className="footer-col-title">Follow Us</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['in', 'f', '𝕏', 'ig'].map(s => (
                <div key={s} style={{ width: 24, height: 24, background: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontWeight: 700 }}>{s}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Headstart Education Australia Pty Ltd. All rights reserved. Registered Australian Charity.</span>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <a style={{ cursor: 'pointer' }} onClick={() => setPage('Legal')}>Privacy Policy</a>
          <a style={{ cursor: 'pointer' }} onClick={() => setPage('Legal')}>Terms of Use</a>
          <a style={{ cursor: 'pointer' }} onClick={() => setPage('Legal')}>Complaints</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
