import { useState } from 'react';
import IMGS from '../images';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import API_URL from '../config';

const ContactPage = () => {
  const [thanksOpen, setThanksOpen] = useState(false);
  const EMPTY = { name: '', email: '', organisation: '', message: '', hs_trap_field: '' };
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');
  const setField = (k) => (e) => { const v = e.target.value; setForm((f) => ({ ...f, [k]: v })); setFieldErrors((fe) => (fe[k] ? { ...fe, [k]: undefined } : fe)); };

  const [fieldErrors, setFieldErrors] = useState({});
  const validate = (f) => {
    const errs = {};
    if (!f.name.trim()) errs.name = 'Please enter your name.';
    if (!f.email.trim()) errs.email = 'Please enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errs.email = 'Please enter a valid email address.';
    if (!f.message.trim()) errs.message = 'Please enter a message.';
    return errs;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (sending) return;
    const errs = validate(form);
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      setFormError('Please fill in the required fields marked with *.');
      return;
    }
    setFormError('');
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/contact-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
      setForm(EMPTY);          // clear the form automatically
      setFieldErrors({});
      setThanksOpen(true);
    } catch (err) {
      setFormError(err.message || 'Could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
  <div className="page-enter">
    <div className="page-hero">
      <div className="page-hero-bg"><img src={IMGS.missionKids} alt="Students studying together"/></div>
      <div className="page-hero-overlay"/>
      <div className="page-hero-content">
        <div className="section-label">Contact Us</div>
        <h1>We'd Love to <em>Hear From You</em></h1>
        <p>Questions about giving, partnering or our first project? Send us a message and our team will reply as soon as we can.</p>
      </div>
    </div>

    <section className="section section-alt">
      <div className="section-inner">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4rem',alignItems:'center'}}>
          <div>
            <div className="section-label">Get In Touch</div>
            <h2 className="section-title">Contact <em>Headstart Education</em></h2>
            <p className="section-desc">Whether you're a donor, school, corporate partner, or community organisation, we'd love to hear from you.</p>
            <div style={{marginTop:'2rem'}}>
              {[{icon:'pin',label:'Registered Office',val:'Sydney, NSW 2000'},{icon:'mail',label:'General Enquiries',val:'info@hseducation.org'},{icon:'mail',label:'Donations & Receipts',val:'giving@hseducation.org'}].map(({icon,label,val}) => (
                <div key={label} style={{display:'flex',gap:'1rem',alignItems:'flex-start',marginBottom:'1.2rem'}}>
                  <div style={{width:36,height:36,background:'rgba(13,115,119,0.1)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Icon name={icon} size={18} color="var(--teal)"/></div>
                  <div><div style={{fontSize:'0.8rem',fontWeight:600,color:'var(--gray-500)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</div><div style={{fontSize:'0.9rem',color:'var(--gray-800)'}}>{val}</div></div>
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={sendMessage} noValidate style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:'16px',padding:'2rem'}}>
            <h3 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'1.5rem'}}>Send Us a Message</h3>
            <div className="form-group"><label className="form-label">Your Name <span style={{color:'#dc2626'}} aria-hidden="true">*</span></label><input className="form-input" placeholder="Jane Smith" value={form.name} onChange={setField('name')} maxLength={150} required aria-required="true" aria-invalid={!!fieldErrors.name} style={fieldErrors.name?{borderColor:'#dc2626'}:undefined}/>{fieldErrors.name && <div role="alert" style={{color:'#b91c1c',fontSize:'0.78rem',marginTop:'4px'}}>{fieldErrors.name}</div>}</div>
            <div className="form-group"><label className="form-label">Email <span style={{color:'#dc2626'}} aria-hidden="true">*</span></label><input className="form-input" type="email" placeholder="jane@example.com.au" value={form.email} onChange={setField('email')} maxLength={255} required aria-required="true" aria-invalid={!!fieldErrors.email} style={fieldErrors.email?{borderColor:'#dc2626'}:undefined}/>{fieldErrors.email && <div role="alert" style={{color:'#b91c1c',fontSize:'0.78rem',marginTop:'4px'}}>{fieldErrors.email}</div>}</div>
            <div className="form-group"><label className="form-label">Organisation (optional)</label><input className="form-input" placeholder="School, Company, etc." value={form.organisation} onChange={setField('organisation')} maxLength={200}/></div>
            <div className="form-group"><label className="form-label">Message <span style={{color:'#dc2626'}} aria-hidden="true">*</span></label><textarea className="form-input" rows={4} placeholder="How can we help?" style={{resize:'vertical',...(fieldErrors.message?{borderColor:'#dc2626'}:{})}} value={form.message} onChange={setField('message')} maxLength={5000} required aria-required="true" aria-invalid={!!fieldErrors.message}/>{fieldErrors.message && <div role="alert" style={{color:'#b91c1c',fontSize:'0.78rem',marginTop:'4px'}}>{fieldErrors.message}</div>}</div>
            {/* Honeypot — hidden from people, catches spam bots */}
            <input type="text" name="hs_trap_field" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.hs_trap_field} onChange={setField('hs_trap_field')} style={{position:'absolute',left:'-9999px',height:0,width:0,opacity:0}}/>
            <p style={{fontSize:'0.78rem',color:'var(--gray-500)',margin:'0 0 1rem'}}><span style={{color:'#dc2626'}}>*</span> Required</p>
            {formError && <div role="alert" style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#991b1b',borderRadius:'8px',padding:'0.6rem 0.9rem',fontSize:'0.85rem',marginBottom:'1rem'}}>{formError}</div>}
            <button className="donate-btn" type="submit" disabled={sending} style={sending?{opacity:0.7,cursor:'not-allowed'}:undefined}>{sending ? 'Sending…' : 'Send Message'}</button>
          </form>
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

export default ContactPage;
