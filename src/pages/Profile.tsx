import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfile } from '../api';
import { FollowButton, ArticleList, ListErrors } from '../components';
import { defaultImage } from '../utils';
import type { Profile as ProfileType, Errors, ArticleListConfig } from '../types';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const location = useLocation();
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [errors, setErrors] = useState<Errors | null>(null);

  const isFavorites = location.pathname.endsWith('/favorites');
  const isCurrentUser = user?.username === profile?.username;

  useEffect(() => {
    if (!username) return;

    getProfile(username)
      .then(setProfile)
      .catch(err => {
        setErrors(err.errors || { error: ['Failed to load profile'] });
      });
  }, [username]);

  const articlesConfig: ArticleListConfig | null = useMemo(() => {
    if (!profile) return null;
    if (isFavorites) {
      return { type: 'all', filters: { favorited: profile.username } };
    }
    return { type: 'all', filters: { author: profile.username } };
  }, [profile, isFavorites]);

  const handleToggleFollowing = (updatedProfile: ProfileType) => {
    setProfile(updatedProfile);
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
                  {!isCurrentUser && <FollowButton profile={profile} onToggle={handleToggleFollowing} />}
                  {isCurrentUser && (
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

                {articlesConfig && <ArticleList config={articlesConfig} limit={10} />}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
