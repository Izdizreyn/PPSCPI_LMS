import "./PageBackground.css";

export default function PageBackground({ variant = "waves", children }) {
  return (
    <div className={`page-bg page-bg-${variant}`}>
      <svg className="page-bg-lines" viewBox="0 0 1060 700" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        {variant === "waves" && (
          <>
            <path d="M0,520 C220,460 340,600 560,520 C760,450 860,560 1060,470" className="line line-1" />
            <path d="M120,600 C320,500 420,620 620,500 C820,400 940,540 1060,380" className="line line-2" />
            <path d="M300,600 C480,520 560,600 720,520 C880,440 960,500 1060,430" className="line line-3" />
            <path d="M700,600 C820,500 900,560 1060,420" className="line line-4" />
          </>
        )}

        {variant === "diagonal" && (
          <>
            <line x1="-100" y1="0" x2="700" y2="700" className="line line-1" />
            <line x1="0" y1="-100" x2="900" y2="700" className="line line-2" />
            <line x1="200" y1="-100" x2="1160" y2="700" className="line line-3" />
            <line x1="450" y1="-100" x2="1300" y2="600" className="line line-4" />
            <line x1="-150" y1="250" x2="500" y2="900" className="line line-2" />
          </>
        )}

        {variant === "orbit" && (
          <>
            <circle cx="850" cy="150" r="120" className="line line-1" />
            <circle cx="850" cy="150" r="200" className="line line-2" />
            <circle cx="850" cy="150" r="280" className="line line-3" />
            <circle cx="150" cy="600" r="140" className="line line-3" />
            <circle cx="150" cy="600" r="220" className="line line-4" />
          </>
        )}

        {variant === "grid" && (
          <>
            <path d="M0,80 C260,20 500,140 760,60 C900,20 1000,80 1060,40" className="line line-1" />
            <path d="M0,220 C260,160 500,280 760,200 C900,160 1000,220 1060,180" className="line line-2" />
            <path d="M0,600 L1060,520" className="line line-3" />
            <path d="M0,680 L1060,600" className="line line-4" />
            <path d="M120,0 L60,700" className="line line-2" />
            <path d="M960,0 L1020,700" className="line line-3" />
          </>
        )}
      </svg>

      <div className="page-bg-content">{children}</div>
    </div>
  );
}