import API_URL from '../config';
import missionKids    from './photos/missionKids.jpg';
import communityGroup from './photos/communityGroup.jpg';
import aboutFounders  from './photos/aboutFounders.jpg';
import impactBanner   from './photos/impactBanner.jpg';
import aboutMission   from './photos/aboutMission.jpg';
import donateHero     from './photos/donateHero.jpg';
import scholarship    from './photos/scholarship.jpg';
import literacy       from './photos/literacy.jpg';
import infrastructure from './photos/infrastructure.jpg';
import regional       from './photos/regional.jpg';
import teamHS         from './photos/teamHS.jpg';
import teamPS         from './photos/teamPS.jpg';
import teamTM         from './photos/teamTM.jpg';

// Bundled originals — only used as a safety net if the API can't serve an image.
const LOCAL = {
  missionKids, communityGroup, aboutFounders, impactBanner,
  aboutMission, donateHero, scholarship, literacy,
  infrastructure, regional,
  teamHS, teamPS, teamTM,
};

// The site's photos live in the database and are edited from Admin Console →
// Images, so every image is loaded from the API by its slot name.
const IMGS = Object.fromEntries(
  Object.keys(LOCAL).map((key) => [key, `${API_URL}/api/images/${key}`])
);

// If an image request fails (server starting up, database unavailable),
// swap in the bundled original instead of showing a broken picture.
export const installImageFallback = () => {
  document.addEventListener('error', (e) => {
    const el = e.target;
    if (!el || el.tagName !== 'IMG' || el.dataset.fallbackUsed) return;
    const m = /\/api\/images\/([A-Za-z0-9_]+)/.exec(el.getAttribute('src') || '');
    if (m && LOCAL[m[1]]) {
      el.dataset.fallbackUsed = '1';
      el.src = LOCAL[m[1]];
    }
  }, true);
};

export default IMGS;
