import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Errors } from '../../core/models/errors';
import { User } from '../../core/models/user';
import { useUser } from '../../core/auth/user-context';
import { ListErrors } from '../../shared/components/list-errors';

interface SettingsForm {
  image: string;
  username: string;
  bio: string;
  email: string;
  password: string;
}

export function Settings() {
  const navigate = useNavigate();
  const { getCurrentUserSync, update, logout } = useUser();

  const { register, handleSubmit, reset } = useForm<SettingsForm>({
    defaultValues: { image: '', username: '', bio: '', email: '', password: '' },
  });

  const [errors, setErrors] = useState<Errors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const user = getCurrentUserSync();
    if (user) {
      reset({
        image: user.image ?? '',
        username: user.username,
        bio: user.bio ?? '',
        email: user.email,
        password: '',
      });
    }
  }, [getCurrentUserSync, reset]);

  const submitForm = async (values: SettingsForm) => {
    setIsSubmitting(true);
    try {
      const { user } = await update(values as Partial<User>);
      navigate(`/profile/${user.username}`);
    } catch (err) {
      setErrors(err as Errors);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Your Settings</h1>

            <ListErrors errors={errors} />

            <form onSubmit={handleSubmit(submitForm)}>
              <fieldset disabled={isSubmitting}>
                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="URL of profile picture"
                    {...register('image')}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="text"
                    placeholder="Username"
                    {...register('username')}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <textarea
                    className="form-control form-control-lg"
                    rows={8}
                    placeholder="Short bio about you"
                    {...register('bio')}
                  ></textarea>
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="email"
                    placeholder="Email"
                    {...register('email')}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="password"
                    placeholder="New Password"
                    {...register('password')}
                  />
                </fieldset>

                <button className="btn btn-lg btn-primary pull-xs-right" type="submit">
                  Update Settings
                </button>
              </fieldset>
            </form>

            <hr />

            <button className="btn btn-outline-danger" onClick={logout}>
              Or click here to logout.
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
