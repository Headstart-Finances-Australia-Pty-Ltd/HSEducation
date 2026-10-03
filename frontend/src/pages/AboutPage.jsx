import { useState } from 'react';
import IMGS from '../images';
import Icon from '../components/Icon';
import Modal from '../components/Modal';

const initials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2);

const AboutPage = ({ setPage }) => {
  const [thanksOpen, setThanksOpen] = useState(false);
  return (
  <div className="page-enter">
    <div className="page-hero">
      <div className="page-hero-bg"><img src={IMGS.aboutMission} alt="Students with hands raised"/></div>
      <div className="page-hero-overlay"/>
      <div className="page-hero-content">
        <div className="section-label" style={{color:'#065f46'}}>About Headstart Education</div>
        <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(2rem,4vw,3rem)',color:'#064e3b',marginBottom:'1rem'}}>A New Charity With <em style={{color:'#065f46'}}>a Clear Purpose</em></h1>
        <p style={{color:'#065f46',fontSize:'1.05rem',lineHeight:1.7}}>A newly established Australian charity focused on advancing education for children in disadvantaged communities — currently preparing for our first project in India.</p>
      </div>
    </div>

    {/* Mission / Vision / Values */}
    <section className="section">
      <div className="section-inner">
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.5rem',marginBottom:'5rem'}}>
          {[
            {img:IMGS.missionKids,icon:'🎯',title:'Our Mission',text:'To improve educational outcomes for children in disadvantaged communities by directly providing the infrastructure and learning materials they need to succeed.'},
            {img:IMGS.communityGroup,icon:'🔭',title:'Our Vision',text:'Every child, regardless of location or financial background, has access to a safe and functional learning environment and the resources necessary for education.'},
            {img:IMGS.literacy,icon:'💎',title:'Our Values',text:'Integrity, transparency and rigorous safeguarding — with funds applied directly to charitable purposes and no cash grants to third parties.'},
          ].map(({img,icon,title,text}) => (
            <div key={title} style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:'16px',overflow:'hidden'}}>
              <div style={{height:'160px',overflow:'hidden'}}><img src={img} alt={title} style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>
              <div style={{padding:'1.5rem',textAlign:'center'}}>
                <div style={{fontSize:'2rem',marginBottom:'0.75rem'}}>{icon}</div>
                <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'0.75rem'}}>{title}</h3>
                <p style={{fontSize:'0.9rem',color:'var(--gray-600)',lineHeight:1.7}}>{text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Story */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4rem',alignItems:'center',marginBottom:'5rem'}}>
          <div>
            <div className="section-label">Our Story</div>
            <h2 className="section-title">Preparing For <em>Our First Project</em></h2>
            <p style={{color:'var(--gray-600)',lineHeight:1.8,marginBottom:'1rem',fontSize:'0.95rem'}}>Headstart Education Australia Pty Ltd was founded to directly provide disadvantaged schools with classroom infrastructure and learning materials — procured and delivered by us, rather than passed on as cash grants to third parties.</p>
            <p style={{color:'var(--gray-600)',lineHeight:1.8,marginBottom:'1rem',fontSize:'0.95rem'}}>Headstart Education is currently preparing for its first project in India. We are establishing the local structure and completing the necessary registration process before commencing project activities.</p>
            <p style={{color:'var(--gray-600)',lineHeight:1.8,fontSize:'0.95rem'}}>We've identified a school in a rural village in Uttar Pradesh with a genuine need for additional classroom infrastructure and learning resources, and we're keeping the school's identity confidential until our support is formally underway.</p>
          </div>
          <div style={{position:'relative'}}>
            <div style={{borderRadius:'16px',overflow:'hidden',boxShadow:'var(--shadow-md)',height:'380px'}}>
              <img src={IMGS.aboutFounders} alt="Founding directors planning" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </div>
            <div style={{position:'absolute',bottom:'-16px',left:'-16px',background:'white',borderRadius:'12px',padding:'1.2rem 1.5rem',boxShadow:'var(--shadow-md)',border:'1px solid var(--gray-200)'}}>
              <div style={{fontFamily:'var(--font-display)',fontSize:'1.4rem',fontWeight:700,color:'var(--teal)'}}>Newly<br/>Established</div>
              <div style={{fontSize:'0.8rem',color:'var(--gray-600)',marginTop:'4px'}}>Registered Australian charity</div>
            </div>
          </div>
        </div>

        {/* Journey */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4rem',alignItems:'start',marginBottom:'5rem'}}>
          <div>
            <div className="section-label">Our Journey</div>
            <h2 className="section-title" style={{marginBottom:'2rem'}}>What We've Done <em>So Far</em></h2>
            <div className="timeline">
              {[
                {year:'Stage 1',title:'Charity Established',text:'Headstart Education Australia Pty Ltd registered as an Australian charity, founded by Harsh Singh, Pramod Singh and Tavishi Makhija.'},
                {year:'Stage 2',title:'Founding Funding Committed',text:'$10,000 committed by our founding member to begin operations and governance set-up.'},
                {year:'Stage 3',title:'First School Identified',text:'A rural school in Uttar Pradesh, India identified as in genuine need of classroom infrastructure and learning resources.'},
                {year:'Stage 4',title:'Preparing to Launch',text:'Completing governance, safeguarding and local registration requirements before commencing our first project.'},
              ].map(({year,title,text}) => (
                <div key={year} className="timeline-item">
                  <div className="timeline-year">{year}</div>
                  <div className="timeline-title">{title}</div>
                  <div className="timeline-text">{text}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{position:'sticky',top:'100px'}}>
            <div style={{borderRadius:'16px',overflow:'hidden',boxShadow:'var(--shadow-md)',marginBottom:'1.5rem',height:'260px'}}>
              <img src={IMGS.infrastructure} alt="Classroom infrastructure" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </div>
            <div style={{borderRadius:'16px',overflow:'hidden',boxShadow:'var(--shadow-md)',height:'260px'}}>
              <img src={IMGS.communityGroup} alt="Community" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="section-label">Leadership Team</div>
        <h2 className="section-title" style={{marginBottom:'0.75rem'}}>The People <em>Behind the Mission</em></h2>
        <p className="section-desc" style={{marginBottom:'2.5rem'}}>Headstart Education is run by its three founding directors, who oversee all strategic, financial and operational decisions.</p>
        <div className="cards-grid cards-3">
          {[
            {name:'Harsh Singh',role:'Chairman & Director',bio:'Oversees all strategic, financial and operational decisions for Headstart Education Australia.'},
            {name:'Pramod Singh',role:'Director',bio:'Oversees strategic and financial decisions, including donor funds and governance compliance.'},
            {name:'Tavishi Makhija',role:'Director',bio:'Oversees operational decisions, including project delivery and on-the-ground coordination.'},
          ].map(({name,role,bio}) => (
            <div key={name} className="team-card">
              <div className="team-card-img" style={{display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,var(--navy),var(--teal))'}}>
                <span style={{color:'white',fontFamily:'var(--font-display)',fontSize:'2rem',fontWeight:700}}>{initials(name)}</span>
              </div>
              <div className="team-body">
                <div className="team-name">{name}</div>
                <div className="team-role">{role}</div>
                <div className="team-bio">{bio}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Contact */}
    <section className="section section-alt">
      <div className="section-inner">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4rem',alignItems:'center'}}>
          <div>
            <div className="section-label">Get In Touch</div>
            <h2 className="section-title">Contact <em>Headstart Education</em></h2>
            <p className="section-desc">Whether you're a donor, school, corporate partner, or community organisation, we'd love to hear from you.</p>
            <div style={{marginTop:'2rem'}}>
              {[{icon:'pin',label:'Registered Office',val:'Sydney, NSW 2000'},{icon:'mail',label:'General Enquiries',val:'info@hseducation.com.au'},{icon:'mail',label:'Donations & Receipts',val:'giving@hseducation.com.au'}].map(({icon,label,val}) => (
                <div key={label} style={{display:'flex',gap:'1rem',alignItems:'flex-start',marginBottom:'1.2rem'}}>
                  <div style={{width:36,height:36,background:'rgba(13,115,119,0.1)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Icon name={icon} size={18} color="var(--teal)"/></div>
                  <div><div style={{fontSize:'0.8rem',fontWeight:600,color:'var(--gray-500)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</div><div style={{fontSize:'0.9rem',color:'var(--gray-800)'}}>{val}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:'16px',padding:'2rem'}}>
            <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'1.5rem'}}>Send Us a Message</h3>
            <div className="form-group"><label className="form-label">Your Name</label><input className="form-input" placeholder="Jane Smith"/></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="jane@example.com.au"/></div>
            <div className="form-group"><label className="form-label">Organisation (optional)</label><input className="form-input" placeholder="School, Company, etc."/></div>
            <div className="form-group"><label className="form-label">Message</label><textarea className="form-input" rows={4} placeholder="How can we help?" style={{resize:'vertical'}}/></div>
            <button className="donate-btn" onClick={() => setThanksOpen(true)}>Send Message</button>
          </div>
        </div>
      </div>
    </section>
    <Modal open={thanksOpen} onClose={() => setThanksOpen(false)} title="Message sent" width={400}>
      <p style={{ marginBottom: '1.2rem', color: 'var(--gray-700)' }}>Thank you! We'll be in touch shortly.</p>
      <button className="donate-btn" onClick={() => setThanksOpen(false)}>OK</button>
    </Modal>
  </div>
  );
};



export default AboutPage;
