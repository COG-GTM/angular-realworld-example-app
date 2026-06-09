import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ListErrors } from '../components/ListErrors';
import { useAuth } from '../context/AuthContext';
import type { ApiError } from '../services/api';
import type { Errors } from '../types';

/**
 * Combined login/register page. The mode is derived from the route
 * (/login vs /register), matching the Angular AuthComponent.
 */
export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const authType = location.pathname === '/register' ? 'register' : 'login';
  const title = authType === 'login' ? 'Sign in' : 'Sign up';

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({ errors: {} });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = email.trim() !== '' && password.trim() !== '' && (authType === 'login' || username.trim() !== '');

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({ errors: {} });

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
              {authType === 'register' ? (
                <Link to="/login">Have an account?</Link>
              ) : (
                <Link to="/register">Need an account?</Link>
              )}
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
                      onChange={e => setUsername(e.target.value)}
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
                    onChange={e => setEmail(e.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    name="password"
                    placeholder="Password"
                    className="form-control form-control-lg"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
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
