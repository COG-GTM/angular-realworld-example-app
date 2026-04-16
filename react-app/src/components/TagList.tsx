import { Link } from 'react-router-dom';

interface Props {
  tags: string[];
}

function TagList({ tags }: Props) {
  return (
    <div className="tag-list">
      {tags.map((tag) => (
        <Link key={tag} to={`/tag/${tag}`} className="tag-default tag-pill">
          {tag}
        </Link>
      ))}
    </div>
  );
}

export default TagList;
