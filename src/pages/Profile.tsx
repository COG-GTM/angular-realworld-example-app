import { useState, useEffect } from "react";
import { useParams, Link, NavLink, useLocation } from "react-router-dom";
import { Profile as ProfileModel } from "../models/profile.model";
import { ProfileService } from "../services/profile.service";
import { useAuth } from "../context/AuthContext";
import { ArticleList } from "../components/shared/ArticleList";
import { ArticleListConfig } from "../models/article.model";
import { FollowButton } from "../components/shared/FollowButton";

function defaultImage(image: string | null | undefined): string {
  return image || "/realworld/assets/media/default-avatar.svg";
}

export function Profile() {
  const { username } = useParams<{ username: string }>();
  const { currentUser } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState<ProfileModel | null>(null);

  const isFavorites = location.pathname.endsWith("/favorites");
  const isOwnProfile = currentUser?.username === username;

  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!username) return;
    setLoadError(false);
    setProfile(null);
    ProfileService.get(username)
      .then(setProfile)
      .catch(() => setLoadError(true));
  }, [username]);

  if (loadError || !username) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-md-10 offset-md-1">
              <p>{loadError ? "Could not load profile." : "Loading..."}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-md-10 offset-md-1">
              <p>Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const config: ArticleListConfig = isFavorites
    ? { type: "all", filters: { favorited: username } }
    : { type: "all", filters: { author: username } };

  return (
    <div className="profile-page">
      <div className="user-info">
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-md-10 offset-md-1">
              <img
                src={defaultImage(profile.image)}
                className="user-img"
                alt={profile.username}
              />
              <h4>{profile.username}</h4>
              <p>{profile.bio || ""}</p>

              {isOwnProfile ? (
                <Link
                  to="/settings"
                  className="btn btn-sm btn-outline-secondary action-btn"
                >
                  <i className="ion-gear-a"></i> Edit Profile Settings
                </Link>
              ) : (
                <FollowButton profile={profile} onToggle={setProfile} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row">
          <div className="col-xs-12 col-md-10 offset-md-1">
            <div className="articles-toggle">
              <ul className="nav nav-pills outline-active">
                <li className="nav-item">
                  <NavLink
                    className={({ isActive }) =>
                      `nav-link ${isActive && !isFavorites ? "active" : ""}`
                    }
                    to={`/profile/${username}`}
                    end
                  >
                    My Articles
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "active" : ""}`
                    }
                    to={`/profile/${username}/favorites`}
                  >
                    Favorited Articles
                  </NavLink>
                </li>
              </ul>
            </div>

            <ArticleList config={config} />
          </div>
        </div>
      </div>
    </div>
  );
}
