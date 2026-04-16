import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateUser } from '../services/auth.service';
import ListErrors from '../components/ListErrors';

function Settings() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [image, setImage] = useState(user?.image || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  useEffect(() => {
    if (user) {
      setImage(user.image || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setEmail(user.email || '');
    }
  }, [user]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors(null);
    try {
      const updates: Record<string, string> = { image, username, bio, email };
      if (password) updates.password = password;
      const updated = await updateUser(updates);
      setUser(updated);
      navigate(`/profile/${updated.username}`);
    } catch (err: unknown) {
      const errorObj = err as { errors?: Record<string, string[]> };
      setErrors(errorObj.errors || { '': ['An error occurred'] });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="settings-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Your Settings</h1>
            <ListErrors errors={errors} />
            <form onSubmit={handleSubmit}>
              <fieldset>
                <fieldset className="form-group">
                  <input className="form-control" type="text" placeholder="URL of profile picture" name="image" value={image} onChange={(e) => setImage(e.target.value)} />
                </fieldset>
                <fieldset className="form-group">
                  <input className="form-control form-control-lg" type="text" placeholder="Your Name" name="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </fieldset>
                <fieldset className="form-group">
                  <textarea className="form-control form-control-lg" rows={8} placeholder="Short bio about you" name="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
                </fieldset>
                <fieldset className="form-group">
                  <input className="form-control form-control-lg" type="text" placeholder="Email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </fieldset>
                <fieldset className="form-group">
                  <input className="form-control form-control-lg" type="password" placeholder="New Password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </fieldset>
                <button className="btn btn-lg btn-primary pull-xs-right" type="submit" disabled={submitting}>
                  Update Settings
                </button>
              </fieldset>
            </form>
            <hr />
            <button className="btn btn-outline-danger" onClick={handleLogout}>
              Or click here to logout.
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
