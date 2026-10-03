import API_URL from '../config';
import heroStudents   from './photos/heroStudents.jpg';
import missionKids    from './photos/missionKids.jpg';
import communityGroup from './photos/communityGroup.jpg';
import aboutFounders  from './photos/aboutFounders.jpg';
import impactBanner   from './photos/impactBanner.jpg';
import aboutMission   from './photos/aboutMission.jpg';
import donateHero     from './photos/donateHero.jpg';
import scholarship    from './photos/scholarship.jpg';
import literacy       from './photos/literacy.jpg';
import indigenous     from './photos/indigenous.jpg';
import vocational     from './photos/vocational.jpg';
import infrastructure from './photos/infrastructure.jpg';
import mathsProgram   from './photos/mathsProgram.jpg';
import regional       from './photos/regional.jpg';
import twoWay         from './photos/twoWay.jpg';
import pathways       from './photos/pathways.jpg';
import person1        from './photos/person1.jpg';
import person2        from './photos/person2.jpg';
import person3        from './photos/person3.jpg';
import team1          from './photos/team1.jpg';
import team2          from './photos/team2.jpg';
import team3          from './photos/team3.jpg';
import team4          from './photos/team4.jpg';
import team5          from './photos/team5.jpg';
import team6          from './photos/team6.jpg';
import team7          from './photos/team7.jpg';
import team8          from './photos/team8.jpg';
import teamHS         from './photos/teamHS.jpg';
import teamPS         from './photos/teamPS.jpg';
import teamTM         from './photos/teamTM.jpg';

// Bundled originals — only used as a safety net if the API can't serve an image.
const LOCAL = {
  heroStudents, missionKids, communityGroup, aboutFounders, impactBanner,
  aboutMission, donateHero, scholarship, literacy, indigenous, vocational,
  infrastructure, mathsProgram, regional, twoWay, pathways,
  person1, person2, person3,
  team1, team2, team3, team4, team5, team6, team7, team8,
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
