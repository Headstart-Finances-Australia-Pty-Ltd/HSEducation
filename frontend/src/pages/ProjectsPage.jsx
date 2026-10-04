import { useState, useEffect } from 'react';
import IMGS from '../images';
import Icon from '../components/Icon';
import API_URL from '../config';

const STATUS_LABEL = { fundraising: 'Fundraising', active: 'In Progress', paused: 'Paused', completed: 'Completed' };
// Shown when a project has no picture of its own.
const DEFAULT_IMG = { Infrastructure: 'infrastructure', Scholarships: 'scholarship', Literacy: 'literacy', Vocational: 'regional', Indigenous: 'communityGroup', General: 'missionKids' };
const money = (v) => `$${Number(v || 0).toLocaleString('en-AU', { maximumFractionDigits: 0 })}`;
const imageFor = (p) => (p.image_url ? (/^https?:/i.test(p.image_url) ? p.image_url : `${API_URL}${p.image_url}`) : IMGS[DEFAULT_IMG[p.category] || 'infrastructure']);

// One project from Admin Console → Projects. Tiles sit two across; a lone tile is centred.
const ProjectTile = ({ p, setPage }) => {
  const goal = Number(p.goal_amount) || 0, raised = Number(p.raised_amount) || 0;
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  const fallback = IMGS[DEFAULT_IMG[p.category] || 'infrastructure'];
  return (
    <article className="project-tile">
      <div className="project-tile-img">
        <img src={imageFor(p)} alt={p.name} onError={(e) => { if (e.target.src !== fallback) e.target.src = fallback; }} />
        <span className="project-tile-status">{STATUS_LABEL[p.status] || p.status}</span>
      </div>
      <div className="project-tile-body">
        <span className="prog-tag">{p.category}</span>
        <h3 className="project-tile-title">{p.name}</h3>
        {p.location && <div className="project-tile-loc"><Icon name="pin" size={12} /> {p.location}</div>}
        {p.description && <p className="project-tile-text">{p.description}</p>}
        {goal > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--teal), var(--gold))', borderRadius: 100 }} />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '0.4rem' }}>
              <strong style={{ color: 'var(--navy)' }}>{money(raised)}</strong> raised of {money(goal)} goal
            </div>
          </div>
        )}
        <button className="btn-teal" style={{ marginTop: 'auto', alignSelf: 'flex-start' }} onClick={() => setPage('Donate')}>Support This Project</button>
      </div>
    </article>
  );
};

const ProjectsPage = ({ setPage }) => {
  const [projects, setProjects] = useState(null);       // null = loading
  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/api/programs?visible=true`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (alive) setProjects(Array.isArray(d) ? d : []); })
      .catch(() => { if (alive) setProjects([]); });
    return () => { alive = false; };
  }, []);

  const phases = [
    {n:'1',title:'Needs Verification',text:'Identify and assess schools in need, with on-site visits confirming educational and infrastructure gaps.'},
    {n:'2',title:'Procurement & Delivery',text:'Purchase and directly deliver classroom infrastructure and learning materials — no cash grants to third parties.'},
    {n:'3',title:'Monitoring & Reporting',text:'Document delivery, maintain financial and operational records, and evaluate whether resources met the identified needs.'},
    {n:'4',title:'Expansion',text:'As funding allows, extend support to other disadvantaged communities internationally and introduce scholarships.'},
  ];

  return (
    <div className="page-enter">
      <div className="page-hero">
        <div className="page-hero-bg"><img src={IMGS.communityGroup} alt="Education programs"/></div>
        <div className="page-hero-overlay"/>
        <div className="page-hero-content">
          <div className="section-label">Our Projects</div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(2rem,4vw,3rem)',marginBottom:'1rem'}}>Our First Project Is <em>In Development</em></h1>
          <p style={{fontSize:'1.05rem'}}>We directly provide schools with infrastructure, learning materials and, where funding permits, scholarships — starting with a school in rural India.</p>
        </div>
      </div>

      <section className="section">
        <div className="section-inner">
          {/* Projects — managed in Admin Console → Projects */}
          <div style={{textAlign:'center',marginBottom:'2rem'}}>
            <div className="section-label">Current Projects</div>
            <h2 className="section-title" style={{marginBottom:0}}>Where Your Support <em>Goes</em></h2>
          </div>
          {projects === null && <p style={{textAlign:'center',color:'var(--gray-600)',marginBottom:'4rem'}}>Loading projects…</p>}
          {projects && projects.length === 0 && (
            <div style={{maxWidth:560,margin:'0 auto 4rem',textAlign:'center',background:'white',border:'1px solid var(--gray-200)',borderRadius:'16px',padding:'2rem'}}>
              <p style={{color:'var(--gray-700)',lineHeight:1.7}}>Details of our first project will be published here soon. In the meantime you can <a style={{color:'var(--teal)',fontWeight:600,cursor:'pointer'}} onClick={() => setPage('Donate')}>support our work</a> or <a style={{color:'var(--teal)',fontWeight:600,cursor:'pointer'}} onClick={() => setPage('Contact')}>get in touch</a>.</p>
            </div>
          )}
          {projects && projects.length > 0 && (
            <div className="project-tiles">
              {projects.map((p) => <ProjectTile key={p.id} p={p} setPage={setPage} />)}
            </div>
          )}

          {/* How we work */}
          <div className="section-label">How We Work</div>
          <h2 className="section-title" style={{marginBottom:'2.5rem'}}>From Needs Assessment <em>to Delivery</em></h2>
          <div className="cards-grid cards-4" style={{marginTop:0}}>
            {phases.map(({n,title,text}) => (
              <div key={n} style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:'16px',padding:'1.5rem'}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'var(--navy)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-display)',fontWeight:700,marginBottom:'1rem'}}>{n}</div>
                <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',fontSize:'1rem',marginBottom:'0.5rem'}}>{title}</h3>
                <p style={{fontSize:'0.85rem',color:'var(--gray-600)',lineHeight:1.6}}>{text}</p>
              </div>
            ))}
          </div>

          {/* Operating model */}
          <div style={{marginTop:'4rem',background:'rgba(13,115,119,0.06)',border:'1px solid var(--teal)',borderRadius:'16px',padding:'2rem'}}>
            <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'0.75rem'}}>Our Operating Model</h3>
            <p style={{fontSize:'0.92rem',color:'var(--gray-700)',lineHeight:1.7}}>We procure and deliver educational resources directly to schools ourselves — we do not make cash grants to third parties. This keeps our model simple to verify: every dollar is tied to a resource we purchased and delivered, documented, and can report on.</p>
          </div>
        </div>
      </section>

      <div className="impact-banner">
        <div className="impact-banner-bg"><img src={IMGS.impactBanner} alt="Students"/></div>
        <div className="impact-banner-overlay"/>
        <div className="impact-banner-content">
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(1.8rem,3vw,2.4rem)',marginBottom:'1rem'}}>Help Us Launch Our First Project</h2>
          <p style={{marginBottom:'2rem',fontSize:'1.05rem'}}>Your donation goes directly toward classroom infrastructure and learning materials.</p>
          <button className="btn-primary" onClick={() => setPage('Donate')}><Icon name="heart" size={18}/> Donate Now</button>
        </div>
      </div>
    </div>
  );
};


export default ProjectsPage;
