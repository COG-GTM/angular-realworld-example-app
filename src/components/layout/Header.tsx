import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { defaultImage } from '../../utils/defaultImage';

const navLinkClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'nav-link active' : 'nav-link');

export function Header() {
  const { authState, user } = useAuth();

  return (
    <nav className="navbar navbar-light">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <img src="assets/conduit-logo.svg" alt="Conduit" className="navbar-logo" />
        </Link>

        {authState === 'unauthenticated' && (
          <ul className="nav navbar-nav pull-xs-right">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/login">
                Sign in
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link nav-signup${isActive ? ' active' : ''}`} to="/register">
                Sign up
              </NavLink>
            </li>
          </ul>
        )}

        {authState === 'authenticated' && (
          <ul className="nav navbar-nav pull-xs-right">
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/" end>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/editor">
                <i className="ion-compose"></i>&nbsp;New Article
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/settings">
                <i className="ion-gear-a"></i>&nbsp;Settings
              </NavLink>
            </li>
            {user && (
              <li className="nav-item">
                <NavLink className={navLinkClass} to={`/profile/${user.username}`}>
                  <img src={defaultImage(user.image)} className="user-pic" alt={user.username} />
                  {user.username}
                </NavLink>
              </li>
            )}
          </ul>
        )}

        {authState === 'unavailable' && (
          <ul className="nav navbar-nav pull-xs-right">
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/" end>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/editor">
                <i className="ion-compose"></i>&nbsp;New Article
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/settings">
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
              <Link className="nav-link" to="/">
                Home
              </Link>
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
