import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { FollowButton } from '../components/FollowButton';
import { ListErrors } from '../shared/ListErrors';
import { defaultImage } from '../shared/defaultImage';
import { profileService } from '../services/profile';
import { useAuth } from '../auth/AuthContext';
import type { Profile as ProfileModel } from '../types/profile';
import type { Errors } from '../types/errors';

const tabClass = ({ isActive }: { isActive: boolean }) => 'nav-link' + (isActive ? ' active' : '');

export default function Profile() {
  const { username = '' } = useParams();
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState<ProfileModel | null>(null);
  const [errors, setErrors] = useState<Errors | null>(null);

  useEffect(() => {
    let cancelled = false;
    setProfile(null);
    setErrors(null);
    profileService
      .get(username)
      .then(loadedProfile => {
        if (!cancelled) setProfile(loadedProfile);
      })
      .catch((err: Errors) => {
        if (!cancelled) setErrors(err.errors ? err : { errors: { error: ['Failed to load profile'] } });
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  const isUser = !!profile && profile.username === currentUser?.username;

  const onToggleFollowing = (updated: ProfileModel) => {
    setProfile(updated);
  };

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
                  {!isUser && <FollowButton profile={profile} onToggle={onToggleFollowing} />}
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
                      <NavLink className={tabClass} end to={`/profile/${profile.username}`}>
                        My Posts
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink className={tabClass} end to={`/profile/${profile.username}/favorites`}>
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
