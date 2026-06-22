import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ListErrors } from '../components/ListErrors';
import type { ApiError } from '../api/client';

export function Settings() {
  const navigate = useNavigate();
  const { currentUser, update, logout } = useAuth();

  const [image, setImage] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errors, setErrors] = useState<ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setImage(currentUser.image ?? '');
      setUsername(currentUser.username);
      setBio(currentUser.bio ?? '');
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  const submitForm = (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    update({ image, username, bio, email, password })
      .then(user => {
        void navigate(`/profile/${user.username}`);
      })
      .catch((err: ApiError) => {
        setErrors(err);
        setIsSubmitting(false);
      });
  };

  const onLogout = () => {
    logout();
    void navigate('/');
  };

  return (
    <div className="settings-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Your Settings</h1>

            <ListErrors errors={errors} />

            <form onSubmit={submitForm}>
              <fieldset disabled={isSubmitting}>
                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="URL of profile picture"
                    name="image"
                    value={image}
                    onChange={event => setImage(event.target.value)}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="text"
                    placeholder="Username"
                    name="username"
                    value={username}
                    onChange={event => setUsername(event.target.value)}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <textarea
                    className="form-control form-control-lg"
                    rows={8}
                    placeholder="Short bio about you"
                    name="bio"
                    value={bio}
                    onChange={event => setBio(event.target.value)}
                  ></textarea>
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="email"
                    placeholder="Email"
                    name="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="password"
                    placeholder="New Password"
                    name="password"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                  />
                </fieldset>

                <button className="btn btn-lg btn-primary pull-xs-right" type="submit">
                  Update Settings
                </button>
              </fieldset>
            </form>

            <hr />

            <button className="btn btn-outline-danger" onClick={onLogout}>
              Or click here to logout.
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
