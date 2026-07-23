import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Errors } from '../../core/models/errors';
import { useUser } from '../../core/auth/user-context';
import { ListErrors } from '../../shared/components/list-errors';

interface AuthForm {
  email: string;
  password: string;
  username: string;
}

export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register: registerUser } = useUser();

  const authType = location.pathname === '/register' ? 'register' : 'login';
  const title = authType === 'login' ? 'Sign in' : 'Sign up';

  const {
    register,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<AuthForm>({
    mode: 'onChange',
    defaultValues: { email: '', password: '', username: '' },
  });

  const [errors, setErrors] = useState<Errors>({ errors: {} });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    reset({ email: '', password: '', username: '' });
    setErrors({ errors: {} });
  }, [authType, reset]);

  const submitForm = async (values: AuthForm) => {
    setIsSubmitting(true);
    setErrors({ errors: {} });

    try {
      if (authType === 'login') {
        await login({ email: values.email, password: values.password });
      } else {
        await registerUser({ email: values.email, password: values.password, username: values.username });
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
              {authType === 'register' && <Link to="/login">Have an account?</Link>}
              {authType === 'login' && <Link to="/register">Need an account?</Link>}
            </p>

            <ListErrors errors={errors} />

            <form onSubmit={handleSubmit(submitForm)}>
              <fieldset disabled={isSubmitting}>
                <fieldset className="form-group">
                  {authType === 'register' && (
                    <input
                      placeholder="Username"
                      className="form-control form-control-lg"
                      type="text"
                      {...register('username', { required: authType === 'register' })}
                    />
                  )}
                </fieldset>
                <fieldset className="form-group">
                  <input
                    placeholder="Email"
                    className="form-control form-control-lg"
                    type="text"
                    {...register('email', { required: true })}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    placeholder="Password"
                    className="form-control form-control-lg"
                    type="password"
                    {...register('password', { required: true })}
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

export default AuthPage;
