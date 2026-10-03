import { useState } from 'react';
import IMGS from '../images';
import Icon from '../components/Icon';

const ProjectsPage = ({ setPage }) => {
  const [filter, setFilter] = useState('All');
  const cats = ['All','Scholarships','Literacy','Indigenous','Vocational','Infrastructure'];
  const projects = [
    {cat:'Scholarships',img:IMGS.scholarship,title:'Future Leaders Bursary',loc:'NSW & VIC',desc:'Annual scholarships of up to $5,000 for high-achieving Year 11/12 students from low-income households. Covers fees, uniforms, textbooks and devices.',pct:72,goal:'$180,000',students:89,status:'Active'},
    {cat:'Literacy',img:IMGS.literacy,title:'Read to Succeed',loc:'QLD & SA',desc:'Intensive 10-week literacy intervention in 12 primary schools. Evidence-based approach with qualified literacy coaches working 1:1 and in small groups.',pct:88,goal:'$95,000',students:340,status:'Active'},
    {cat:'Indigenous',img:IMGS.indigenous,title:'Remote Learning Connect',loc:'NT & WA (Remote)',desc:'Satellite connectivity, devices and culturally appropriate curricula for First Nations students in remote communities.',pct:55,goal:'$240,000',students:210,status:'Active'},
    {cat:'Vocational',img:IMGS.vocational,title:'Skills for Life',loc:'All States',desc:'Partnered with TAFE colleges to fund Certificate II and III enrolment fees for young people aged 16–25 who have disengaged from schooling.',pct:65,goal:'$110,000',students:187,status:'Active'},
    {cat:'Infrastructure',img:IMGS.infrastructure,title:'Resource Rich Schools Grant',loc:'Regional Australia',desc:'Equipment and resource grants to under-resourced schools — science kits, library books, sports equipment, and maker-space tools.',pct:40,goal:'$85,000',students:1400,status:'Active'},
    {cat:'Literacy',img:IMGS.mathsProgram,title:'Maths Mastery Program',loc:'VIC & QLD',desc:'After-school numeracy tutoring for Years 3–8 students performing below the national minimum standard.',pct:93,goal:'$60,000',students:265,status:'Nearly Funded'},
    {cat:'Scholarships',img:IMGS.regional,title:'Regional Excellence Award',loc:'QLD, SA, WA',desc:'Scholarships for academically gifted regional students, supporting university transition including relocation assistance.',pct:30,goal:'$200,000',students:24,status:'Fundraising'},
    {cat:'Indigenous',img:IMGS.twoWay,title:'Two-Way Learning Initiative',loc:'NT',desc:'Culturally responsive curriculum co-designed with Elders integrating community language and knowledge with national curriculum.',pct:48,goal:'$150,000',students:180,status:'Active'},
    {cat:'Vocational',img:IMGS.pathways,title:'Pathways to Employment',loc:'NSW, VIC, SA',desc:'Career mentorship and work-placement connecting Year 10–12 students with industry professionals across healthcare, trades and technology.',pct:78,goal:'$75,000',students:312,status:'Nearly Funded'},
  ];
  const filtered = filter==='All' ? projects : projects.filter(p=>p.cat===filter);

  return (
    <div className="page-enter">
      <div className="page-hero">
        <div className="page-hero-bg"><img src={IMGS.communityGroup} alt="Education programs"/></div>
        <div className="page-hero-overlay"/>
        <div className="page-hero-content">
          <div className="section-label" style={{color:'var(--gold-light)'}}>Our Programs</div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(2rem,4vw,3rem)',color:'white',marginBottom:'1rem'}}>Projects Making a <em style={{color:'var(--gold-light)'}}>Real Difference</em></h1>
          <p style={{color:'rgba(255,255,255,0.82)',fontSize:'1.05rem'}}>Every Headstart Education program is designed with evidence, co-designed with communities, and rigorously evaluated for impact.</p>
        </div>
      </div>

      <section className="section">
        <div className="section-inner">
          <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginBottom:'2.5rem'}}>
            {cats.map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{padding:'0.5rem 1.2rem',borderRadius:'100px',fontSize:'0.88rem',fontWeight:600,cursor:'pointer',background:filter===c?'var(--navy)':'white',color:filter===c?'white':'var(--gray-600)',border:`1.5px solid ${filter===c?'var(--navy)':'var(--gray-200)'}`,transition:'all 0.2s',fontFamily:'var(--font-body)'}}>
                {c}
              </button>
            ))}
          </div>
          <div className="cards-grid cards-3">
            {filtered.map(({cat,img,title,loc,desc,pct,goal,students,status}) => (
              <div key={title} className="prog-card">
                <div className="prog-card-img">
                  <img src={img} alt={title}/>
                  <div className="prog-card-img-overlay"/>
                  <span style={{position:'absolute',top:'1rem',right:'1rem',background:status==='Nearly Funded'?'rgba(212,160,23,0.9)':status==='Fundraising'?'rgba(244,63,94,0.85)':'rgba(13,115,119,0.9)',color:'white',fontSize:'0.73rem',fontWeight:700,padding:'0.25rem 0.75rem',borderRadius:'100px'}}>{status}</span>
                </div>
                <div className="prog-card-body">
                  <span className="prog-tag">{cat}</span>
                  <div className="prog-title">{title}</div>
                  <div style={{fontSize:'0.78rem',color:'var(--gray-500)',marginBottom:'0.5rem',display:'flex',alignItems:'center',gap:'4px'}}><Icon name="pin" size={12}/> {loc}</div>
                  <p className="prog-text">{desc}</p>
                  <div className="prog-progress"><div className="prog-progress-bar" style={{width:`${pct}%`}}/></div>
                  <div className="prog-meta" style={{marginBottom:'1rem'}}><span><strong style={{color:'var(--teal)'}}>{pct}%</strong> funded</span><span>Goal: <strong>{goal}</strong></span></div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{fontSize:'0.82rem',color:'var(--gray-600)',display:'flex',alignItems:'center',gap:'4px'}}><Icon name="users" size={14}/> {students.toLocaleString()} students</span>
                    <button className="btn-teal" style={{padding:'0.4rem 1rem',fontSize:'0.82rem'}} onClick={() => setPage('Donate')}>Fund This</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="impact-banner">
        <div className="impact-banner-bg"><img src={IMGS.impactBanner} alt="Students"/></div>
        <div className="impact-banner-overlay"/>
        <div className="impact-banner-content">
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(1.8rem,3vw,2.4rem)',color:'white',marginBottom:'1rem'}}>Want to Fund a Specific Project?</h2>
          <p style={{color:'rgba(255,255,255,0.8)',marginBottom:'2rem',fontSize:'1.05rem'}}>Direct your donation to the program that matters most to you.</p>
          <button className="btn-primary" onClick={() => setPage('Donate')}><Icon name="heart" size={18}/> Choose a Project to Fund</button>
        </div>
      </div>
    </div>
  );
};


export default ProjectsPage;
