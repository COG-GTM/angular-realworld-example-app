import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { Profile } from '../models/profile';
import { Errors } from '../../../core/models/errors';
import { useUser } from '../../../core/auth/user-context';
import { FollowButton } from '../components/follow-button';
import { ListErrors } from '../../../shared/components/list-errors';
import { defaultImage } from '../../../shared/default-image';
import * as profileService from '../services/profile.service';

export function ProfilePage() {
  const { username = '' } = useParams();
  const { currentUser } = useUser();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [errors, setErrors] = useState<Errors | null>(null);

  useEffect(() => {
    let active = true;
    setErrors(null);
    profileService
      .getProfile(username)
      .then(loaded => {
        if (active) {
          setProfile(loaded);
        }
      })
      .catch((err: Errors) => {
        if (active) {
          setErrors(err?.errors ? err : { errors: { error: ['Failed to load profile'] } });
        }
      });
    return () => {
      active = false;
    };
  }, [username]);

  const isUser = !!profile && profile.username === currentUser?.username;

  const tabClass = ({ isActive }: { isActive: boolean }) => 'nav-link' + (isActive ? ' active' : '');

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
                      <NavLink end className={tabClass} to={`/profile/${profile.username}`}>
                        My Posts
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink end className={tabClass} to={`/profile/${profile.username}/favorites`}>
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

export default ProfilePage;
