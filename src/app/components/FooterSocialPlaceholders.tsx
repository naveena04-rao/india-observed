export function FooterSocialPlaceholders() {
  return (
    <div
      className="footer-social-placeholders"
      aria-label="Planned social channels: Instagram, YouTube and X"
    >
      <span className="footer-social-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle className="footer-social-dot" cx="17.5" cy="6.5" r="1" />
        </svg>
        <span className="sr-only">Instagram</span>
      </span>
      <span className="footer-social-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="2.5" y="5" width="19" height="14" rx="4" />
          <path className="footer-social-fill" d="M10 9l5 3-5 3z" />
        </svg>
        <span className="sr-only">YouTube</span>
      </span>
      <span className="footer-social-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4 3l16 18M20 3L4 21" />
        </svg>
        <span className="sr-only">X</span>
      </span>
    </div>
  );
}
