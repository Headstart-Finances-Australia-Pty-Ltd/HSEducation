import { useState } from 'react';
import IMGS from '../images';
import Icon from '../components/Icon';

const LegalPage = () => {
  const [open, setOpen] = useState(null);
  const faqs = [
    {q:'Is my donation tax-deductible?',a:'Yes. HS Education holds Deductible Gift Recipient (DGR) status endorsed by the Australian Taxation Office. All donations of $2 or more are fully tax-deductible. You will receive an electronic receipt immediately upon donation.'},
    {q:'How do I obtain a receipt for my donation?',a:'Tax receipts are issued automatically via email immediately after your donation is processed. If you haven\'t received one within 24 hours, contact giving@hseducation.com.au with your name, amount, and date.'},
    {q:'What happens to my personal information?',a:'HS Education collects and stores personal information in accordance with the Australian Privacy Act 1988 and the Australian Privacy Principles. We never sell, rent, or trade your personal information to third parties.'},
    {q:'How can I cancel a recurring donation?',a:'You may cancel your recurring donation at any time by contacting giving@hseducation.com.au. Cancellation requests are processed within 2 business days.'},
    {q:'How do I make a complaint?',a:'Submit complaints in writing to governance@hseducation.com.au or by post to the Chair of the Board. If unresolved, you may contact the ACNC at acnc.gov.au.'},
  ];

  return (
    <div className="page-enter">
      <div className="page-hero">
        <div className="page-hero-bg"><img src={IMGS.missionKids} alt="Education"/></div>
        <div className="page-hero-overlay"/>
        <div className="page-hero-content">
          <div className="section-label" style={{color:'#065f46'}}>Legal & Compliance</div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(2rem,4vw,3rem)',color:'#064e3b',marginBottom:'1rem'}}>Legal, Compliance & <em style={{color:'#065f46'}}>Governance</em></h1>
          <p style={{color:'#065f46',fontSize:'1.05rem'}}>HS Education is fully compliant with Australian charity law. Find our policies, registrations, and legal disclosures below.</p>
        </div>
      </div>

      <section className="section">
        <div className="section-inner">
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',marginBottom:'3rem'}}>
            {[{label:'ABN',val:'12 345 678 901'},{label:'ACN',val:'634 891 234'},{label:'ACNC Status',val:'Registered Charity'},{label:'DGR Endorsement',val:'Category 1 DGR'}].map(({label,val}) => (
              <div key={label} style={{background:'white',border:'2px solid var(--gray-200)',borderRadius:'12px',padding:'1.2rem',textAlign:'center'}}>
                <div style={{fontSize:'0.75rem',fontWeight:700,color:'var(--teal)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'0.5rem'}}>{label}</div>
                <div style={{fontFamily:'var(--font-display)',fontWeight:600,color:'var(--navy)',fontSize:'0.95rem'}}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2rem'}}>
            <div>
              {[
                {icon:'lock',title:'Privacy Policy',body:<><p>HS Education complies with the <strong>Privacy Act 1988 (Cth)</strong> and the Australian Privacy Principles.</p><ul><li>We collect only information necessary for stated purposes</li><li>Personal information is stored securely in Australia</li><li>We never sell or disclose data to third parties without consent</li><li>Credit card data is processed via PCI-DSS compliant providers</li><li>You may request access to or deletion of your personal data at any time</li></ul><p style={{marginTop:'0.5rem'}}>Contact: privacy@hseducation.com.au</p></>},
                {icon:'shield',title:'Child Protection Policy',body:<><p>HS Education is a Child Safe Organisation. We comply with all relevant state and territory child protection legislation.</p><ul><li>All staff and volunteers hold current Working with Children Checks</li><li>Mandatory child protection training for all personnel</li><li>Clear reporting procedures for suspected harm or abuse</li><li>Compliance with the National Principles for Child Safe Organisations</li></ul></>},
              ].map(({icon,title,body}) => (
                <div key={title} className="legal-section-box">
                  <div className="legal-section-title"><Icon name={icon} size={20} color="var(--navy)"/>{title}</div>
                  <div className="legal-body">{body}</div>
                </div>
              ))}
            </div>
            <div>
              {[
                {icon:'file',title:'Fundraising Compliance',body:<><p>HS Education holds fundraising licences in all states where required, complying with relevant <strong>Charitable Fundraising Acts</strong>.</p><ul><li>NSW: Charitable Fundraising Act 1991 — Licence No. CFN/12345</li><li>VIC: Fundraising Act 1998 — Registration No. FR0012345</li><li>QLD: Collections Act 1966 — Approval No. CP/2013/1234</li><li>All online fundraising complies with ACNC guidance and state laws</li></ul></>},
                {icon:'users',title:'Employment & Volunteer Policy',body:<><p>We are an equal opportunity employer compliant with the <strong>Fair Work Act 2009</strong> and all applicable employment law.</p><ul><li>Anti-discrimination and equal opportunity policies in place</li><li>Modern slavery statement published annually</li><li>Volunteer management policy consistent with ACNC guidance</li><li>WHS obligations met for all staff and volunteers</li></ul></>},
                {icon:'globe',title:'Terms of Use & Donations',body:<><ul><li>Donations are non-refundable except as required by law</li><li>HS Education may direct funds to the area of greatest need if a specific project is fully funded</li><li>Recurring donations may be cancelled with 2 business days notice</li><li>This website is governed by the laws of New South Wales, Australia</li></ul></>},
              ].map(({icon,title,body}) => (
                <div key={title} className="legal-section-box">
                  <div className="legal-section-title"><Icon name={icon} size={20} color="var(--navy)"/>{title}</div>
                  <div className="legal-body">{body}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{marginTop:'3rem'}}>
            <h2 style={{fontFamily:'var(--font-display)',color:'var(--navy)',marginBottom:'2rem'}}>Frequently Asked <em style={{color:'var(--teal)'}}>Legal Questions</em></h2>
            <div style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:'16px',padding:'1rem 2rem'}}>
              {faqs.map(({q,a},i) => (
                <div key={i} className="accordion-item">
                  <div className="accordion-header" onClick={() => setOpen(open===i?null:i)}>
                    <span>{q}</span><Icon name={open===i?'minus':'plus'} size={18} color="var(--teal)"/>
                  </div>
                  {open===i && <div className="accordion-body">{a}</div>}
                </div>
              ))}
            </div>
          </div>

          <div style={{marginTop:'3rem',background:'linear-gradient(135deg,var(--navy),var(--teal))',borderRadius:'16px',padding:'2rem',color:'white',display:'flex',gap:'1.5rem',alignItems:'flex-start'}}>
            <div style={{fontSize:'2.5rem',flexShrink:0}}>🏛</div>
            <div>
              <h3 style={{fontFamily:'var(--font-display)',marginBottom:'0.75rem'}}>Regulated by the ACNC</h3>
              <p style={{fontSize:'0.9rem',color:'rgba(255,255,255,0.85)',lineHeight:1.7,marginBottom:'0.75rem'}}>HS Education is registered with the Australian Charities and Not-for-Profits Commission (ACNC). Verify our registration and access public annual reports on the ACNC Charity Register.</p>
              <a href="https://www.acnc.gov.au" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',color:'white',padding:'0.5rem 1.2rem',borderRadius:'8px',fontSize:'0.88rem',fontWeight:600}}>
                <Icon name="globe" size={15}/> View on ACNC Register →
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};


export default LegalPage;
