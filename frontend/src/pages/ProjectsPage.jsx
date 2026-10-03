import IMGS from '../images';
import Icon from '../components/Icon';

const ProjectsPage = ({ setPage }) => {
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
          <div className="section-label" style={{color:'#065f46'}}>Our Projects</div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(2rem,4vw,3rem)',color:'#064e3b',marginBottom:'1rem'}}>Our First Project Is <em style={{color:'#065f46'}}>In Development</em></h1>
          <p style={{color:'#065f46',fontSize:'1.05rem'}}>We directly provide schools with infrastructure, learning materials and, where funding permits, scholarships — starting with a school in rural India.</p>
        </div>
      </div>

      <section className="section">
        <div className="section-inner">
          {/* Featured project */}
          <div className="prog-card" style={{display:'grid',gridTemplateColumns:'1fr 1.2fr',gap:0,marginBottom:'4rem',maxWidth:'none'}}>
            <div className="prog-card-img" style={{height:'auto'}}>
              <img src={IMGS.infrastructure} alt="Classroom infrastructure" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              <div className="prog-card-img-overlay"/>
              <span style={{position:'absolute',top:'1rem',right:'1rem',background:'rgba(212,160,23,0.92)',color:'white',fontSize:'0.73rem',fontWeight:700,padding:'0.25rem 0.75rem',borderRadius:'100px'}}>In Development</span>
            </div>
            <div className="prog-card-body" style={{padding:'2rem'}}>
              <span className="prog-tag">Infrastructure</span>
              <div className="prog-title" style={{fontSize:'1.3rem'}}>Rural School, Uttar Pradesh — India</div>
              <div style={{fontSize:'0.78rem',color:'var(--gray-500)',marginBottom:'0.75rem',display:'flex',alignItems:'center',gap:'4px'}}><Icon name="pin" size={12}/> Uttar Pradesh, India (location kept confidential for now)</div>
              <p className="prog-text" style={{fontSize:'0.92rem'}}>Our first project is currently in development. We have identified a school in a rural village in Uttar Pradesh where there is a need for additional classroom infrastructure and learning resources. We are currently completing the groundwork required to begin supporting the school.</p>
              <div style={{marginTop:'1rem'}}>
                <div style={{fontSize:'0.8rem',fontWeight:600,color:'var(--gray-700)',marginBottom:'0.5rem'}}>What we plan to provide:</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',marginBottom:'1.2rem'}}>
                  {['Desks & chairs','Learning materials','Books & stationery','Basic classroom equipment'].map(t => (
                    <span key={t} style={{background:'rgba(13,115,119,0.08)',color:'var(--teal)',fontSize:'0.8rem',fontWeight:600,padding:'0.3rem 0.8rem',borderRadius:'100px'}}>{t}</span>
                  ))}
                </div>
              </div>
              <button className="btn-teal" onClick={() => setPage('Donate')}>Support This Project</button>
            </div>
          </div>

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
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(1.8rem,3vw,2.4rem)',color:'#064e3b',marginBottom:'1rem'}}>Help Us Launch Our First Project</h2>
          <p style={{color:'#065f46',marginBottom:'2rem',fontSize:'1.05rem'}}>Your donation goes directly toward classroom infrastructure and learning materials.</p>
          <button className="btn-primary" onClick={() => setPage('Donate')}><Icon name="heart" size={18}/> Donate Now</button>
        </div>
      </div>
    </div>
  );
};


export default ProjectsPage;
