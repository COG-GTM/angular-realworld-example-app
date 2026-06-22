import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { profileApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { FollowButton } from '../components/FollowButton';
import { ListErrors } from '../components/ListErrors';
import type { ApiError } from '../api/client';
import type { Profile as ProfileType } from '../types';
import { defaultImage } from '../utils/format';

export function Profile() {
  const { username } = useParams();
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [isUser, setIsUser] = useState(false);
  const [errors, setErrors] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!username) return;
    profileApi
      .get(username)
      .then(loadedProfile => {
        setProfile(loadedProfile);
        setIsUser(loadedProfile.username === currentUser?.username);
      })
      .catch((err: ApiError) => {
        setErrors(err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  useEffect(() => {
    setIsUser(!!profile && profile.username === currentUser?.username);
  }, [currentUser, profile]);

  const onToggleFollowing = (updated: ProfileType) => {
    setProfile(updated);
  };

  const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'nav-link active' : 'nav-link');

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
                      <NavLink className={navClass} end to={`/profile/${profile.username}`}>
                        My Posts
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink className={navClass} end to={`/profile/${profile.username}/favorites`}>
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
