import { useState } from 'react';
import Modal from './Modal';

// NOTE: This is a simple client-side gate suitable for an internal/demo
// admin console. The credentials are not transmitted anywhere secret and
// this is NOT a substitute for real authentication — before using this in
// production, replace it with a proper backend-verified login (e.g. a
// hashed password check and a server session/JWT).
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'HSE$1';

const AdminLoginModal = ({ open, onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setError('');
      setUsername('');
      setPassword('');
      onSuccess();
    } else {
      setError('Incorrect username or password.');
    }
  };

  const handleClose = () => {
    setUsername('');
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Admin Login" width={380}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error && <div className="payment-error">{error}</div>}
        <button className="donate-btn" type="submit">Log In</button>
      </form>
    </Modal>
  );
};

export default AdminLoginModal;
