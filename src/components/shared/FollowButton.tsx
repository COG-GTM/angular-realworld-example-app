import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Profile } from "../../models/profile.model";
import { ProfileService } from "../../services/profile.service";
import { useAuth } from "../../context/AuthContext";

interface FollowButtonProps {
  profile: Profile;
  onToggle?: (profile: Profile) => void;
}

export function FollowButton({ profile, onToggle }: FollowButtonProps) {
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
      const updated = profile.following
        ? await ProfileService.unfollow(profile.username)
        : await ProfileService.follow(profile.username);
      onToggle?.(updated);
    } catch {
      // Silently handle errors - button stays in current state
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      className={`btn btn-sm action-btn ${profile.following ? "btn-secondary" : "btn-outline-secondary"}`}
      onClick={handleClick}
      disabled={submitting}
    >
      <i className="ion-plus-round"></i>
      &nbsp; {profile.following ? "Unfollow" : "Follow"}{" "}
      {profile.username}
    </button>
  );
}
