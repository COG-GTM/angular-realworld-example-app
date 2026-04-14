import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';

/**
 * Mirrors the Angular Errors model from core/models/errors.model.ts
 */
interface Errors {
  errors: { [key: string]: string };
}

/**
 * Mirrors the Angular User model from core/auth/user.model.ts
 */
interface User {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

/**
 * Shape of the settings form state.
 * Mirrors the Angular SettingsForm interface (FormControl<string> fields).
 */
interface SettingsFormState {
  image: string;
  username: string;
  bio: string;
  email: string;
  password: string;
}

/**
 * Props for the ListErrors helper component.
 * Replaces Angular's <app-list-errors [errors]="errors()"> binding.
 */
interface ListErrorsProps {
  errors: Errors | null;
}

/**
 * Inline error list component matching the Angular ListErrorsComponent behavior.
 * Converts the Errors object into a flat list of "key value" strings.
 *
 * TODO: Replace with the shared React ListErrors component once it is migrated.
 */
function ListErrors({ errors }: ListErrorsProps) {
  if (!errors) {
    return null;
  }

  const errorList = Object.keys(errors.errors || {}).map(key => `${key} ${errors.errors[key]}`);

  if (errorList.length === 0) {
    return null;
  }

  return (
    <ul className="error-messages">
      {errorList.map(message => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  );
}

/**
 * Dependencies that must be supplied by the consuming application.
 *
 * In the Angular version these were injected via the constructor (UserService, Router).
 * In React they should eventually come from context providers or hooks.
 *
 * TODO: Replace this props-based dependency injection with React context/hooks
 *       once UserService and Router are migrated to React equivalents.
 */
interface SettingsComponentDeps {
  /** Returns the currently authenticated user, or null. Replaces UserService.getCurrentUserSync(). */
  getCurrentUser: () => User | null;
  /** Calls the update API. Replaces UserService.update(). Returns a promise resolving to { user: User }. */
  updateUser: (user: Partial<User>) => Promise<{ user: User }>;
  /** Logs the user out. Replaces UserService.logout(). */
  logout: () => void;
  /** Navigates to a path. Replaces Router.navigate(). */
  navigateTo: (path: string) => void;
}

/**
 * React version of the Angular SettingsComponent.
 *
 * Migrated from:
 *   - src/app/features/settings/settings.component.ts  (logic)
 *   - src/app/features/settings/settings.component.html (template)
 *
 * The component manages a settings form for the current user's profile,
 * including image, username, bio, email, and password fields.
 *
 * TODO: Wire up real implementations for getCurrentUser, updateUser, logout, and navigateTo
 *       via React context or a custom hook (e.g. useUserService, useRouter).
 */
export const SettingsComponent = ({ getCurrentUser, updateUser, logout, navigateTo }: SettingsComponentDeps) => {
  // --- State (replaces Angular signals and FormGroup) ---

  const [formState, setFormState] = useState<SettingsFormState>({
    image: '',
    username: '',
    bio: '',
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Errors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Lifecycle: ngOnInit equivalent ---
  // Load the current user on mount and populate the form.
  // Uses a ref guard to ensure this runs exactly once, mirroring Angular's ngOnInit.

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;

    const user = getCurrentUser();
    if (user) {
      setFormState(prev => ({
        ...prev,
        image: user.image ?? '',
        username: user.username,
        bio: user.bio ?? '',
        email: user.email,
        // password is intentionally left blank (same as Angular patchValue behavior)
      }));
    }
  }, [getCurrentUser]);

  // --- Handlers ---

  /**
   * Generic change handler for all text/email/password inputs and textarea.
   * Replaces Angular reactive form's formControlName two-way binding.
   */
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Form submission handler.
   * Replaces Angular's (ngSubmit)="submitForm()" and the submitForm() method.
   *
   * Mirrors the original behavior:
   * 1. Set isSubmitting to true
   * 2. Call userService.update() with form values
   * 3. On success: navigate to the user's profile page
   * 4. On error: set errors and reset isSubmitting
   */
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { user } = await updateUser(formState);
      // TODO: Replace with React Router navigation (e.g. navigate(`/profile/${user.username}`))
      navigateTo(`/profile/${user.username}`);
    } catch (err: unknown) {
      setErrors(err as Errors);
      setIsSubmitting(false);
    }
  };

  /**
   * Logout handler.
   * Replaces Angular's (click)="logout()" binding.
   */
  const handleLogout = () => {
    // TODO: Replace with React context-based logout once UserService is migrated
    logout();
  };

  // --- Template (converted from settings.component.html) ---

  return (
    <div className="settings-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Your Settings</h1>

            <ListErrors errors={errors} />

            <form onSubmit={onSubmit}>
              <fieldset disabled={isSubmitting}>
                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="URL of profile picture"
                    name="image"
                    value={formState.image}
                    onChange={handleChange}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="text"
                    placeholder="Username"
                    name="username"
                    value={formState.username}
                    onChange={handleChange}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <textarea
                    className="form-control form-control-lg"
                    rows={8}
                    placeholder="Short bio about you"
                    name="bio"
                    value={formState.bio}
                    onChange={handleChange}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="email"
                    placeholder="Email"
                    name="email"
                    value={formState.email}
                    onChange={handleChange}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="password"
                    placeholder="New Password"
                    name="password"
                    value={formState.password}
                    onChange={handleChange}
                  />
                </fieldset>

                <button className="btn btn-lg btn-primary pull-xs-right" type="submit">
                  Update Settings
                </button>
              </fieldset>
            </form>

            {/* Line break for logout button */}
            <hr />

            <button className="btn btn-outline-danger" onClick={handleLogout}>
              Or click here to logout.
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
