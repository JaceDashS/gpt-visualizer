import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './FloatingNav.module.css';

interface FloatingNavProps {
  onToggleAbout: () => void;
  onNavigate: () => void;
}

// 우측 하단 텍스트 네비게이션: Home | How it works | About
// 어떤 스타일을 적용할지 결정하는 로직
const FloatingNav: React.FC<FloatingNavProps> = ({ onToggleAbout, onNavigate }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={styles.container} aria-label="Quick navigation">
      <Link
        className={`${styles.link} ${isActive('/') ? styles.active : ''}`}
        to="/"
        onClick={onNavigate}
      >
        Home
      </Link>
      <span className={styles.separator}>|</span>
      <Link
        className={`${styles.link} ${isActive('/how-it-works') ? styles.active : ''}`}
        to="/how-it-works"
        onClick={onNavigate}
      >
        How it works
      </Link>
      <span className={styles.separator}>|</span>
      <button
        type="button"
        className={styles.linkButton}
        onClick={onToggleAbout}
      >
        About
      </button>
    </nav>
  );
};

export default FloatingNav;

