import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { authApi } from '../api/services';
import { ListErrors } from '../components/ListErrors';
import { useUser } from '../context/UserContext';
import type { Errors } from '../types';

export function Auth({ mode }: { mode: 'login' | 'register' }) {
  const isLogin = mode === 'login';
  const navigate = useNavigate();
  const { login } = useUser();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors(null);
    try {
      const { user } = isLogin
        ? await authApi.login({ email, password })
        : await authApi.register({ username, email, password });
      login(user);
      navigate('/');
    } catch (err) {
      setErrors(err instanceof ApiError ? err.errors : { error: ['Something went wrong'] });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">{isLogin ? 'Sign in' : 'Sign up'}</h1>
            <p className="text-xs-center">
              {isLogin ? <Link to="/register">Need an account?</Link> : <Link to="/login">Have an account?</Link>}
            </p>

            <ListErrors errors={errors} />

            <form onSubmit={onSubmit}>
              <fieldset disabled={isSubmitting}>
                {!isLogin && (
                  <fieldset className="form-group">
                    <input
                      className="form-control form-control-lg"
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required
                    />
                  </fieldset>
                )}
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </fieldset>
                <button className="btn btn-lg btn-primary pull-xs-right" type="submit">
                  {isLogin ? 'Sign in' : 'Sign up'}
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
