import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { defaultImage } from '../../utils/default-image';

export function Header() {
  const { user, authState } = useAuth();

  return (
    <nav className="navbar navbar-light">
      <div className="container">
        <NavLink className="navbar-brand" to="/">
          <img src="/assets/conduit-logo.svg" alt="Conduit" className="navbar-logo" />
        </NavLink>

        {authState === 'unauthenticated' && (
          <ul className="nav navbar-nav pull-xs-right">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/login">
                Sign in
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link nav-signup" to="/register">
                Sign up
              </NavLink>
            </li>
          </ul>
        )}

        {authState === 'authenticated' && user && (
          <ul className="nav navbar-nav pull-xs-right">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" end>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/editor">
                <i className="ion-compose"></i>&nbsp;New Article
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/settings">
                <i className="ion-gear-a"></i>&nbsp;Settings
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to={`/profile/${user.username}`}>
                <img src={defaultImage(user.image)} className="user-pic" alt={user.username} />
                {user.username}
              </NavLink>
            </li>
          </ul>
        )}

        {authState === 'loading' && (
          <ul className="nav navbar-nav pull-xs-right">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <span className="nav-link">Loading...</span>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}
