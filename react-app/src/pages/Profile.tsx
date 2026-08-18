import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { FollowButton } from '../components/FollowButton';
import { ListErrors } from '../components/ListErrors';
import { useAuth } from '../context/AuthContext';
import { profilesApi } from '../services/api';
import { defaultImage } from '../utils/format';
import type { ApiError } from '../services/api';
import type { Errors, Profile as ProfileModel } from '../models';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<ProfileModel | null>(null);
  const [errors, setErrors] = useState<Errors | null>(null);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;

    setProfile(null);
    setErrors(null);

    profilesApi
      .get(username)
      .then(loaded => {
        if (!cancelled) setProfile(loaded);
      })
      .catch((error: ApiError) => {
        // Mirrors the Angular component, which stores the inner error map in this signal.
        if (!cancelled) {
          setErrors((error.errors as unknown as Errors | undefined) ?? { errors: { error: 'Failed to load profile' } });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  const isUser = profile !== null && profile.username === currentUser?.username;

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
                  <img src={defaultImage(profile.image)} className="user-img" />
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
                      <NavLink
                        className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                        end
                        to={`/profile/${profile.username}`}
                      >
                        My Posts
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink
                        className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                        end
                        to={`/profile/${profile.username}/favorites`}
                      >
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
