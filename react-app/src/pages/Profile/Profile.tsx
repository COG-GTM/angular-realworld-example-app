import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProfile } from '../../services/profile.service';
import { FollowButton } from '../../components/FollowButton/FollowButton';
import { ArticleList } from '../../components/ArticleList/ArticleList';
import { ListErrors } from '../../components/ListErrors/ListErrors';
import { defaultImage } from '../../utils/default-image';
import type { Profile as ProfileType, ArticleListConfig, Errors } from '../../types';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const location = useLocation();
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [errors, setErrors] = useState<Errors | null>(null);

  const isFavorites = location.pathname.endsWith('/favorites');
  const isUser = user?.username === profile?.username;

  useEffect(() => {
    if (!username) return;
    setProfile(null);
    setErrors(null);
    const controller = new AbortController();

    getProfile(username, controller.signal)
      .then(setProfile)
      .catch(err => {
        if (err.name !== 'AbortError') {
          setErrors(err.errors ? err : { errors: { error: 'Failed to load profile' } });
        }
      });

    return () => controller.abort();
  }, [username]);

  const articlesConfig: ArticleListConfig | null = useMemo(() => {
    if (!profile) return null;
    return {
      type: 'all',
      filters: isFavorites ? { favorited: profile.username } : { author: profile.username },
    };
  }, [profile?.username, isFavorites]);

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
                  {!isUser && (
                    <FollowButton profile={profile} onToggle={setProfile} />
                  )}
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
                      <Link
                        className={`nav-link${!isFavorites ? ' active' : ''}`}
                        to={`/profile/${profile.username}`}
                      >
                        My Posts
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        className={`nav-link${isFavorites ? ' active' : ''}`}
                        to={`/profile/${profile.username}/favorites`}
                      >
                        Favorited Posts
                      </Link>
                    </li>
                  </ul>
                </div>

                {articlesConfig && (
                  <ArticleList config={articlesConfig} limit={10} />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
