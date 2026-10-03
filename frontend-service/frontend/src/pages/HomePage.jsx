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
      <img src={IMGS.heroStudents} alt="Diverse Australian students in classroom" className="hero-bg-img"/>
      <div className="hero-overlay"/>
      <div className="hero-dots"/>
      <div className="hero-inner">
        <div>
          <div className="hero-badge">🇦🇺 Registered Australian Charity</div>
          <h1 className="hero-title">Transforming Lives Through<br/><strong>Education & Opportunity</strong></h1>
          <p className="hero-desc">Headstart Education funds scholarships, learning support programs, and community initiatives to ensure every Australian student — regardless of background — has the chance to thrive.</p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => setPage('Donate')}><Icon name="heart" size={18}/> Donate Today</button>
            <button className="btn-outline" onClick={() => setPage('Projects')}>Our Programs <Icon name="arrow" size={16}/></button>
          </div>
          <div className="hero-stats">
            {[['4,200+','Students Supported'],['$3.8M','Funds Distributed'],['87%','To Programs']].map(([v,l]) => (
              <div key={l} className="hero-stat"><div className="hero-stat-num">{v}</div><div className="hero-stat-label">{l}</div></div>
            ))}
          </div>
        </div>
        {/* Hero right — image card */}
        <div className="hero-img-card">
          <img src={IMGS.literacy} alt="Child learning to read"/>
          <div className="hero-img-card-overlay">
            <div className="hero-img-badge">✨ 2024 Impact</div>
            <div className="hero-img-caption">Over 4,200 students supported this year across Australia</div>
          </div>
        </div>
      </div>
    </section>

    {/* IMPACT STRIP */}
    <div className="impact-strip">
      <div className="impact-strip-inner">
        {[['4,200+','Students Supported Annually'],['$3.8M','Total Funds Distributed'],['47','Schools & Communities'],['92%','Donor Satisfaction']].map(([v,l]) => (
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
              <div className="mission-img-badge-num">87¢</div>
              <div className="mission-img-badge-text">of every dollar goes<br/>to programs</div>
            </div>
          </div>
          <div>
            <div className="section-label">Our Mission</div>
            <h2 className="section-title">Closing the Education Gap <em>Across Australia</em></h2>
            <p className="section-desc">Headstart Education removes barriers preventing young Australians from accessing quality education. We work with schools, families and communities across metropolitan, regional and remote Australia.</p>
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

    {/* PROGRAMS PREVIEW */}
    <section className="section section-alt">
      <div className="section-inner">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:'1rem',marginBottom:'0.5rem'}}>
          <div>
            <div className="section-label">Our Programs</div>
            <h2 className="section-title" style={{marginBottom:'0.5rem'}}>Current <em>Projects & Initiatives</em></h2>
          </div>
          <button className="btn-teal" onClick={() => setPage('Projects')}>View All Projects</button>
        </div>
        <p className="section-desc" style={{marginBottom:'0'}}>Funded programs making measurable impact across Australia right now.</p>
        <div className="cards-grid cards-3">
          {[
            {img:IMGS.scholarship,tag:'Scholarship',title:'Future Leaders Bursary',desc:'Annual scholarships of up to $5,000 for high-achieving Year 11/12 students from low-income households in NSW and Victoria.',pct:72,goal:'$180,000'},
            {img:IMGS.literacy,tag:'Literacy',title:'Read to Succeed',desc:'Intensive 10-week literacy intervention program delivered in 12 primary schools across regional QLD and SA.',pct:88,goal:'$95,000'},
            {img:IMGS.indigenous,tag:'Indigenous',title:'Remote Learning Connect',desc:'Providing connectivity, devices and culturally appropriate learning materials to First Nations students in remote NT and WA.',pct:55,goal:'$240,000'},
          ].map(({img,tag,title,desc,pct,goal}) => (
            <div key={title} className="prog-card">
              <div className="prog-card-img"><img src={img} alt={title}/><div className="prog-card-img-overlay"/></div>
              <div className="prog-card-body">
                <span className="prog-tag">{tag}</span>
                <div className="prog-title">{title}</div>
                <p className="prog-text">{desc}</p>
                <div className="prog-progress"><div className="prog-progress-bar" style={{width:`${pct}%`}}/></div>
                <div className="prog-meta"><span>{pct}% funded</span><span>Goal: <strong>{goal}</strong></span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* TESTIMONIALS */}
    <section className="section">
      <div className="section-inner">
        <div className="section-label">Stories of Impact</div>
        <h2 className="section-title">Lives Changed Through <em>Education</em></h2>
        <div className="cards-grid cards-3">
          {[
            {img:IMGS.person1,quote:'"The Headstart Education scholarship meant I could focus on my Year 12 exams instead of worrying about rent. I\'m now studying nursing at UQ — it changed everything for me."',name:'Alysha M.',role:'Scholarship Recipient, Brisbane QLD'},
            {img:IMGS.person2,quote:'"As a principal in regional NSW, we\'ve seen remarkable improvements in reading levels since Headstart Education partnered with our school for the literacy program."',name:'James T.',role:'Principal, Dubbo Central School'},
            {img:IMGS.person3,quote:'"I never thought I\'d finish Year 12. The mentoring and support from Headstart Education gave me the confidence to complete school and start my apprenticeship."',name:'Dylan W.',role:'Vocational Pathway Graduate, Adelaide SA'},
          ].map(({img,quote,name,role}) => (
            <div key={name} className="testi-card">
              <div className="testi-quote-mark">"</div>
              <p className="testi-text">{quote}</p>
              <div className="testi-author">
                <div className="testi-avatar"><img src={img} alt={name}/></div>
                <div><div className="testi-name">{name}</div><div className="testi-role">{role}</div></div>
              </div>
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
        <div className="section-label" style={{color:'var(--gold-light)'}}>Make a Difference Today</div>
        <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(1.8rem,3vw,2.6rem)',color:'white',marginBottom:'1rem'}}>
          Every Dollar Invested in Education <em style={{color:'var(--gold-light)'}}>Changes a Life</em>
        </h2>
        <p style={{color:'rgba(255,255,255,0.82)',fontSize:'1.05rem',marginBottom:'2rem',lineHeight:1.7}}>
          Join thousands of Australians supporting Headstart Education. Your tax-deductible donation funds real programs for real students right across Australia.
        </p>
        <div style={{display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap'}}>
          <button className="btn-primary" onClick={() => setPage('Donate')}><Icon name="heart" size={18}/> Donate Now</button>
          <button className="btn-outline" onClick={() => setPage('Impact')}>See Our Impact</button>
        </div>
      </div>
    </div>
  </div>
);


export default HomePage;
