import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { FollowButton } from '../components/FollowButton';
import { ListErrors } from '../components/ListErrors';
import { profileService } from '../services/profile';
import { useAuth } from '../context/AuthContext';
import { defaultImage } from '../utils/format';
import type { ApiError } from '../services/api';
import type { Errors, Profile as ProfileType } from '../types';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [errors, setErrors] = useState<Errors | null>(null);

  useEffect(() => {
    if (!username) return;
    const controller = new AbortController();
    setErrors(null);
    profileService
      .get(username, controller.signal)
      .then(setProfile)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const apiErr = err as ApiError;
        setErrors(apiErr.errors ? apiErr : { errors: { error: ['Failed to load profile'] } });
      });
    return () => controller.abort();
  }, [username]);

  const isUser = profile?.username === currentUser?.username;

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
                      <NavLink className="nav-link" end to={`/profile/${profile.username}`}>
                        My Posts
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink className="nav-link" end to={`/profile/${profile.username}/favorites`}>
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
