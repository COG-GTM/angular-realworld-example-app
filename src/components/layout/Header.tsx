import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const DEFAULT_AVATAR = "/realworld/assets/media/default-avatar.svg";

function userImage(image: string | null | undefined): string {
  return image || DEFAULT_AVATAR;
}

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
                  <img
                    src={userImage(currentUser.image)}
                    className="user-pic"
                    alt={currentUser.username}
                  />
                  {currentUser.username}
                </NavLink>
              </li>
            </>
          )}

          {authState === "unavailable" && (
            <li className="nav-item">
              <span className="nav-link">Connecting...</span>
            </li>
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
