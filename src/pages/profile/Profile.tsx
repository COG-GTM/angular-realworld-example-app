import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profiles';
import { FollowButton } from '../../components/profile/FollowButton';
import { ListErrors } from '../../components/ListErrors';
import { defaultImage } from '../../utils/defaultImage';
import type { Errors, Profile as ProfileModel } from '../../types';

const tabClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'nav-link active' : 'nav-link');

export function Profile() {
  const { username = '' } = useParams();
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileModel | null>(null);
  const [errors, setErrors] = useState<Errors | null>(null);

  useEffect(() => {
    let cancelled = false;
    setProfile(null);
    setErrors(null);
    profileService
      .get(username)
      .then(result => {
        if (!cancelled) setProfile(result);
      })
      .catch((err: Errors) => {
        if (!cancelled) setErrors(err?.errors ? err : { errors: { error: ['Failed to load profile'] } });
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  const isUser = !!profile && !!user && profile.username === user.username;

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
                      <NavLink className={tabClass} to={`/profile/${profile.username}`} end>
                        My Posts
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink className={tabClass} to={`/profile/${profile.username}/favorites`} end>
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
