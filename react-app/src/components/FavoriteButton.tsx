import { Article } from '../models/article';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Props {
  article: Article;
  onToggle: (article: Article) => void;
  compact?: boolean;
}

function FavoriteButton({ article, onToggle, compact }: Props) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    onToggle(article);
  };

  const btnClass = article.favorited ? 'btn btn-primary btn-sm' : 'btn btn-outline-primary btn-sm';

  if (compact) {
    return (
      <button className={`${btnClass} pull-xs-right`} onClick={handleClick}>
        <i className="ion-heart" /> {article.favoritesCount}
      </button>
    );
  }

  return (
    <button className={btnClass} onClick={handleClick}>
      <i className="ion-heart" />&nbsp;
      {article.favorited ? 'Unfavorite' : 'Favorite'} Article
      <span className="counter">({article.favoritesCount})</span>
    </button>
  );
}

export default FavoriteButton;
