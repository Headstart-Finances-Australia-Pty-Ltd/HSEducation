import IMGS from '../images';
import Icon from '../components/Icon';

const CheckItem = ({ text }) => (
  <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'0.8rem',fontSize:'0.92rem',color:'var(--gray-700)'}}>
    <span style={{width:22,height:22,background:'var(--teal)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      <Icon name="check" size={13} color="white"/>
    </span>
    {text}
  </div>
);

const HomePage = ({ setPage }) => (
  <div className="page-enter">
    {/* HERO */}
    <section className="hero">
      <img src={IMGS.heroStudents} alt="Children in a classroom" className="hero-bg-img"/>
      <div className="hero-overlay"/>
      <div className="hero-dots"/>
      <div className="hero-inner">
        <div>
          <div className="hero-badge">Registered Australian Charity</div>
          <h1 className="hero-title">Building Brighter Futures<br/><strong>Through Education</strong></h1>
          <p className="hero-desc">Headstart Education Australia directly provides disadvantaged schools with classroom infrastructure and learning materials — and scholarships where funding allows. We work on direct procurement and delivery, with no cash grants to third parties.</p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => setPage('Donate')}><Icon name="heart" size={18}/> Donate Today</button>
            <button className="btn-outline" onClick={() => setPage('Projects')}>Our Projects <Icon name="arrow" size={16}/></button>
          </div>

        </div>
        {/* Hero right — image card */}
        <div className="hero-img-card">
          <img src={IMGS.literacy} alt="Child learning to read"/>
          <div className="hero-img-card-overlay">
            <div className="hero-img-badge">🌱 Just Getting Started</div>
            <div className="hero-img-caption">Our first project is in development: a rural school in Uttar Pradesh, India</div>
          </div>
        </div>
      </div>
    </section>

    {/* APPROACH STRIP */}
    <div className="impact-strip">
      <div className="impact-strip-inner">
        {[['Direct Delivery','We procure and deliver resources ourselves'],['$0','Cash grants paid to third parties'],['1','Project currently in development'],['100%','Of eligible funds applied to charitable purposes']].map(([v,l]) => (
          <div key={l} className="impact-num"><span className="impact-num-val">{v}</span><div className="impact-num-label">{l}</div></div>
        ))}
      </div>
    </div>

    {/* MISSION SPLIT */}
    <section className="section">
      <div className="section-inner">
        <div className="mission-grid">
          <div className="mission-img-wrap">
            <div className="img-feature" style={{height:'480px'}}>
              <img src={IMGS.missionKids} alt="Students studying together" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </div>
            <div className="mission-img-badge">
              <div className="mission-img-badge-num">$10K</div>
              <div className="mission-img-badge-text">committed by our<br/>founding member</div>
            </div>
          </div>
          <div>
            <div className="section-label">Our Mission</div>
            <h2 className="section-title">Improving Educational Outcomes <em>Where It's Needed Most</em></h2>
            <p className="section-desc">We improve educational outcomes for children in disadvantaged communities by directly providing the infrastructure and learning materials they need to succeed — starting with a school in rural India, with plans to extend to other disadvantaged communities internationally.</p>
            <div style={{marginTop:'2rem'}}>
              {['Registered Australian charity','Direct procurement & delivery — no cash grants to third parties','Every project independently verified before funding begins','Transparent reporting as we grow'].map(t => <CheckItem key={t} text={t}/>)}
            </div>
            <button className="btn-primary" style={{marginTop:'1.5rem'}} onClick={() => setPage('About')}>
              Learn About Us <Icon name="arrow" size={16}/>
            </button>
          </div>
        </div>
      </div>
    </section>

    {/* PROJECTS PREVIEW */}
    <section className="section section-alt">
      <div className="section-inner">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:'1rem',marginBottom:'0.5rem'}}>
          <div>
            <div className="section-label">Our Projects</div>
            <h2 className="section-title" style={{marginBottom:'0.5rem'}}>Where We're <em>Starting</em></h2>
          </div>
          <button className="btn-teal" onClick={() => setPage('Projects')}>View All Projects</button>
        </div>
        <p className="section-desc" style={{marginBottom:'0'}}>We're a newly established charity — here's what we're working on right now, and what comes next.</p>
        <div className="cards-grid cards-3">
          {[
            {img:IMGS.infrastructure,tag:'In Development',title:'First Project — Uttar Pradesh, India',desc:'We\'ve identified a rural school in need of additional classroom infrastructure and learning resources, and are completing the groundwork required to begin supporting it.'},
            {img:IMGS.literacy,tag:'Future Plans',title:'Learning Materials & Resources',desc:'Books, stationery and consumables supplied directly to schools as each project is verified and funded.'},
            {img:IMGS.scholarship,tag:'Future Plans',title:'Scholarships',desc:'Where funding allows, we intend to offer scholarships to high-achieving or disadvantaged students.'},
          ].map(({img,tag,title,desc}) => (
            <div key={title} className="prog-card">
              <div className="prog-card-img"><img src={img} alt={title}/><div className="prog-card-img-overlay"/></div>
              <div className="prog-card-body">
                <span className="prog-tag">{tag}</span>
                <div className="prog-title">{title}</div>
                <p className="prog-text">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* WHY WE STARTED */}
    <section className="section">
      <div className="section-inner">
        <div className="section-label">Why We Started</div>
        <h2 className="section-title">A Newly Established Charity <em>With a Clear Purpose</em></h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.5rem',marginTop:'2.5rem'}}>
          {[
            {icon:'🎯',title:'What We Are',text:'A newly established Australian charity focused on advancing education for children in disadvantaged communities.'},
            {icon:'🧭',title:'What We Intend To Do',text:'Directly provide schools with infrastructure and learning materials, and scholarships where funding permits.'},
            {icon:'✅',title:'What We\'ve Done So Far',text:'Established the Australian charity, identified an initial school requiring support, and begun preparing to deliver our first project.'},
          ].map(({icon,title,text}) => (
            <div key={title} style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:'16px',padding:'1.75rem',textAlign:'center'}}>
              <div style={{fontSize:'2rem',marginBottom:'0.75rem'}}>{icon}</div>
              <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'0.75rem',fontSize:'1.05rem'}}>{title}</h3>
              <p style={{fontSize:'0.9rem',color:'var(--gray-600)',lineHeight:1.7}}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA BANNER with background image */}
    <div className="impact-banner">
      <div className="impact-banner-bg"><img src={IMGS.impactBanner} alt="Students raising hands"/></div>
      <div className="impact-banner-overlay"/>
      <div className="impact-banner-content">
        <div className="section-label" style={{color:'#0d7377'}}>Help Us Get Started</div>
        <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(1.8rem,3vw,2.6rem)',color:'#064e3b',marginBottom:'1rem'}}>
          Every Dollar Funds <em style={{color:'#0d7377'}}>Real Classroom Resources</em>
        </h2>
        <p style={{color:'#065f46',fontSize:'1.05rem',marginBottom:'2rem',lineHeight:1.7}}>
          Your donation directly funds classroom infrastructure and learning materials for our first project — a rural school in Uttar Pradesh, India.
        </p>
        <div style={{display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap'}}>
          <button className="btn-primary" onClick={() => setPage('Donate')}><Icon name="heart" size={18}/> Donate Now</button>
          <button className="btn-outline" onClick={() => setPage('Impact')}>See Our Progress</button>
        </div>
      </div>
    </div>
  </div>
);


export default HomePage;
