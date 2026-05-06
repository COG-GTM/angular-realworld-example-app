import { Link, NavLink } from 'react-router-dom';
import { useUser } from '../auth/services/user.service';
import { defaultImage } from '../../shared/pipes/default-image';

export function Header() {
  const { currentUser, authState } = useUser();

  return (
    <nav className="navbar navbar-light">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <img src="/assets/conduit-logo.svg" alt="Conduit" className="navbar-logo" />
        </Link>

        {authState === 'unauthenticated' && (
          <ul className="nav navbar-nav pull-xs-right">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">
                {' '}Home{' '}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/login">
                {' '}Sign in{' '}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link nav-signup${isActive ? ' active' : ''}`} to="/register">
                {' '}Sign up{' '}
              </NavLink>
            </li>
          </ul>
        )}

        {authState === 'authenticated' && (
          <ul className="nav navbar-nav pull-xs-right">
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/" end>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/editor">
                <i className="ion-compose"></i>&nbsp;New Article
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/settings">
                <i className="ion-gear-a"></i>&nbsp;Settings
              </NavLink>
            </li>
            {currentUser && (
              <li className="nav-item">
                <NavLink
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  to={`/profile/${currentUser.username}`}
                >
                  <img src={defaultImage(currentUser.image)} className="user-pic" />
                  {currentUser.username}
                </NavLink>
              </li>
            )}
          </ul>
        )}

        {authState === 'unavailable' && (
          <ul className="nav navbar-nav pull-xs-right">
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/" end>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/editor">
                <i className="ion-compose"></i>&nbsp;New Article
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/settings">
                <i className="ion-gear-a"></i>&nbsp;Settings
              </NavLink>
            </li>
            <li className="nav-item">
              <span className="nav-link" title="Auth unavailable - retrying automatically">
                <i className="ion-load-c"></i>&nbsp;Connecting...
              </span>
            </li>
          </ul>
        )}

        {authState === 'loading' && (
          <ul className="nav navbar-nav pull-xs-right">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">
                {' '}Home{' '}
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
