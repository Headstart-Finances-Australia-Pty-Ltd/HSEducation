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
          <div className="section-label" style={{color:'var(--gold-light)'}}>Transparency & Impact</div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(2rem,4vw,3rem)',color:'white',marginBottom:'1rem'}}>Your Trust, Our Accountability</h1>
          <p style={{color:'rgba(255,255,255,0.82)',fontSize:'1.05rem',lineHeight:1.7}}>Every dollar is tracked, every program measured, and all results published publicly. See exactly how your donations create impact.</p>
        </div>
      </div>

      <section className="section">
        <div className="section-inner">
          <div className="tabs">
            {[['impact','📊 Impact Data'],['financials','💰 Financials'],['reports','📄 Annual Reports'],['governance','🏛 Governance']].map(([k,l]) => (
              <div key={k} className={`tab${tab===k?' active':''}`} onClick={() => setTab(k)}>{l}</div>
            ))}
          </div>

          {tab==='impact' && (
            <div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1.5rem',marginBottom:'3rem'}}>
                {[{val:'4,248',label:'Students Supported',sub:'2023–2024 financial year'},{val:'47',label:'Partner Schools',sub:'Across 6 states & territories'},{val:'92%',label:'Program Completion',sub:'Among enrolled students'},{val:'83%',label:'Grade Improvement',sub:'Students in literacy programs'}].map(({val,label,sub}) => (
                  <div key={label} style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:'16px',padding:'1.5rem',textAlign:'center'}}>
                    <div style={{fontFamily:'var(--font-display)',fontSize:'2.4rem',fontWeight:700,color:'var(--navy)'}}>{val}</div>
                    <div style={{fontWeight:600,fontSize:'0.9rem',color:'var(--gray-800)',marginTop:'4px'}}>{label}</div>
                    <div style={{fontSize:'0.78rem',color:'var(--gray-600)',marginTop:'2px'}}>{sub}</div>
                  </div>
                ))}
              </div>
              {/* Image showing impact */}
              <div style={{borderRadius:'16px',overflow:'hidden',marginBottom:'2rem',height:'280px',position:'relative'}}>
                <img src={IMGS.communityGroup} alt="Community programs" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,rgba(15,30,55,0.8) 0%,transparent 60%)',display:'flex',alignItems:'center',padding:'2.5rem'}}>
                  <div>
                    <div style={{color:'var(--gold-light)',fontWeight:700,fontSize:'0.85rem',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'0.5rem'}}>Our Reach in 2023–24</div>
                    <div style={{fontFamily:'var(--font-display)',fontSize:'1.8rem',color:'white',marginBottom:'0.5rem'}}>47 Schools Across 6 States</div>
                    <div style={{color:'rgba(255,255,255,0.78)',fontSize:'0.95rem'}}>From metropolitan Sydney to the remote Northern Territory</div>
                  </div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2rem'}}>
                <div style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:'16px',padding:'2rem'}}>
                  <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'1.5rem'}}>Programs by Reach</h3>
                  {[{label:'Scholarship Program',pct:38,color:'#1a3a5c'},{label:'Literacy & Numeracy Support',pct:27,color:'#0d7377'},{label:'Indigenous Education Initiative',pct:20,color:'#d4a017'},{label:'Vocational Pathways',pct:10,color:'#2c5282'},{label:'School Infrastructure Grants',pct:5,color:'#14a8ae'}].map(({label,pct,color}) => (
                    <div className="chart-bar-group" key={label}>
                      <div className="chart-bar-label"><span>{label}</span><span>{pct}%</span></div>
                      <div className="chart-bar-track"><div className="chart-bar-fill" style={{width:`${pct}%`,background:color}}/></div>
                    </div>
                  ))}
                </div>
                <div style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:'16px',padding:'2rem'}}>
                  <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'1.5rem'}}>Geographic Reach</h3>
                  {[{state:'New South Wales',students:1240,pct:29},{state:'Queensland',students:890,pct:21},{state:'Victoria',students:820,pct:19},{state:'South Australia',students:560,pct:13},{state:'Western Australia',students:480,pct:11},{state:'Northern Territory',students:258,pct:7}].map(({state,students,pct}) => (
                    <div className="chart-bar-group" key={state}>
                      <div className="chart-bar-label"><span>{state}</span><span style={{color:'var(--gray-500)'}}>{students.toLocaleString()} students</span></div>
                      <div className="chart-bar-track"><div className="chart-bar-fill" style={{width:`${pct*3}%`,background:'linear-gradient(90deg,var(--teal),var(--navy))'}}/></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab==='financials' && (
            <div>
              <div style={{background:'rgba(13,115,119,0.06)',border:'1px solid var(--teal)',borderRadius:'12px',padding:'1.2rem 1.5rem',marginBottom:'2rem',fontSize:'0.9rem',color:'var(--teal)'}}>
                💡 Full audited financial statements published annually. Data below from 2023–24 Annual Report.
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2rem'}}>
                <div style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:'16px',padding:'2rem'}}>
                  <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'0.5rem'}}>Revenue Sources 2023–24</h3>
                  <div style={{fontFamily:'var(--font-display)',fontSize:'2rem',fontWeight:700,color:'var(--navy)',marginBottom:'1.5rem'}}>$4.2M Total</div>
                  {[{label:'Individual Donations',pct:48,color:'#1a3a5c',val:'$2.02M'},{label:'Corporate Partnerships',pct:22,color:'#0d7377',val:'$924K'},{label:'Government Grants',pct:18,color:'#d4a017',val:'$756K'},{label:'Bequests & Major Gifts',pct:9,color:'#2c5282',val:'$378K'},{label:'Events & Other',pct:3,color:'#94a3b8',val:'$126K'}].map(({label,pct,color,val}) => (
                    <div className="chart-bar-group" key={label}>
                      <div className="chart-bar-label"><span>{label}</span><span>{val} ({pct}%)</span></div>
                      <div className="chart-bar-track"><div className="chart-bar-fill" style={{width:`${pct}%`,background:color}}/></div>
                    </div>
                  ))}
                </div>
                <div style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:'16px',padding:'2rem'}}>
                  <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'0.5rem'}}>Expenditure</h3>
                  <div style={{fontFamily:'var(--font-display)',fontSize:'2rem',fontWeight:700,color:'var(--navy)',marginBottom:'1.5rem'}}>$3.8M Total</div>
                  {[{label:'Educational Programs & Scholarships',pct:87,color:'#0d7377',val:'$3.31M'},{label:'Fundraising & Communications',pct:8,color:'#d4a017',val:'$304K'},{label:'Governance & Administration',pct:5,color:'#94a3b8',val:'$190K'}].map(({label,pct,color,val}) => (
                    <div className="chart-bar-group" key={label}>
                      <div className="chart-bar-label"><span>{label}</span><span>{val} ({pct}%)</span></div>
                      <div className="chart-bar-track" style={{height:14}}><div className="chart-bar-fill" style={{width:`${pct}%`,background:color}}/></div>
                    </div>
                  ))}
                  <div style={{marginTop:'1.5rem',background:'rgba(13,115,119,0.08)',borderRadius:'10px',padding:'1rem',fontSize:'0.88rem',color:'var(--gray-700)'}}>
                    ✅ <strong>87 cents of every dollar</strong> donated goes directly to programs. Industry benchmark: 75%.
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab==='reports' && (
            <div>
              <p style={{color:'var(--gray-600)',marginBottom:'2rem',fontSize:'0.95rem'}}>All annual reports are publicly available per ACNC requirements. Audited by Grant Thornton Australia.</p>
              <div style={{display:'grid',gap:'1rem'}}>
                {[{year:'2023–2024',desc:'4,248 students supported. Revenue $4.2M.',status:'Current'},{year:'2022–2023',desc:'3,510 students supported. Revenue $3.6M.'},{year:'2021–2022',desc:'2,890 students supported. Revenue $2.9M.'},{year:'2020–2021',desc:'2,200 students supported. Revenue $2.1M. COVID-19 response.'}].map(({year,desc,status}) => (
                  <div key={year} className="annual-report-card">
                    <div style={{width:50,height:50,background:'rgba(26,58,92,0.08)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Icon name="file" size={22} color="var(--navy)"/></div>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:'var(--font-display)',color:'var(--navy)',fontWeight:600,marginBottom:'0.2rem'}}>Annual Report {year}</div>
                      <div style={{fontSize:'0.85rem',color:'var(--gray-600)'}}>{desc}</div>
                    </div>
                    {status==='Current' && <span style={{background:'rgba(13,115,119,0.1)',color:'var(--teal)',fontSize:'0.75rem',fontWeight:700,padding:'0.2rem 0.75rem',borderRadius:'100px',textTransform:'uppercase'}}>Current</span>}
                    <button style={{display:'flex',alignItems:'center',gap:'6px',color:'var(--teal)',fontWeight:600,fontSize:'0.85rem',cursor:'pointer',background:'none',border:'none',fontFamily:'var(--font-body)'}}><Icon name="download" size={16}/> PDF</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='governance' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2rem'}}>
              <div>
                <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'1.5rem'}}>Board of Directors</h3>
                {[{name:'Dr. Sarah Chen',role:'Chair',bg:'Head of Education, NSW DoE. PhD Education Policy, USyd.'},{name:'Michael Nguyen',role:'Deputy Chair',bg:'CPA, Partner Deloitte Australia (NFP division).'},{name:'Prof. Alinta Watson',role:'Director',bg:'Professor of Education Policy, University of Melbourne.'},{name:'James O\'Brien',role:'Director',bg:'Former CEO, The Smith Family. 20+ years NFP.'},{name:'Rebecca Marks',role:'Director',bg:'Indigenous community leader and education advocate, NT.'}].map(({name,role,bg}) => (
                  <div key={name} style={{display:'flex',gap:'1rem',alignItems:'flex-start',padding:'1rem 0',borderBottom:'1px solid var(--gray-100)'}}>
                    <div style={{width:40,height:40,background:'linear-gradient(135deg,var(--navy),var(--teal))',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'0.9rem',flexShrink:0}}>{name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                    <div><div style={{fontWeight:600,fontSize:'0.9rem',color:'var(--navy)'}}>{name}</div><div style={{fontSize:'0.8rem',color:'var(--teal)',fontWeight:600,marginBottom:'0.2rem'}}>{role}</div><div style={{fontSize:'0.8rem',color:'var(--gray-600)'}}>{bg}</div></div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:'16px',padding:'2rem',marginBottom:'1.5rem'}}>
                  <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'1rem'}}>Governance Framework</h3>
                  {['Registered Australian charity','Constitution aligned with ACNC requirements','Safeguarding policies for children and vulnerable people','Internal financial controls to prevent fraud, corruption or misuse of funds','All personnel screened (WWCC or equivalent)','Privacy Act 1988 compliant'].map(t => (
                    <div key={t} style={{display:'flex',alignItems:'flex-start',gap:'10px',marginBottom:'0.75rem',fontSize:'0.88rem',color:'var(--gray-700)'}}><span style={{color:'var(--teal)',flexShrink:0,marginTop:'1px'}}><Icon name="check" size={16}/></span>{t}</div>
                  ))}
                </div>
                <div style={{background:'var(--navy)',borderRadius:'16px',padding:'2rem',color:'white'}}>
                  <h4 style={{fontFamily:'var(--font-display)',marginBottom:'1rem'}}>Complaints & Feedback</h4>
                  <p style={{fontSize:'0.88rem',color:'rgba(255,255,255,0.8)',lineHeight:1.7,marginBottom:'1rem'}}>If you have a concern about Headstart Education's governance, programs or conduct:</p>
                  {['Email: governance@hseducation.org','Write to the Chair at our registered office','Report to the ACNC at acnc.gov.au'].map(t => (
                    <div key={t} style={{fontSize:'0.85rem',color:'rgba(255,255,255,0.75)',marginBottom:'0.5rem',display:'flex',gap:'8px'}}><span style={{color:'var(--gold-light)'}}>→</span>{t}</div>
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
