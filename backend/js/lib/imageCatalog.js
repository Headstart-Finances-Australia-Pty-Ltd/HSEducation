// ============================================================
// Headstart Education — Site image catalog
// Every image slot the website uses: where it is shown and why.
// This is the source of truth for the "Where it's used" details in
// Admin Console → Images. Keep it in sync if you add/move an <img>.
// `file` is the original photo shipped in backend/seed-images.
// ============================================================
const HERO = 'Wide landscape, at least 1600×900 px';
const CARD = 'Landscape (about 3:2), at least 1000×700 px';
const PORTRAIT = 'Portrait or square, at least 600×800 px';

module.exports = [
  { key: 'heroStudents', label: 'Home page hero background', recommended: HERO,
    purpose: 'First impression of the site — the full-width background behind the main headline and Donate button.',
    usage: [{ page: 'Home', section: 'Hero (top of page)', note: 'Full-bleed background behind the headline' }] },
  { key: 'literacy', label: 'Child learning to read', recommended: CARD,
    purpose: 'Shows the learning-materials side of our work; reused wherever literacy / values are described.',
    usage: [
      { page: 'Home', section: 'Hero — right-hand photo card', note: '"Just Getting Started" caption card' },
      { page: 'Home', section: 'What we do — program cards', note: 'Card: Learning Materials & Resources' },
      { page: 'About', section: 'Mission / Vision / Values', note: 'Card: Our Values' } ] },
  { key: 'missionKids', label: 'Students studying together', recommended: CARD,
    purpose: 'Illustrates our mission of supporting children in disadvantaged communities.',
    usage: [
      { page: 'Home', section: 'Mission split', note: 'Large photo beside the mission text and "$10K" badge' },
      { page: 'About', section: 'Mission / Vision / Values', note: 'Card: Our Mission' },
      { page: 'Legal', section: 'Page header', note: 'Background behind the page title' } ] },
  { key: 'communityGroup', label: 'Community group', recommended: CARD,
    purpose: 'Conveys community and the people we serve; used as a supporting photo on several pages.',
    usage: [
      { page: 'About', section: 'Mission / Vision / Values', note: 'Card: Our Vision' },
      { page: 'About', section: 'Our approach (right column)', note: 'Lower of the two stacked photos' },
      { page: 'Projects', section: 'Page header', note: 'Background behind the page title' },
      { page: 'Impact', section: 'Impact tab', note: 'Photo above the community programs list' },
      { page: 'Donate', section: 'Right-hand panel', note: 'Photo above "Other ways to give"' } ] },
  { key: 'impactBanner', label: 'Impact banner (students)', recommended: HERO,
    purpose: 'Wide banner photo that frames key calls to action and the Impact page header.',
    usage: [
      { page: 'Home', section: 'Bottom call-to-action banner', note: 'Background behind the closing donate message' },
      { page: 'Projects', section: 'Bottom call-to-action banner', note: 'Background behind the closing donate message' },
      { page: 'Impact', section: 'Page header', note: 'Background behind the page title' } ] },
  { key: 'aboutMission', label: 'About page header', recommended: HERO,
    purpose: 'Sets the tone for the About page — students with hands raised.',
    usage: [{ page: 'About', section: 'Page header', note: 'Background behind the page title' }] },
  { key: 'aboutFounders', label: 'Founding directors', recommended: CARD,
    purpose: 'Puts a human face on the organisation in the "Our story" section.',
    usage: [{ page: 'About', section: 'Our story', note: 'Photo beside the story text' }] },
  { key: 'donateHero', label: 'Donate page header', recommended: HERO,
    purpose: 'Welcoming header image for the donation page.',
    usage: [{ page: 'Donate', section: 'Page header', note: 'Background behind "Make a donation"' }] },
  { key: 'infrastructure', label: 'Classroom infrastructure', recommended: CARD,
    purpose: 'Represents our first project — classrooms, desks and facilities for a rural school.',
    usage: [
      { page: 'Home', section: 'What we do — program cards', note: 'Card: First Project — Uttar Pradesh' },
      { page: 'Projects', section: 'Featured project', note: 'Large image beside the featured project details' },
      { page: 'About', section: 'Our approach (right column)', note: 'Upper of the two stacked photos' } ] },
  { key: 'scholarship', label: 'Scholarships', recommended: PORTRAIT,
    purpose: 'Represents the planned scholarship program.',
    usage: [{ page: 'Home', section: 'What we do — program cards', note: 'Card: Scholarships' }] },

  // Spare images: bundled with the site but not currently placed on any page.
  { key: 'indigenous', label: 'Spare — Indigenous education', recommended: CARD, purpose: 'Spare photo for a future Indigenous education program. Not currently shown on the site.', usage: [] },
  { key: 'vocational', label: 'Spare — Vocational training', recommended: CARD, purpose: 'Spare photo for a future vocational training program. Not currently shown on the site.', usage: [] },
  { key: 'mathsProgram', label: 'Spare — Maths program', recommended: CARD, purpose: 'Spare photo for a future maths program. Not currently shown on the site.', usage: [] },
  { key: 'regional', label: 'Spare — Regional schools', recommended: CARD, purpose: 'Spare photo for a future regional schools program. Not currently shown on the site.', usage: [] },
  { key: 'twoWay', label: 'Spare — Two-way learning', recommended: CARD, purpose: 'Spare photo for a future two-way learning program. Not currently shown on the site.', usage: [] },
  { key: 'pathways', label: 'Spare — Education pathways', recommended: CARD, purpose: 'Spare photo for a future pathways program. Not currently shown on the site.', usage: [] },
  ...['person1', 'person2', 'person3'].map((key, i) => ({
    key, label: `Spare — Portrait ${i + 1}`, recommended: PORTRAIT,
    purpose: 'Spare portrait, e.g. for a testimonial or profile. Not currently shown on the site.', usage: [] })),
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
    key: `team${n}`, label: `Spare — Team photo ${n}`, recommended: PORTRAIT,
    purpose: 'Spare team photo (the About page currently shows initials instead). Not currently shown on the site.', usage: [] })),
].map((e) => ({ ...e, file: `${e.key}.jpg` }));
