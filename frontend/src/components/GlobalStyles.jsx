const GlobalStyles = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --navy:       #1a3a5c;
      --navy-light: #2c5282;
      --gold:       #d4a017;
      --gold-light: #f0c040;
      --teal:       #0d7377;
      --teal-light: #14a8ae;
      --cream:      #faf8f3;
      --white:      #ffffff;
      --gray-50:    #f8fafc;
      --gray-100:   #f1f5f9;
      --gray-200:   #e2e8f0;
      --gray-400:   #94a3b8;
      --gray-600:   #475569;
      --gray-800:   #1e293b;
      --font-display: 'Fraunces', Georgia, serif;
      --font-body:    'DM Sans', sans-serif;
      --shadow-sm:  0 2px 8px rgba(26,58,92,0.08);
      --shadow-md:  0 8px 32px rgba(26,58,92,0.12);
      --shadow-lg:  0 20px 60px rgba(26,58,92,0.18);
      --radius-sm:  6px;
      --radius-md:  12px;
      --radius-lg:  20px;
    }
    html { scroll-behavior: smooth; }
    body { font-family: var(--font-body); background: var(--cream); color: var(--gray-800); line-height: 1.6; -webkit-font-smoothing: antialiased; }
    h1,h2,h3,h4,h5 { font-family: var(--font-display); line-height: 1.2; }
    a { color: inherit; text-decoration: none; }
    button { cursor: pointer; border: none; background: none; font-family: var(--font-body); }
    img { max-width: 100%; display: block; }

    /* NAV */
    .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 999; background: rgba(255,255,255,0.97); backdrop-filter: blur(12px); border-bottom: 1px solid var(--gray-200); box-shadow: var(--shadow-sm); }
    .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; height: 72px; }
    .nav-logo { display: flex; align-items: center; gap: 10px; cursor: pointer; }
    .nav-logo-text { font-family: var(--font-display); font-weight: 600; font-size: 1.15rem; color: var(--navy); }
    .nav-logo-sub { font-size: 0.68rem; color: var(--gray-600); font-family: var(--font-body); letter-spacing: 0.05em; text-transform: uppercase; }
    .nav-links { display: flex; gap: 2rem; align-items: center; }
    .nav-link { font-size: 0.9rem; font-weight: 500; color: var(--gray-600); padding: 0.4rem 0; border-bottom: 2px solid transparent; transition: all 0.2s; cursor: pointer; }
    .nav-link:hover, .nav-link.active { color: var(--navy); border-bottom-color: var(--gold); }
    .nav-cta { background: var(--navy); color: white; padding: 0.55rem 1.4rem; border-radius: 8px; font-size: 0.9rem; font-weight: 600; transition: all 0.2s; }
    .nav-cta:hover { background: var(--teal); transform: translateY(-1px); }
    .nav-hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; padding: 4px; }
    .nav-hamburger span { display: block; width: 22px; height: 2px; background: var(--navy); border-radius: 2px; }
    .nav-mobile { display: none; flex-direction: column; background: white; border-bottom: 1px solid var(--gray-200); padding: 1rem 2rem 1.5rem; }
    .nav-mobile.open { display: flex; }
    .nav-mobile .nav-link { padding: 0.7rem 0; border-bottom: 1px solid var(--gray-100); }

    /* HERO */
    .hero { min-height: 100vh; position: relative; overflow: hidden; padding-top: 72px; display: flex; align-items: center; }
    .hero-bg-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; }
    .hero-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(254,249,195,0.97) 0%, rgba(254,249,195,0.96) 40%, rgba(209,250,229,0.95) 70%, rgba(6,95,70,0.90) 100%); }
    .hero-dots { position: absolute; inset: 0; background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px); background-size: 32px 32px; }
    .hero-inner { max-width: 1200px; margin: 0 auto; padding: 5rem 2rem; position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
    .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(5,150,105,0.12); border: 1px solid rgba(5,150,105,0.3); color: #065f46; padding: 0.4rem 1rem; border-radius: 100px; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 1.5rem; }
    .hero-title { font-size: clamp(2.4rem, 5vw, 3.8rem); color: #064e3b; margin-bottom: 1.5rem; font-weight: 300; }
    .hero-title strong { font-weight: 700; color: #0d7377; font-style: italic; }
    .hero-desc { font-size: 1.1rem; color: #065f46; max-width: 520px; margin-bottom: 2.5rem; }
    .hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
    .hero-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 3rem; }
    .hero-stat { text-align: center; background: white; border: none; border-radius: 8px; padding: 1.2rem 0.8rem; box-shadow: 0 2px 8px rgba(6,95,70,0.1); }
    .hero-stat-num { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: #059669; }
    .hero-stat-label { font-size: 0.78rem; color: #64748b; margin-top: 4px; }
    .hero-img-card { position: relative; border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-lg); }
    .hero-img-card img { width: 100%; height: 420px; object-fit: cover; }
    .hero-img-card-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(0deg, rgba(15,30,55,0.9) 0%, transparent 100%); padding: 2rem 1.5rem 1.5rem; }
    .hero-img-badge { display: inline-flex; align-items: center; gap: 6px; background: #059669; color: white; font-weight: 700; font-size: 0.82rem; padding: 0.35rem 0.9rem; border-radius: 100px; margin-bottom: 0.5rem; }
    .hero-img-caption { color: white; font-size: 1rem; font-family: var(--font-display); }

    /* BUTTONS */
    .btn-primary { background: #059669; color: white; padding: 0.85rem 2rem; border-radius: 8px; font-weight: 700; font-size: 0.95rem; transition: all 0.25s; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; border: none; font-family: var(--font-body); }
    .btn-primary:hover { background: #065f46; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(5,150,105,0.3); }
    .btn-outline { background: transparent; color: #064e3b; padding: 0.85rem 2rem; border: 2px solid #059669; border-radius: 8px; font-weight: 600; font-size: 0.95rem; transition: all 0.25s; cursor: pointer; font-family: var(--font-body); }
    .btn-outline:hover { border-color: #064e3b; background: rgba(5,150,105,0.08); }
    .btn-teal { background: var(--teal); color: white; padding: 0.7rem 1.5rem; border-radius: 8px; font-weight: 600; font-size: 0.9rem; transition: all 0.2s; cursor: pointer; border: none; font-family: var(--font-body); }
    .btn-teal:hover { background: var(--teal-light); transform: translateY(-1px); }

    /* IMPACT STRIP */
    .impact-strip { background: #fdf8f0; border-top: 4px solid #0d7377; border-bottom: 4px solid #0d7377; padding: 4rem 2rem; }
    .impact-strip-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; }
    .impact-num { text-align: center; }
    .impact-num-val { font-family: var(--font-display); font-size: 3rem; font-weight: 700; color: #0d7377; display: block; }
    .impact-num-label { font-size: 0.9rem; color: #5c4a35; margin-top: 6px; }

    /* SECTIONS */
    .section { padding: 6rem 2rem; }
    .section-inner { max-width: 1200px; margin: 0 auto; }
    .section-label { text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.8rem; font-weight: 600; color: var(--teal); margin-bottom: 0.75rem; }
    .section-title { font-size: clamp(1.8rem, 3vw, 2.8rem); color: var(--navy); margin-bottom: 1.25rem; }
    .section-title em { color: var(--teal); font-style: italic; }
    .section-desc { font-size: 1.05rem; color: var(--gray-600); max-width: 600px; line-height: 1.7; }
    .section-alt { background: var(--gray-50); }

    /* PROGRAM CARDS */
    .prog-card { background: white; border: 1px solid var(--gray-200); border-radius: var(--radius-lg); overflow: hidden; transition: all 0.3s; }
    .prog-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-md); }
    .prog-card-img { height: 200px; overflow: hidden; position: relative; }
    .prog-card-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
    .prog-card:hover .prog-card-img img { transform: scale(1.05); }
    .prog-card-img-overlay { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(15,30,55,0.5) 0%, transparent 60%); }
    .prog-card-body { padding: 1.5rem; }
    .prog-tag { display: inline-block; background: rgba(13,115,119,0.1); color: var(--teal); font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.75rem; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; }
    .prog-title { font-family: var(--font-display); font-size: 1.2rem; color: var(--navy); margin-bottom: 0.5rem; }
    .prog-text { font-size: 0.88rem; color: var(--gray-600); line-height: 1.65; margin-bottom: 1rem; }
    .prog-progress { height: 6px; background: var(--gray-100); border-radius: 100px; overflow: hidden; margin-bottom: 0.5rem; }
    .prog-progress-bar { height: 100%; background: linear-gradient(90deg, var(--teal), var(--gold)); border-radius: 100px; }
    .prog-meta { display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--gray-600); }
    .prog-meta strong { color: var(--navy); }

    /* MISSION */
    .mission-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
    .mission-img-wrap { position: relative; }
    .mission-img-badge { position: absolute; bottom: -20px; right: -20px; background: white; border-radius: 16px; padding: 1.2rem 1.5rem; box-shadow: var(--shadow-md); border: 1px solid var(--gray-200); text-align: center; }
    .mission-img-badge-num { font-family: var(--font-display); font-size: 2.2rem; font-weight: 700; color: var(--teal); }
    .mission-img-badge-text { font-size: 0.78rem; color: var(--gray-600); margin-top: 2px; }

    /* TESTIMONIALS */
    .testi-card { background: white; border: 1px solid var(--gray-200); border-radius: 16px; padding: 2rem; position: relative; transition: all 0.3s; }
    .testi-card:hover { box-shadow: var(--shadow-md); transform: translateY(-3px); }
    .testi-quote-mark { font-size: 4rem; color: var(--teal); opacity: 0.2; font-family: Georgia; line-height: 0.8; margin-bottom: 0.5rem; }
    .testi-text { font-size: 0.9rem; color: var(--gray-700); line-height: 1.7; font-style: italic; margin-bottom: 1.5rem; }
    .testi-author { display: flex; align-items: center; gap: 12px; }
    .testi-avatar { width: 48px; height: 48px; border-radius: 50%; overflow: hidden; flex-shrink: 0; border: 2px solid var(--gray-200); }
    .testi-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .testi-name { font-weight: 600; font-size: 0.9rem; color: var(--navy); }
    .testi-role { font-size: 0.78rem; color: var(--gray-600); }

    /* TEAM */
    .team-card { background: white; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--gray-200); text-align: center; transition: all 0.3s; }
    .team-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
    .team-card-img { height: 180px; overflow: hidden; }
    .team-card-img img { width: 100%; height: 100%; object-fit: cover; object-position: top; transition: transform 0.4s; }
    .team-card:hover .team-card-img img { transform: scale(1.05); }
    .team-body { padding: 1.2rem 1rem; }
    .team-name { font-family: var(--font-display); font-size: 1rem; color: var(--navy); margin-bottom: 0.2rem; }
    .team-role { font-size: 0.78rem; color: var(--teal); font-weight: 600; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .team-bio { font-size: 0.82rem; color: var(--gray-600); line-height: 1.55; }

    /* PAGE HERO */
    .page-hero { position: relative; overflow: hidden; padding: 5rem 2rem 6rem; margin-top: 72px; }
    .page-hero-bg { position: absolute; inset: 0; }
    .page-hero-bg img { width: 100%; height: 100%; object-fit: cover; }
    .page-hero-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(254,249,195,0.97) 0%, rgba(254,249,195,0.96) 40%, rgba(209,250,229,0.95) 70%, rgba(6,95,70,0.90) 100%); }
    .page-hero-content { position: relative; z-index: 1; max-width: 700px; margin: 0 auto; text-align: center; }

    /* IMPACT BANNER */
    .impact-banner { position: relative; overflow: hidden; padding: 6rem 2rem; }
    .impact-banner-bg { position: absolute; inset: 0; }
    .impact-banner-bg img { width: 100%; height: 100%; object-fit: cover; }
    .impact-banner-overlay { position: absolute; inset: 0; background: linear-gradient(160deg, rgba(236,253,245,0.96) 0%, rgba(209,250,229,0.94) 60%, rgba(254,249,195,0.92) 100%); }
    .impact-banner-content { position: relative; z-index: 1; text-align: center; max-width: 700px; margin: 0 auto; }

    /* DONATE HERO */
    .donate-hero { position: relative; overflow: hidden; padding: 4rem 2rem 5rem; margin-top: 72px; }
    .donate-hero-bg { position: absolute; inset: 0; }
    .donate-hero-bg img { width: 100%; height: 100%; object-fit: cover; object-position: center 30%; }
    .donate-hero-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(254,249,195,0.97) 0%, rgba(254,249,195,0.96) 40%, rgba(209,250,229,0.95) 70%, rgba(6,95,70,0.90) 100%); }
    .donate-hero-content { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; text-align: center; }

    /* FORMS */
    .form-group { margin-bottom: 1.2rem; }
    .form-label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--gray-800); margin-bottom: 0.5rem; }
    .form-input { width: 100%; border: 1.5px solid var(--gray-200); border-radius: 8px; padding: 0.75rem 1rem; font-family: var(--font-body); font-size: 0.95rem; color: var(--gray-800); background: white; transition: border-color 0.2s; }
    .form-input:focus { outline: none; border-color: var(--teal); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .donate-btn { width: 100%; background: var(--navy); color: white; padding: 1rem; border-radius: 10px; font-size: 1rem; font-weight: 700; transition: all 0.25s; margin-top: 0.5rem; cursor: pointer; border: none; font-family: var(--font-body); }
    .donate-btn:hover { background: var(--teal); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(13,115,119,0.3); }
    .donation-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: start; margin-top: 3rem; }
    .donation-amounts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; }
    .amount-btn { background: white; border: 2px solid var(--gray-200); border-radius: 10px; padding: 1rem; text-align: center; cursor: pointer; transition: all 0.2s; font-family: var(--font-body); }
    .amount-btn:hover, .amount-btn.active { border-color: var(--teal); background: rgba(13,115,119,0.06); }
    .amount-btn .amount { font-family: var(--font-display); font-size: 1.4rem; font-weight: 600; color: var(--navy); }
    .amount-btn .impact { font-size: 0.75rem; color: var(--gray-600); margin-top: 2px; }
    .donation-info-item { display: flex; gap: 1rem; align-items: flex-start; padding: 1.2rem 0; border-bottom: 1px solid var(--gray-200); }
    .donation-info-item:last-child { border-bottom: none; }

    /* TABS */
    .tabs { display: flex; gap: 0.5rem; border-bottom: 2px solid var(--gray-200); margin-bottom: 2.5rem; overflow-x: auto; }
    .tab { padding: 0.75rem 1.5rem; font-size: 0.9rem; font-weight: 600; color: var(--gray-600); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s; white-space: nowrap; font-family: var(--font-body); }
    .tab.active { color: var(--navy); border-bottom-color: var(--gold); }

    /* TIMELINE */
    .timeline { position: relative; padding-left: 2rem; }
    .timeline::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--gray-200); }
    .timeline-item { position: relative; padding-bottom: 2rem; }
    .timeline-item::before { content: ''; position: absolute; left: -2rem; top: 4px; width: 14px; height: 14px; border-radius: 50%; background: var(--teal); border: 3px solid white; box-shadow: 0 0 0 2px var(--teal); transform: translateX(-6px); }
    .timeline-year { font-size: 0.8rem; font-weight: 700; color: var(--teal); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.3rem; }
    .timeline-title { font-family: var(--font-display); font-size: 1.05rem; color: var(--navy); margin-bottom: 0.3rem; }
    .timeline-text { font-size: 0.88rem; color: var(--gray-600); }

    /* CHART BARS */
    .chart-bar-group { margin-bottom: 1.5rem; }
    .chart-bar-label { display: flex; justify-content: space-between; font-size: 0.88rem; color: var(--gray-700); margin-bottom: 0.4rem; font-weight: 500; }
    .chart-bar-track { height: 10px; background: var(--gray-100); border-radius: 100px; overflow: hidden; }
    .chart-bar-fill { height: 100%; border-radius: 100px; }

    /* LEGAL */
    .legal-section-box { background: white; border: 1px solid var(--gray-200); border-radius: var(--radius-md); padding: 2rem; margin-bottom: 1.5rem; }
    .legal-section-title { font-family: var(--font-display); font-size: 1.2rem; color: var(--navy); margin-bottom: 1rem; display: flex; align-items: center; gap: 10px; }
    .legal-body { font-size: 0.9rem; color: var(--gray-600); line-height: 1.75; }
    .legal-body ul { padding-left: 1.5rem; margin: 0.5rem 0; }
    .legal-body li { margin-bottom: 0.4rem; }

    /* ACCORDION */
    .accordion-item { border-bottom: 1px solid var(--gray-200); }
    .accordion-header { display: flex; justify-content: space-between; align-items: center; padding: 1.2rem 0; cursor: pointer; font-weight: 600; color: var(--navy); font-family: var(--font-body); }
    .accordion-body { font-size: 0.9rem; color: var(--gray-600); line-height: 1.7; padding-bottom: 1.2rem; }
    .annual-report-card { background: white; border: 1px solid var(--gray-200); border-radius: var(--radius-md); padding: 1.5rem; display: flex; align-items: center; gap: 1.2rem; transition: all 0.2s; cursor: pointer; }
    .annual-report-card:hover { border-color: var(--teal); box-shadow: var(--shadow-sm); }
    .success-box { background: rgba(13,115,119,0.08); border: 1.5px solid var(--teal); border-radius: 12px; padding: 2rem; text-align: center; }

    /* FOOTER */
    .footer { background: var(--gray-800); color: white; padding: 2rem 2rem 1rem; }
    .footer-inner { max-width: 1200px; margin: 0 auto; }
    .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .footer-brand { color: rgba(255,255,255,0.65); font-size: 0.78rem; line-height: 1.5; margin-top: 0.5rem; }
    .footer-col-title { font-weight: 600; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--gold-light); margin-bottom: 0.6rem; }
    .footer-links { list-style: none; }
    .footer-links li { margin-bottom: 0.25rem; }
    .footer-links a { color: rgba(255,255,255,0.65); font-size: 0.76rem; cursor: pointer; transition: color 0.2s; }
    .footer-links a:hover { color: white; }
    .footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: rgba(255,255,255,0.5); flex-wrap: wrap; gap: 0.5rem; }
    .footer-acnc { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.7rem; color: rgba(255,255,255,0.75); }

    /* CARDS GRID */
    .cards-grid { display: grid; gap: 1.5rem; margin-top: 2.5rem; }
    .cards-3 { grid-template-columns: repeat(3, 1fr); }
    .cards-4 { grid-template-columns: repeat(4, 1fr); }
    .cards-2 { grid-template-columns: repeat(2, 1fr); }

    /* MODAL / POPUP */
    .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.55); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1.5rem; overflow-y: auto; animation: fadeIn 0.18s ease; }
    .modal-dialog { background: white; border-radius: 16px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-height: calc(100vh - 3rem); max-height: calc(100dvh - 3rem); margin: auto; overflow-y: auto; animation: popIn 0.2s ease; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--gray-200); }
    .modal-title { font-family: var(--font-display); font-weight: 600; font-size: 1.1rem; color: var(--navy); }
    .modal-close { background: none; border: none; cursor: pointer; color: var(--gray-500); display: flex; padding: 4px; border-radius: 6px; }
    .modal-close:hover { background: var(--gray-100); color: var(--gray-800); }
    .modal-body { padding: 1.5rem; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: none; } }

    /* SQUARE PAYMENT POPUP */
    .donate-summary { background: rgba(13,115,119,0.07); border: 1px solid var(--teal); border-radius: 10px; padding: 0.75rem 1rem; margin-bottom: 1.2rem; font-size: 0.92rem; color: var(--navy); text-align: center; }
    .pay-method-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .pay-method-tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 0.6rem; border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; background: white; color: var(--gray-600); border: 2px solid var(--gray-200); font-family: var(--font-body); }
    .pay-method-tab.active { border-color: var(--teal); color: var(--teal); background: rgba(13,115,119,0.06); }
    .sq-field-container { min-height: 90px; border: 1.5px solid var(--gray-200); border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem; }
    .payment-loading { font-size: 0.85rem; color: var(--gray-500); text-align: center; padding: 1.5rem 0; }
    .payment-error { background: rgba(220,38,38,0.08); border: 1px solid #dc2626; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 0.85rem; color: #dc2626; }
    .payment-notice { background: rgba(212,160,23,0.1); border: 1px solid var(--gold); border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.2rem; font-size: 0.8rem; color: #6b5215; line-height: 1.6; }
    .payment-notice code { background: rgba(0,0,0,0.06); padding: 0.1rem 0.35rem; border-radius: 4px; font-size: 0.78rem; }
    .payment-footnote { display: flex; align-items: center; gap: 8px; margin-top: 1rem; font-size: 0.78rem; color: var(--gray-600); }

    /* ADMIN CONSOLE — DB table column filter popover */
    .col-filter-popover { position: absolute; top: 100%; left: 0; z-index: 20; background: white; border: 1px solid var(--gray-200); border-radius: 8px; box-shadow: var(--shadow-md); width: 200px; margin-top: 4px; }

    /* ADMIN CONSOLE */
    .admin-hero { background: linear-gradient(135deg, var(--navy), var(--teal)); padding: 4rem 2rem; margin-top: 72px; }
    .admin-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .admin-table th { text-align: left; padding: 0.9rem 1.2rem; background: var(--gray-100); color: var(--gray-700); font-weight: 600; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .admin-table td { padding: 0.8rem 1.2rem; border-top: 1px solid var(--gray-100); color: var(--gray-800); }
    .admin-status { display: inline-block; padding: 0.2rem 0.65rem; border-radius: 100px; font-size: 0.72rem; font-weight: 700; text-transform: capitalize; background: var(--gray-100); color: var(--gray-600); }
    .admin-status-completed, .admin-status-active { background: rgba(13,115,119,0.12); color: var(--teal); }
    .admin-status-pending, .admin-status-fundraising { background: rgba(212,160,23,0.14); color: #a16207; }
    .admin-status-failed { background: rgba(220,38,38,0.1); color: #dc2626; }

    /* PAGE ANIMATION */
    .page-enter { animation: fadeUp 0.45s ease both; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }

    /* RESPONSIVE */
    @media (max-width: 960px) {
      .hero-inner, .mission-grid, .donation-grid { grid-template-columns: 1fr; }
      .hero-img-card { display: none; }
      .cards-3, .cards-4 { grid-template-columns: repeat(2, 1fr); }
      .impact-strip-inner { grid-template-columns: repeat(2, 1fr); }
      .footer-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 600px) {
      .nav-links { display: none; }
      .nav-hamburger { display: flex; }
      .cards-3, .cards-4, .cards-2 { grid-template-columns: 1fr; }
      .impact-strip-inner { grid-template-columns: repeat(2, 1fr); }
      .footer-grid { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
      .section { padding: 4rem 1.25rem; }
      .hero-stats { grid-template-columns: repeat(3, 1fr); }
    }
  `}</style>
);

export default GlobalStyles;
