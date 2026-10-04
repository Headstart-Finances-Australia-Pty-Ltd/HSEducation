import IMGS from '../images';

// The logo is an editable image (Admin Console → Images → "Website logo").
// If it can't be loaded, the bundled original is swapped in automatically.
const Logo = ({ size = 44 }) => (
  <img src={IMGS.logo} width={size} height={size} alt="Headstart Education logo"
    style={{ display: 'block', objectFit: 'contain', flexShrink: 0 }} />
);

export default Logo;
