import { useState } from 'react';
import IMGS from '../images';
import Icon from '../components/Icon';

const AboutPage = ({ setPage }) => (
  <div className="page-enter">
    <div className="page-hero">
      <div className="page-hero-bg"><img src={IMGS.aboutMission} alt="Students with hands raised"/></div>
      <div className="page-hero-overlay"/>
      <div className="page-hero-content">
        <div className="section-label" style={{color:'#065f46'}}>About HS Education</div>
        <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(2rem,4vw,3rem)',color:'#064e3b',marginBottom:'1rem'}}>More Than a Charity — <em style={{color:'#065f46'}}>A Movement</em></h1>
        <p style={{color:'#065f46',fontSize:'1.05rem',lineHeight:1.7}}>Founded on the belief that your postcode, background, or circumstances should never determine the quality of your education. Since 2012, we've been proving it.</p>
      </div>
    </div>

    {/* Mission / Vision / Values */}
    <section className="section">
      <div className="section-inner">
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.5rem',marginBottom:'5rem'}}>
          {[{img:IMGS.missionKids,icon:'🎯',title:'Our Mission',text:'Break down barriers to quality education for all Australians, with focus on disadvantage, geographic isolation, and systemic inequality.'},{img:IMGS.communityGroup,icon:'🔭',title:'Our Vision',text:'An Australia where every student has equitable access to the education and support they need to reach their full potential.'},{img:IMGS.literacy,icon:'💎',title:'Our Values',text:'Integrity, transparency, cultural respect, student-centred practice, collaboration, and evidence-based impact.'}].map(({img,icon,title,text}) => (
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
            <h2 className="section-title">Born From <em>Lived Experience</em></h2>
            <p style={{color:'var(--gray-600)',lineHeight:1.8,marginBottom:'1rem',fontSize:'0.95rem'}}>HS Education was co-founded in 2012 by former teacher Helen Shaw and community development leader Samuel Torres, both of whom grew up in regional Australia with limited access to educational opportunities.</p>
            <p style={{color:'var(--gray-600)',lineHeight:1.8,marginBottom:'1rem',fontSize:'0.95rem'}}>What began as a small scholarship fund for students in regional NSW has grown into a nationally recognised charity supporting over 4,200 students each year across six states and territories.</p>
            <p style={{color:'var(--gray-600)',lineHeight:1.8,fontSize:'0.95rem'}}>Today, HS Education works in partnership with schools, TAFEs, universities, Indigenous communities, and corporate partners to deliver meaningful, measurable outcomes for Australian learners.</p>
          </div>
          <div style={{position:'relative'}}>
            <div style={{borderRadius:'16px',overflow:'hidden',boxShadow:'var(--shadow-md)',height:'380px'}}>
              <img src={IMGS.aboutFounders} alt="Founders planning" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </div>
            <div style={{position:'absolute',bottom:'-16px',left:'-16px',background:'white',borderRadius:'12px',padding:'1.2rem 1.5rem',boxShadow:'var(--shadow-md)',border:'1px solid var(--gray-200)'}}>
              <div style={{fontFamily:'var(--font-display)',fontSize:'1.8rem',fontWeight:700,color:'var(--teal)'}}>12</div>
              <div style={{fontSize:'0.8rem',color:'var(--gray-600)'}}>Years of impact<br/>since 2012</div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4rem',alignItems:'start',marginBottom:'5rem'}}>
          <div>
            <div className="section-label">Our Journey</div>
            <h2 className="section-title" style={{marginBottom:'2rem'}}>How We <em>Grew</em></h2>
            <div className="timeline">
              {[{year:'2012',title:'Founded',text:'Helen Shaw and Samuel Torres establish HS Education as an incorporated association in Sydney.'},{year:'2013',title:'First Scholarships',text:'12 scholarships distributed to Year 11 students across regional NSW.'},{year:'2015',title:'DGR Endorsement',text:'Donations become fully tax-deductible. Donor base grows by 180%.'},{year:'2017',title:'Indigenous Programs',text:'Launch culturally responsive education initiatives in partnership with NT communities.'},{year:'2020',title:'COVID-19 Response',text:'Pivot to digital literacy; provide 800 devices to disadvantaged students.'},{year:'2023',title:'National Expansion',text:'Programs active in all 6 states and Northern Territory.'},{year:'2024',title:'4,200+ Students',text:'Biggest year yet. $3.8M distributed to programs and scholarships.'}].map(({year,title,text}) => (
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
              <img src={IMGS.indigenous} alt="Remote community education" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </div>
            <div style={{borderRadius:'16px',overflow:'hidden',boxShadow:'var(--shadow-md)',height:'260px'}}>
              <img src={IMGS.pathways} alt="Vocational training" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="section-label">Leadership Team</div>
        <h2 className="section-title" style={{marginBottom:'0.75rem'}}>The People <em>Behind the Mission</em></h2>
        <p className="section-desc" style={{marginBottom:'2.5rem'}}>Our team brings together expertise in education, community development, finance, and governance.</p>
        <div className="cards-grid cards-4">
          {[
            {img:IMGS.team1,name:'Helen Shaw',role:'CEO & Co-Founder',bio:'Former teacher and education policy advisor. 20+ years in education and community development.'},
            {img:IMGS.team2,name:'Samuel Torres',role:'Director of Programs',bio:'Community development specialist with deep expertise in First Nations education and rural communities.'},
            {img:IMGS.team3,name:'Dr. Sarah Chen',role:'Board Chair',bio:'Head of Education at NSW DoE. PhD in Education Policy from University of Sydney.'},
            {img:IMGS.team4,name:'David Kim',role:'Chief Financial Officer',bio:'CPA with 15 years in non-profit finance. Oversees financial reporting and ACNC compliance.'},
            {img:IMGS.team5,name:'Priya Sharma',role:'Programs Manager',bio:'Former primary school teacher specialising in literacy intervention and early childhood education.'},
            {img:IMGS.team6,name:'Tom Nguyen',role:'Partnerships Manager',bio:'Business development background. Manages corporate partnerships, grants, and fundraising campaigns.'},
            {img:IMGS.team7,name:'Dr. Alinta Watson',role:'Research Lead',bio:'Education researcher from University of Melbourne leading program evaluation and impact measurement.'},
            {img:IMGS.team8,name:'Marcus Riley',role:'Community Engagement',bio:'Indigenous community liaison and educator from Darwin. Coordinates remote and regional outreach.'},
          ].map(({img,name,role,bio}) => (
            <div key={name} className="team-card">
              <div className="team-card-img"><img src={img} alt={name}/></div>
              <div className="team-body">
                <div className="team-name">{name}</div>
                <div className="team-role">{role}</div>
                <div className="team-bio">{bio}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Partners */}
        <div style={{marginTop:'5rem',textAlign:'center'}}>
          <div className="section-label">Our Partners</div>
          <h2 className="section-title">Supported By <em>Australia's Best</em></h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',marginTop:'2rem'}}>
            {['Commonwealth Dept. of Education','BHP Foundation','Commonwealth Bank','University of Melbourne','NSW Dept. of Education','Google.org Australia','Minderoo Foundation','ANZ Community Fund'].map(name => (
              <div key={name} style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:'12px',padding:'1.5rem',textAlign:'center',fontSize:'0.85rem',fontWeight:600,color:'var(--gray-700)'}}>{name}</div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Contact */}
    <section className="section section-alt">
      <div className="section-inner">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4rem',alignItems:'center'}}>
          <div>
            <div className="section-label">Get In Touch</div>
            <h2 className="section-title">Contact <em>HS Education</em></h2>
            <p className="section-desc">Whether you're a donor, school, corporate partner, or community organisation, we'd love to hear from you.</p>
            <div style={{marginTop:'2rem'}}>
              {[{icon:'pin',label:'Registered Office',val:'Sydney, NSW 2000'},{icon:'mail',label:'General Enquiries',val:'info@hseducation.com.au'},{icon:'mail',label:'Donations & Receipts',val:'giving@hseducation.com.au'},{icon:'globe',label:'ABN',val:'12 345 678 901'}].map(({icon,label,val}) => (
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
            <button className="donate-btn" onClick={() => alert('Thank you! We\'ll be in touch shortly.')}>Send Message</button>
          </div>
        </div>
      </div>
    </section>
  </div>
);


export default AboutPage;

