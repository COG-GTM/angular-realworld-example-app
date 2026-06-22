import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ListErrors } from '../components/ListErrors';
import type { ApiError } from '../api/client';

export function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const authType = location.pathname === '/register' ? 'register' : 'login';
  const title = authType === 'login' ? 'Sign in' : 'Sign up';

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset the form when switching between login and register.
  useEffect(() => {
    setUsername('');
    setEmail('');
    setPassword('');
    setErrors(null);
    setIsSubmitting(false);
  }, [authType]);

  const isValid = email !== '' && password !== '' && (authType === 'login' || username !== '');

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors(null);

    try {
      if (authType === 'login') {
        await login({ email, password });
      } else {
        await register({ username, email, password });
      }
      void navigate('/');
    } catch (err) {
      setErrors(err as ApiError);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">{title}</h1>
            <p className="text-xs-center">
              {authType === 'register' && <Link to="/login">Have an account?</Link>}
              {authType === 'login' && <Link to="/register">Need an account?</Link>}
            </p>

            <ListErrors errors={errors} />

            <form onSubmit={submitForm}>
              <fieldset disabled={isSubmitting}>
                {authType === 'register' && (
                  <fieldset className="form-group">
                    <input
                      name="username"
                      placeholder="Username"
                      className="form-control form-control-lg"
                      type="text"
                      value={username}
                      onChange={event => setUsername(event.target.value)}
                    />
                  </fieldset>
                )}
                <fieldset className="form-group">
                  <input
                    name="email"
                    placeholder="Email"
                    className="form-control form-control-lg"
                    type="text"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    name="password"
                    placeholder="Password"
                    className="form-control form-control-lg"
                    type="password"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                  />
                </fieldset>
                <button className="btn btn-lg btn-primary pull-xs-right" disabled={!isValid} type="submit">
                  {title}
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
