import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import type { Errors } from '../types/errors';
import { ListErrors } from '../components/ListErrors';

export function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const isRegister = location.pathname === '/register';
  const title = isRegister ? 'Sign up' : 'Sign in';

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset the form when switching between login and register.
  useEffect(() => {
    setUsername('');
    setEmail('');
    setPassword('');
    setErrors(null);
    setIsSubmitting(false);
  }, [isRegister]);

  const isValid = email.length > 0 && password.length > 0 && (!isRegister || username.length > 0);

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({ errors: {} });

    try {
      if (isRegister) {
        await register({ username, email, password });
      } else {
        await login({ email, password });
      }
      navigate('/');
    } catch (err) {
      setErrors(err as Errors);
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
              {isRegister ? <Link to="/login">Have an account?</Link> : <Link to="/register">Need an account?</Link>}
            </p>

            <ListErrors errors={errors} />

            <form onSubmit={submitForm}>
              <fieldset disabled={isSubmitting}>
                {isRegister && (
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
