import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar navbar-light">
      <div className="container">
        <Link className="navbar-brand" to="/">Conduit</Link>
        <ul className="nav navbar-nav pull-xs-right">
          <li className="nav-item">
            <Link className={isActive('/')} to="/">Home</Link>
          </li>
          {isAuthenticated ? (
            <>
              <li className="nav-item">
                <Link className={isActive('/editor')} to="/editor">
                  <i className="ion-compose" />&nbsp;New Article
                </Link>
              </li>
              <li className="nav-item">
                <Link className={isActive('/settings')} to="/settings">
                  <i className="ion-gear-a" />&nbsp;Settings
                </Link>
              </li>
              <li className="nav-item">
                <Link className={isActive(`/profile/${user?.username}`)} to={`/profile/${user?.username}`}>
                  {user?.image && <img src={user.image} className="user-pic" alt={user.username} />}
                  {user?.username}
                </Link>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link className={isActive('/login')} to="/login">Sign in</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link nav-signup" to="/register">Sign up</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Header;
