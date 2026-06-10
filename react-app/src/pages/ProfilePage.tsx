import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import type { Errors, Profile } from '../types';
import { useAuth } from '../hooks/useAuth';
import { getProfile } from '../api/profiles';
import { FollowButton } from '../components/FollowButton';
import { ListErrors } from '../components/ListErrors';
import { defaultImage } from '../utils/defaultImage';

/**
 * Replaces the Angular `ProfileComponent`. Renders the profile header and the
 * tabbed `<Outlet />` for "My Posts" / "Favorited Posts".
 */
export function ProfilePage() {
  const { username = '' } = useParams();
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isUser, setIsUser] = useState(false);
  const [errors, setErrors] = useState<Errors | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getProfile(username, controller.signal)
      .then(loaded => {
        setProfile(loaded);
        setIsUser(loaded.username === currentUser?.username);
      })
      .catch(err => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setErrors((err as Errors).errors ? (err as Errors) : { errors: { error: ['Failed to load profile'] } });
      });
    return () => controller.abort();
  }, [username, currentUser]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'nav-link active' : 'nav-link');

  return (
    <div className="profile-page">
      {errors && (
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-md-10 offset-md-1">
              <ListErrors errors={errors} />
            </div>
          </div>
        </div>
      )}

      {profile && (
        <>
          <div className="user-info">
            <div className="container">
              <div className="row">
                <div className="col-xs-12 col-md-10 offset-md-1">
                  <img src={defaultImage(profile.image)} className="user-img" alt={profile.username} />
                  <h4>{profile.username}</h4>
                  <p>{profile.bio ?? ''}</p>
                  {!isUser && <FollowButton profile={profile} onToggle={setProfile} />}
                  {isUser && (
                    <Link to="/settings" className="btn btn-sm btn-outline-secondary action-btn">
                      <i className="ion-gear-a"></i> Edit Profile Settings
                    </Link>
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
                      <NavLink className={navLinkClass} end to={`/profile/${profile.username}`}>
                        My Posts
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink className={navLinkClass} end to={`/profile/${profile.username}/favorites`}>
                        Favorited Posts
                      </NavLink>
                    </li>
                  </ul>
                </div>

                <Outlet />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
