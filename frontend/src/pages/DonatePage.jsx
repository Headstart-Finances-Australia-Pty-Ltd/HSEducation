import { useState } from 'react';
import IMGS from '../images';
import Icon from '../components/Icon';
import SquarePaymentModal from '../components/SquarePaymentModal';
import API_URL from '../config';

const DonatePage = () => {
  const [amount, setAmount]       = useState(50);
  const [custom, setCustom]       = useState('');
  const [freq, setFreq]           = useState('once');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [payOpen, setPayOpen]     = useState(false);
  const [form, setForm]           = useState({ first: '', last: '', email: '', phone: '' });

  const amounts = [25, 50, 100, 250, 500, 1000];
  const impacts = {
    25: 'Contributes toward school stationery',
    50: 'Contributes toward classroom books',
    100: 'Contributes toward learning materials for a classroom',
    250: 'Contributes toward desks or chairs',
    500: 'Contributes toward a classroom resource package',
    1000: 'Contributes toward larger classroom infrastructure',
  };
  const finalAmount = parseFloat(custom || amount || 0);

  const handleOpenPayment = () => {
    if (!form.first || !form.email || !finalAmount) {
      setError('Please fill in your name, email and select an amount.');
      return;
    }
    setError('');
    setPayOpen(true);
  };

  // Called once Square's popup has tokenized the card/bank details.
  // We send the one-time token (never the raw card/bank number) to our
  // backend, which charges it via the Square Payments API.
  const handleTokenized = async ({ token }) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.first,
          last_name:  form.last,
          email:      form.email,
          phone:      form.phone,
          amount:     finalAmount,
          frequency:  freq,
          sourceId:   token,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment could not be processed.');
      setPayOpen(false);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again or contact giving@hseducation.com.au');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="donate-hero">
        <div className="donate-hero-bg"><img src={IMGS.donateHero} alt="Giving"/></div>
        <div className="donate-hero-overlay"/>
        <div className="donate-hero-content">
          <div className="section-label" style={{color:'#065f46'}}>Make a Difference</div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(2rem,4vw,3rem)',color:'#064e3b',marginBottom:'1rem'}}>
            Donate to <em style={{color:'#065f46'}}>Headstart Education</em>
          </h1>
          <p style={{color:'#065f46',fontSize:'1.05rem',lineHeight:1.7}}>
            Your donation directly funds classroom infrastructure and learning materials for our first project — a rural school in Uttar Pradesh, India. A receipt is issued automatically for every donation.
          </p>
        </div>
      </div>

      <section className="section">
        <div className="section-inner">
          {submitted ? (
            <div className="success-box" style={{maxWidth:'560px',margin:'0 auto'}}>
              <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🎉</div>
              <h2 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'0.75rem'}}>Thank You!</h2>
              <p style={{color:'var(--gray-600)',marginBottom:'1rem'}}>
                Your donation of <strong>${finalAmount}</strong> will make a real difference.
                A receipt has been sent to <strong>{form.email}</strong>.
              </p>
              <p style={{fontSize:'0.85rem',color:'var(--gray-600)'}}>Headstart Education Australia Pty Ltd — registered Australian charity.</p>
            </div>
          ) : (
            <div className="donation-grid">
              <div>
                <div style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:'16px',padding:'2rem'}}>
                  <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'1.5rem',fontSize:'1.3rem'}}>Your Donation</h3>
                  <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.5rem'}}>
                    {['once','monthly','annually'].map(f => (
                      <button key={f} onClick={() => setFreq(f)} style={{
                        flex:1,padding:'0.6rem',borderRadius:'8px',fontSize:'0.85rem',fontWeight:600,cursor:'pointer',
                        background:freq===f?'var(--navy)':'white',color:freq===f?'white':'var(--gray-600)',
                        border:`2px solid ${freq===f?'var(--navy)':'var(--gray-200)'}`,fontFamily:'var(--font-body)',
                      }}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
                    ))}
                  </div>
                  <div className="donation-amounts">
                    {amounts.map(a => (
                      <button key={a} className={`amount-btn${amount===a&&!custom?' active':''}`}
                              onClick={() => { setAmount(a); setCustom(''); }}>
                        <div className="amount">${a}</div>
                        <div className="impact">{impacts[a]}</div>
                      </button>
                    ))}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Or enter a custom amount ($AUD)</label>
                    <input className="form-input" type="number" placeholder="Enter amount" value={custom}
                           onChange={e => { setCustom(e.target.value); setAmount(null); }}/>
                  </div>
                  {finalAmount > 0 && (
                    <div style={{background:'rgba(13,115,119,0.07)',border:'1px solid var(--teal)',borderRadius:'10px',
                                  padding:'0.9rem 1.1rem',marginBottom:'1.5rem',fontSize:'0.88rem',color:'var(--teal)'}}>
                      <strong>Your impact:</strong> {impacts[amount] || 'Directly funds classroom infrastructure and learning materials'}
                    </div>
                  )}
                  <h4 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'1rem'}}>Your Details</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">First Name *</label>
                      <input className="form-input" value={form.first} onChange={e=>setForm({...form,first:e.target.value})} placeholder="Jane"/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input className="form-input" value={form.last} onChange={e=>setForm({...form,last:e.target.value})} placeholder="Smith"/>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input className="form-input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="jane@example.com.au"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone (optional)</label>
                    <input className="form-input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="04xx xxx xxx"/>
                  </div>
                  {error && (
                    <div style={{background:'rgba(220,38,38,0.08)',border:'1px solid #dc2626',borderRadius:'8px',
                                  padding:'0.75rem 1rem',marginBottom:'1rem',fontSize:'0.88rem',color:'#dc2626'}}>
                      {error}
                    </div>
                  )}
                  <button className="donate-btn" onClick={handleOpenPayment} disabled={loading}
                          style={{opacity:loading?0.7:1}}>
                    {loading ? '⏳ Processing...' : `🔒 Continue to Payment — $${finalAmount||'?'} ${freq==='monthly'?'/ Month':freq==='annually'?'/ Year':''}`}
                  </button>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'1rem',fontSize:'0.8rem',color:'var(--gray-600)'}}>
                    <Icon name="lock" size={14}/> Payments are processed securely by Square — receipts issued instantly
                  </div>
                </div>
              </div>
              <div>
                <div style={{borderRadius:'16px',overflow:'hidden',marginBottom:'1.5rem',boxShadow:'var(--shadow-sm)'}}>
                  <div style={{height:'200px',overflow:'hidden'}}>
                    <img src={IMGS.communityGroup} alt="Community" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  </div>
                  <div style={{background:'white',border:'1px solid var(--gray-200)',borderTop:'none',padding:'2rem'}}>
                    <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'1.5rem',fontSize:'1.2rem'}}>Why Give to Headstart Education?</h3>
                    {[
                      {icon:'shield', title:'ACNC Registered',        desc:'A registered Australian charity, governed by a constitution aligned with ACNC requirements.'},
                      {icon:'lock',   title:'Secure Payments',        desc:'All payments are processed by Square, a PCI-DSS Level 1 compliant payment provider.'},
                      {icon:'chart',  title:'Direct Delivery Model',  desc:'We procure and deliver resources ourselves — no cash grants to third parties.'},
                      {icon:'file',   title:'Full Transparency',      desc:'Updates published as our first project progresses — see our Impact page.'},
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
                  {[
                    ['🏢','Corporate Partnerships','Get in touch about sponsorship or employee giving programs.'],
                    ['📝','Bequest in Your Will','Leave a lasting legacy in your estate planning.'],
                    ['🤝','Volunteer','Donate your time to help with outreach, logistics, or fundraising events.'],
                  ].map(([e,t,d]) => (
                    <div key={t} style={{display:'flex',gap:'1rem',alignItems:'flex-start',marginBottom:'1.2rem'}}>
                      <span style={{fontSize:'1.3rem'}}>{e}</span>
                      <div>
                        <div style={{fontWeight:600,fontSize:'0.88rem',marginBottom:'0.2rem'}}>{t}</div>
                        <div style={{fontSize:'0.82rem',color:'rgba(255,255,255,0.7)',lineHeight:1.55}}>{d}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{marginTop:'1rem',paddingTop:'1rem',borderTop:'1px solid rgba(255,255,255,0.15)',fontSize:'0.82rem',color:'rgba(255,255,255,0.65)'}}>
                    📧 info@hseducation.com.au
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <SquarePaymentModal
        open={payOpen}
        amount={finalAmount}
        frequency={freq}
        onClose={() => !loading && setPayOpen(false)}
        onTokenized={handleTokenized}
      />
    </div>
  );
};

export default DonatePage;
