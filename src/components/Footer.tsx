import { Link } from 'react-router-dom';
import { formatDate } from '../utils/format';

export function Footer() {
  const today = Date.now();
  return (
    <footer>
      <div className="container">
        <Link className="logo-font" to="/">
          <img src="assets/conduit-logo.svg" alt="Conduit" className="footer-logo" />
        </Link>
        <span className="attribution">
          &copy; {formatDate(today, 'yyyy')}. An interactive learning project from{' '}
          <a href="https://github.com/gothinkster/realworld">RealWorld OSS Project</a>. Code licensed under MIT.
        </span>
      </div>
    </footer>
  );
}
