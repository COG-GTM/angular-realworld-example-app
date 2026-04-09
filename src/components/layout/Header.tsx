import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function Header() {
  const { currentUser, authState } = useAuth();

  return (
    <nav className="navbar navbar-light">
      <div className="container">
        <Link className="navbar-brand" to="/">
          conduit
        </Link>
        <ul className="nav navbar-nav pull-xs-right">
          <li className="nav-item">
            <NavLink className="nav-link" to="/" end>
              Home
            </NavLink>
          </li>

          {authState === "authenticated" && currentUser && (
            <>
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
                <NavLink
                  className="nav-link"
                  to={`/profile/${currentUser.username}`}
                >
                  {currentUser.image && (
                    <img
                      src={currentUser.image}
                      className="user-pic"
                      alt={currentUser.username}
                    />
                  )}
                  {currentUser.username}
                </NavLink>
              </li>
            </>
          )}

          {authState === "unauthenticated" && (
            <>
              <li className="nav-item">
                <NavLink className="nav-link" to="/login">
                  Sign in
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/register">
                  Sign up
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
