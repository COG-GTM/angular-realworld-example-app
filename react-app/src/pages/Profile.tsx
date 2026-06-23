import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { Errors, Profile as ProfileModel } from '../types';
import { profilesApi } from '../api/profiles';
import { useAuth } from '../auth/AuthContext';
import { FollowButton } from '../components/FollowButton';
import { ListErrors } from '../components/ListErrors';
import { defaultImage } from '../utils/format';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState<ProfileModel | null>(null);
  const [isUser, setIsUser] = useState(false);
  const [errors, setErrors] = useState<Errors | null>(null);

  useEffect(() => {
    if (!username) {
      return;
    }
    profilesApi.get(username).then(
      loaded => {
        setProfile(loaded);
        setIsUser(loaded.username === currentUser?.username);
      },
      err => setErrors(err.errors || { error: ['Failed to load profile'] }),
    );
  }, [username, currentUser]);

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
                  <img src={defaultImage(profile.image)} className="user-img" alt="" />
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
                      <NavLink className="nav-link" to={`/profile/${profile.username}`} end>
                        My Posts
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink className="nav-link" to={`/profile/${profile.username}/favorites`} end>
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
