import { useState, useEffect } from 'react';
import { useParams, Link, NavLink, Outlet } from 'react-router-dom';
import { useUser } from '../../../../core/auth/services/user.service';
import type { Profile } from '../../models/profile.model';
import { ProfileService } from '../../services/profile.service';
import { FollowButton } from '../../components/FollowButton';
import { ListErrors } from '../../../../shared/components/ListErrors';
import type { Errors } from '../../../../core/models/errors.model';
import { defaultImage } from '../../../../shared/pipes/default-image';

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { currentUser } = useUser();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isUser, setIsUser] = useState(false);
  const [errors, setErrors] = useState<Errors | null>(null);

  useEffect(() => {
    if (!username) return;

    ProfileService.get(username)
      .then((p) => {
        setProfile(p);
        setIsUser(p.username === currentUser?.username);
      })
      .catch((error) => {
        setErrors(error.errors ? error : { errors: { error: 'Failed to load profile' } });
      });
  }, [username, currentUser]);

  const onToggleFollowing = (p: Profile) => {
    setProfile(p);
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
                      <NavLink
                        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                        to={`/profile/${profile.username}`}
                        end
                      >
                        My Posts
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink
                        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                        to={`/profile/${profile.username}/favorites`}
                        end
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
