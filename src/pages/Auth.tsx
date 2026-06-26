import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ListErrors } from '../components/ListErrors';
import type { Errors } from '../types';

export function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const isRegister = location.pathname === '/register';

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = isRegister ? username && email && password : email && password;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors(null);

    try {
      if (isRegister) {
        await register({ username, email, password });
      } else {
        await login({ email, password });
      }
      void navigate('/');
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
            <h1 className="text-xs-center">{isRegister ? 'Sign up' : 'Sign in'}</h1>
            <p className="text-xs-center">
              {isRegister ? <Link to="/login">Have an account?</Link> : <Link to="/register">Need an account?</Link>}
            </p>

            <ListErrors errors={errors} />

            <form onSubmit={handleSubmit}>
              {isRegister && (
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={username}
                    onChange={event => setUsername(event.target.value)}
                  />
                </fieldset>
              )}

              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                />
              </fieldset>

              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                />
              </fieldset>

              <button
                className="btn btn-lg btn-primary pull-xs-right"
                type="submit"
                disabled={!isValid || isSubmitting}
              >
                {isRegister ? 'Sign up' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
