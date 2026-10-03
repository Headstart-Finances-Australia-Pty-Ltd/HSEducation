import { useState } from 'react';
import IMGS from '../images';
import Icon from '../components/Icon';

const ImpactPage = () => {
  const [tab, setTab] = useState('impact');
  return (
    <div className="page-enter">
      <div className="page-hero">
        <div className="page-hero-bg"><img src={IMGS.impactBanner} alt="Students in class"/></div>
        <div className="page-hero-overlay"/>
        <div className="page-hero-content">
          <div className="section-label" style={{color:'#065f46'}}>Transparency & Impact</div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(2rem,4vw,3rem)',color:'#064e3b',marginBottom:'1rem'}}>Transparency From Day One</h1>
          <p style={{color:'#065f46',fontSize:'1.05rem',lineHeight:1.7}}>We're a newly established charity. Our first project hasn't launched yet, so there's no impact data to report — but here's exactly where we stand, and how we'll report as we grow.</p>
        </div>
      </div>

      <section className="section">
        <div className="section-inner">
          <div className="tabs">
            {[['impact','📊 Current Stage'],['financials','💰 Financials'],['reports','📄 Annual Reports'],['governance','🏛 Governance']].map(([k,l]) => (
              <div key={k} className={`tab${tab===k?' active':''}`} onClick={() => setTab(k)}>{l}</div>
            ))}
          </div>

          {tab==='impact' && (
            <div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1.5rem',marginBottom:'3rem'}}>
                {[{val:'0',label:'Projects Completed',sub:'We are a newly established charity'},{val:'1',label:'Project In Development',sub:'Rural school, Uttar Pradesh, India'},{val:'1',label:'Country of Focus',sub:'India, with plans to expand'},{val:'$10,000',label:'Founding Funding',sub:'Committed by our founding member'}].map(({val,label,sub}) => (
                  <div key={label} style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:'16px',padding:'1.5rem',textAlign:'center'}}>
                    <div style={{fontFamily:'var(--font-display)',fontSize:'2rem',fontWeight:700,color:'var(--navy)'}}>{val}</div>
                    <div style={{fontWeight:600,fontSize:'0.9rem',color:'var(--gray-800)',marginTop:'4px'}}>{label}</div>
                    <div style={{fontSize:'0.78rem',color:'var(--gray-600)',marginTop:'2px'}}>{sub}</div>
                  </div>
                ))}
              </div>
              <div style={{borderRadius:'16px',overflow:'hidden',marginBottom:'2rem',height:'280px',position:'relative'}}>
                <img src={IMGS.communityGroup} alt="Community programs" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,rgba(15,30,55,0.8) 0%,transparent 60%)',display:'flex',alignItems:'center',padding:'2.5rem'}}>
                  <div>
                    <div style={{color:'#fed7aa',fontWeight:700,fontSize:'0.85rem',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'0.5rem'}}>Current Focus</div>
                    <div style={{fontFamily:'var(--font-display)',fontSize:'1.8rem',color:'#064e3b',marginBottom:'0.5rem'}}>Preparing Our First Project</div>
                    <div style={{color:'rgba(255,255,255,0.78)',fontSize:'0.95rem'}}>A rural school in Uttar Pradesh, India</div>
                  </div>
                </div>
              </div>
              <div style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:'16px',padding:'2rem'}}>
                <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'1rem'}}>How We'll Measure Impact</h3>
                <p style={{fontSize:'0.9rem',color:'var(--gray-600)',lineHeight:1.75,marginBottom:'1rem'}}>Once our first project is underway, we will track and publicly report on:</p>
                {['Number of schools supported and resources delivered','Number of students benefiting from each project','Financial and operational records for every delivery','Independent post-delivery evaluation confirming resources met the identified need'].map(t => (
                  <div key={t} style={{display:'flex',alignItems:'flex-start',gap:'10px',marginBottom:'0.75rem',fontSize:'0.88rem',color:'var(--gray-700)'}}><span style={{color:'var(--teal)',flexShrink:0,marginTop:'1px'}}><Icon name="check" size={16}/></span>{t}</div>
                ))}
              </div>
            </div>
          )}

          {tab==='financials' && (
            <div>
              <div style={{background:'rgba(13,115,119,0.06)',border:'1px solid var(--teal)',borderRadius:'12px',padding:'1.2rem 1.5rem',marginBottom:'2rem',fontSize:'0.9rem',color:'var(--teal)'}}>
                💡 As a newly established charity, our first full financial report will be published after our first financial year, in line with ACNC requirements.
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2rem'}}>
                <div style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:'16px',padding:'2rem'}}>
                  <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'0.5rem'}}>Current Funding</h3>
                  <div style={{fontFamily:'var(--font-display)',fontSize:'2rem',fontWeight:700,color:'var(--navy)',marginBottom:'1rem'}}>$10,000</div>
                  <p style={{fontSize:'0.88rem',color:'var(--gray-600)',lineHeight:1.7}}>Committed by our founding member to begin operations. We intend to grow this through:</p>
                  <ul style={{marginTop:'0.75rem',paddingLeft:'1.2rem',fontSize:'0.88rem',color:'var(--gray-700)',lineHeight:1.9}}>
                    <li>Public fundraising campaigns via social media</li>
                    <li>Fundraising at cultural and community events</li>
                    <li>Government grants and philanthropic support</li>
                  </ul>
                </div>
                <div style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:'16px',padding:'2rem'}}>
                  <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'1rem'}}>Our Financial Principles</h3>
                  {['All funds applied directly to charitable purposes','No cash grants paid to third parties','Transparent record-keeping and oversight by our Responsible People','Direct procurement and delivery, with documentation for every purchase'].map(t => (
                    <div key={t} style={{display:'flex',alignItems:'flex-start',gap:'10px',marginBottom:'0.75rem',fontSize:'0.88rem',color:'var(--gray-700)'}}><span style={{color:'var(--teal)',flexShrink:0,marginTop:'1px'}}><Icon name="check" size={16}/></span>{t}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab==='reports' && (
            <div>
              <p style={{color:'var(--gray-600)',marginBottom:'2rem',fontSize:'0.95rem'}}>As a newly established charity, we haven't completed a full financial year yet. Our first Annual Report will be published here and on the ACNC Charity Register once available.</p>
              <div style={{display:'grid',gap:'1rem'}}>
                <div className="annual-report-card" style={{cursor:'default'}}>
                  <div style={{width:50,height:50,background:'rgba(26,58,92,0.08)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Icon name="file" size={22} color="var(--navy)"/></div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:'var(--font-display)',color:'var(--navy)',fontWeight:600,marginBottom:'0.2rem'}}>First Annual Report</div>
                    <div style={{fontSize:'0.85rem',color:'var(--gray-600)'}}>Coming soon — published after our first full financial year.</div>
                  </div>
                  <span style={{background:'rgba(212,160,23,0.12)',color:'var(--gold)',fontSize:'0.75rem',fontWeight:700,padding:'0.2rem 0.75rem',borderRadius:'100px',textTransform:'uppercase'}}>Pending</span>
                </div>
              </div>
            </div>
          )}

          {tab==='governance' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2rem'}}>
              <div>
                <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'1.5rem'}}>Board of Directors</h3>
                {[
                  {name:'Harsh Singh',role:'Chairman & Director',bg:'Oversees all strategic, financial and operational decisions.'},
                  {name:'Pramod Singh',role:'Director',bg:'Oversees strategic and financial decisions.'},
                  {name:'Tavishi Makhija',role:'Director',bg:'Oversees operational decisions.'},
                ].map(({name,role,bg}) => (
                  <div key={name} style={{display:'flex',gap:'1rem',alignItems:'flex-start',padding:'1rem 0',borderBottom:'1px solid var(--gray-100)'}}>
                    <div style={{width:40,height:40,background:'linear-gradient(135deg,var(--navy),var(--teal))',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'0.9rem',flexShrink:0}}>{name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                    <div><div style={{fontWeight:600,fontSize:'0.9rem',color:'var(--navy)'}}>{name}</div><div style={{fontSize:'0.8rem',color:'var(--teal)',fontWeight:600,marginBottom:'0.2rem'}}>{role}</div><div style={{fontSize:'0.8rem',color:'var(--gray-600)'}}>{bg}</div></div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:'16px',padding:'2rem',marginBottom:'1.5rem'}}>
                  <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'1rem'}}>Governance Framework</h3>
                  {['Registered Australian charity','Constitution aligned with ACNC requirements','Safeguarding policies for children and vulnerable people','Internal financial controls to prevent fraud, corruption or misuse of funds','All personnel screened (WWCC or equivalent)','Compliant with Australian anti-money-laundering, taxation and sanctions law'].map(t => (
                    <div key={t} style={{display:'flex',alignItems:'flex-start',gap:'10px',marginBottom:'0.75rem',fontSize:'0.88rem',color:'var(--gray-700)'}}><span style={{color:'var(--teal)',flexShrink:0,marginTop:'1px'}}><Icon name="check" size={16}/></span>{t}</div>
                  ))}
                </div>
                <div style={{background:'var(--navy)',borderRadius:'16px',padding:'2rem',color:'white'}}>
                  <h4 style={{fontFamily:'var(--font-display)',marginBottom:'1rem'}}>Complaints & Feedback</h4>
                  <p style={{fontSize:'0.88rem',color:'#065f46',lineHeight:1.7,marginBottom:'1rem'}}>If you have a concern about Headstart Education's governance, projects or conduct:</p>
                  {['Email: info@hseducation.org','Write to the Chair at our registered office, Sydney NSW 2000','Report to the ACNC at acnc.gov.au'].map(t => (
                    <div key={t} style={{fontSize:'0.85rem',color:'#065f46',marginBottom:'0.5rem',display:'flex',gap:'8px'}}><span style={{color:'#065f46'}}>→</span>{t}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};


export default ImpactPage;
