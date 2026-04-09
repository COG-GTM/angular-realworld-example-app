import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Article } from "../../models/article.model";
import { ArticlesService } from "../../services/articles.service";
import { useAuth } from "../../context/AuthContext";

interface FavoriteButtonProps {
  article: Article;
  onToggle?: (article: Article) => void;
  children?: React.ReactNode;
  className?: string;
}

export function FavoriteButton({
  article,
  onToggle,
  children,
  className = "",
}: FavoriteButtonProps) {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleClick = async () => {
    if (authState !== "authenticated") {
      navigate("/login");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const updated = article.favorited
        ? await ArticlesService.unfavorite(article.slug)
        : await ArticlesService.favorite(article.slug);
      onToggle?.(updated);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      className={`btn btn-sm ${article.favorited ? "btn-primary" : "btn-outline-primary"} ${className}`}
      onClick={handleClick}
      disabled={submitting}
    >
      <i className="ion-heart"></i>
      {children}
    </button>
  );
}
