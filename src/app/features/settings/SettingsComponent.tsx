import React, { useState, useEffect, FormEvent } from 'react';

/**
 * React port of Angular SettingsComponent
 *
 * Original Angular component: settings.component.ts
 * - @Input: none
 * - @Output: none
 * - Services: UserService, Router, DestroyRef
 * - Lifecycle: ngOnInit → useEffect
 * - Uses reactive forms → React controlled inputs
 * - Uses Angular signals → React useState
 */

interface User {
  image?: string;
  username: string;
  bio?: string;
  email: string;
}

interface Errors {
  errors: Record<string, string[]>;
}

interface SettingsComponentProps {
  /** Get the current user synchronously */
  getCurrentUser: () => User | null;
  /** Update user profile */
  updateUser: (formData: Partial<User & { password: string }>) => Promise<{ user: User }>;
  /** Logout the user */
  onLogout: () => void;
  /** Navigate to user profile after save */
  onNavigateToProfile: (username: string) => void;
}

/** TODO: Wire up to actual ListErrors component */
const ListErrors: React.FC<{ errors: Errors | null }> = ({ errors }) => {
  if (!errors) return null;
  return (
    <ul className="error-messages">
      {Object.entries(errors.errors).map(([field, messages]) =>
        messages.map((msg, i) => (
          <li key={`${field}-${i}`}>
            {field} {msg}
          </li>
        ))
      )}
    </ul>
  );
};

export const SettingsComponent: React.FC<SettingsComponentProps> = ({
  getCurrentUser,
  updateUser,
  onLogout,
  onNavigateToProfile,
}) => {
  const [image, setImage] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Replaces ngOnInit — patch form with current user data
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setImage(user.image ?? '');
      setUsername(user.username ?? '');
      setBio(user.bio ?? '');
      setEmail(user.email ?? '');
    }
  }, [getCurrentUser]);

  // Replaces submitForm()
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    updateUser({ image, username, bio, email, password })
      .then(({ user }) => {
        onNavigateToProfile(user.username);
      })
      .catch((err: Errors) => {
        setErrors(err);
        setIsSubmitting(false);
      });
  };

  return (
    <div className="settings-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Your Settings</h1>

            <ListErrors errors={errors} />

            <form onSubmit={handleSubmit}>
              <fieldset disabled={isSubmitting}>
                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="URL of profile picture"
                    name="image"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="text"
                    placeholder="Username"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <textarea
                    className="form-control form-control-lg"
                    rows={8}
                    placeholder="Short bio about you"
                    name="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="email"
                    placeholder="Email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="password"
                    placeholder="New Password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </fieldset>

                <button
                  className="btn btn-lg btn-primary pull-xs-right"
                  type="submit"
                >
                  Update Settings
                </button>
              </fieldset>
            </form>

            <hr />

            <button
              className="btn btn-outline-danger"
              onClick={onLogout}
            >
              Or click here to logout.
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
