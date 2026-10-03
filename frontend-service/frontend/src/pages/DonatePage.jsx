import { useState } from 'react';
import IMGS from '../images';
import Icon from '../components/Icon';

const DonatePage = () => {
  const [amount, setAmount] = useState(50);
  const [custom, setCustom] = useState('');
  const [freq, setFreq] = useState('once');
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({first:'',last:'',email:'',phone:'',card:'',exp:'',cvv:''});
  const amounts = [25,50,100,250,500,1000];
  const impacts = {25:'Buys a set of school books',50:'Funds a week of tutoring',100:'Learning materials for a term',250:'School uniform & supplies',500:'Half a term literacy support',1000:'Funds a semester scholarship'};

  return (
    <div className="page-enter">
      <div className="donate-hero">
        <div className="donate-hero-bg"><img src={IMGS.donateHero} alt="Giving and community"/></div>
        <div className="donate-hero-overlay"/>
        <div className="donate-hero-content">
          <div className="section-label" style={{color:'var(--gold-light)'}}>Make a Difference</div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(2rem,4vw,3rem)',color:'white',marginBottom:'1rem'}}>Donate to <em style={{color:'var(--gold-light)'}}>Headstart Education</em></h1>
          <p style={{color:'rgba(255,255,255,0.82)',fontSize:'1.05rem',lineHeight:1.7}}>Your tax-deductible donation funds scholarships, learning support and community programs for Australian students in need. All donations over $2 are fully tax-deductible.</p>
        </div>
      </div>

      <section className="section">
        <div className="section-inner">
          {submitted ? (
            <div className="success-box" style={{maxWidth:'560px',margin:'0 auto'}}>
              <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🎉</div>
              <h2 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'0.75rem'}}>Thank You for Your Generosity!</h2>
              <p style={{color:'var(--gray-600)',marginBottom:'1rem'}}>Your donation of <strong>${custom||amount}</strong> will make a real difference. A tax receipt has been sent to <strong>{form.email}</strong>.</p>
              <p style={{fontSize:'0.85rem',color:'var(--gray-600)'}}>Headstart Education Australia Pty Ltd — registered Australian charity.</p>
            </div>
          ) : (
            <div className="donation-grid">
              <div>
                <div style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:'16px',padding:'2rem'}}>
                  <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'1.5rem',fontSize:'1.3rem'}}>Your Donation</h3>
                  <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.5rem'}}>
                    {['once','monthly','annually'].map(f => (
                      <button key={f} onClick={() => setFreq(f)} style={{flex:1,padding:'0.6rem',borderRadius:'8px',fontSize:'0.85rem',fontWeight:600,background:freq===f?'var(--navy)':'white',color:freq===f?'white':'var(--gray-600)',border:`2px solid ${freq===f?'var(--navy)':'var(--gray-200)'}`,transition:'all 0.2s',cursor:'pointer',fontFamily:'var(--font-body)'}}>
                        {f.charAt(0).toUpperCase()+f.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="donation-amounts">
                    {amounts.map(a => (
                      <button key={a} className={`amount-btn${amount===a&&!custom?' active':''}`} onClick={() => { setAmount(a); setCustom(''); }}>
                        <div className="amount">${a}</div><div className="impact">{impacts[a]}</div>
                      </button>
                    ))}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Or enter a custom amount ($AUD)</label>
                    <input className="form-input" type="number" placeholder="Enter amount" value={custom} onChange={e => { setCustom(e.target.value); setAmount(null); }}/>
                  </div>
                  {(amount||custom) && <div style={{background:'rgba(13,115,119,0.07)',border:'1px solid var(--teal)',borderRadius:'10px',padding:'0.9rem 1.1rem',marginBottom:'1.5rem',fontSize:'0.88rem',color:'var(--teal)'}}><strong>Your impact:</strong> {impacts[amount]||'Supporting Australian students directly'}</div>}
                  <h4 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'1rem'}}>Your Details</h4>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">First Name *</label><input className="form-input" required value={form.first} onChange={e=>setForm({...form,first:e.target.value})} placeholder="Jane"/></div>
                    <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" value={form.last} onChange={e=>setForm({...form,last:e.target.value})} placeholder="Smith"/></div>
                  </div>
                  <div className="form-group"><label className="form-label">Email Address *</label><input className="form-input" type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="jane@example.com.au"/></div>
                  <div className="form-group"><label className="form-label">Phone (optional)</label><input className="form-input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="04xx xxx xxx"/></div>
                  <h4 style={{fontFamily:'var(--font-display)',color:'var(--navy)',margin:'1.2rem 0 1rem'}}>Payment Details</h4>
                  <div className="form-group"><label className="form-label">Card Number</label><input className="form-input" value={form.card} onChange={e=>setForm({...form,card:e.target.value})} placeholder="1234 5678 9012 3456" maxLength={19}/></div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">Expiry</label><input className="form-input" value={form.exp} onChange={e=>setForm({...form,exp:e.target.value})} placeholder="MM/YY" maxLength={5}/></div>
                    <div className="form-group"><label className="form-label">CVV</label><input className="form-input" value={form.cvv} onChange={e=>setForm({...form,cvv:e.target.value})} placeholder="123" maxLength={4}/></div>
                  </div>
                  <button className="donate-btn" onClick={() => { if(form.first&&form.email) setSubmitted(true); }}>🔒 Donate ${custom||amount||'?'} {freq==='monthly'?' / Month':freq==='annually'?' / Year':''}</button>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'1rem',fontSize:'0.8rem',color:'var(--gray-600)'}}>
                    <Icon name="lock" size={14}/> 256-bit SSL encrypted &mdash; receipts issued instantly
                  </div>
                </div>
              </div>

              <div>
                {/* Why give — with small image */}
                <div style={{borderRadius:'16px',overflow:'hidden',marginBottom:'1.5rem',boxShadow:'var(--shadow-sm)'}}>
                  <div style={{height:'200px',overflow:'hidden'}}>
                    <img src={IMGS.communityGroup} alt="Community learning" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  </div>
                  <div style={{background:'white',border:'1px solid var(--gray-200)',borderTop:'none',padding:'2rem'}}>
                    <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'1.5rem',fontSize:'1.2rem'}}>Why Give to Headstart Education?</h3>
                    {[
                      {icon:'shield',title:'ACNC Registered',desc:'Fully registered and compliant with all ACNC governance standards.'},
                      {icon:'award',title:'Secure Payments',desc:'Processed by Square, a PCI-DSS Level 1 compliant payment provider.'},
                      {icon:'chart',title:'87¢ to Programs',desc:'For every dollar donated, 87 cents goes directly to students.'},
                      {icon:'file',title:'Full Transparency',desc:'Annual reports and financials published publicly on our website and ACNC.'},
                    ].map(({icon,title,desc}) => (
                      <div key={title} className="donation-info-item">
                        <div style={{width:38,height:38,background:'rgba(13,115,119,0.1)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <Icon name={icon} size={18} color="var(--teal)"/>
                        </div>
                        <div>
                          <div style={{fontWeight:600,fontSize:'0.9rem',color:'var(--navy)',marginBottom:'0.2rem'}}>{title}</div>
                          <div style={{fontSize:'0.83rem',color:'var(--gray-600)',lineHeight:1.6}}>{desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{background:'var(--navy)',borderRadius:'16px',padding:'2rem',color:'white'}}>
                  <h4 style={{fontFamily:'var(--font-display)',marginBottom:'1rem',fontSize:'1.1rem'}}>Other Ways to Give</h4>
                  {[['🏢','Corporate Partnerships','Matched donations, sponsorship, or employee giving programs.'],['📝','Bequest in Your Will','Leave a lasting legacy in your estate planning.'],['🤝','Volunteer','Donate your time as a tutor, mentor, or event volunteer.']].map(([e,t,d]) => (
                    <div key={t} style={{display:'flex',gap:'1rem',alignItems:'flex-start',marginBottom:'1.2rem'}}>
                      <span style={{fontSize:'1.3rem'}}>{e}</span>
                      <div><div style={{fontWeight:600,fontSize:'0.88rem',marginBottom:'0.2rem'}}>{t}</div><div style={{fontSize:'0.82rem',color:'rgba(255,255,255,0.7)',lineHeight:1.55}}>{d}</div></div>
                    </div>
                  ))}
                  <div style={{marginTop:'1rem',paddingTop:'1rem',borderTop:'1px solid rgba(255,255,255,0.15)',fontSize:'0.82rem',color:'rgba(255,255,255,0.65)'}}>📧 partnerships@hseducation.com.au</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};


export default DonatePage;
