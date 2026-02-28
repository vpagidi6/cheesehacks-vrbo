type HeaderProps = {
  subtitle?: string;
};

export default function Header({ subtitle = "Data-driven view of AI water impact" }: HeaderProps) {
  return (
    <header className="header" aria-label="Eco AI Tracker header">
      <div className="brand-row">
        <span className="brand-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" role="img">
            <path
              d="M12 2.5C10.9 4.4 6 9 6 13.2C6 16.7 8.8 19.5 12.3 19.5C15.8 19.5 18.6 16.7 18.6 13.2C18.6 9 13.6 4.4 12.5 2.5C12.4 2.3 12.1 2.3 12 2.5Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h1>Eco AI Tracker</h1>
      </div>
      <p>{subtitle}</p>
    </header>
  );
}
