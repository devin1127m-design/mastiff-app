import Link from "next/link";

// The public site's frame. Phone-first: wordmark, Sign in, one button. Everything else in the footer.
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <header className="site-head">
        <div className="wrap row-between">
          <Link href="/" className="wordmark">Mastiff</Link>
          <nav className="site-nav">
            <Link href="/how-it-works" className="hide-sm">How it works</Link>
            <Link href="/pilot" className="hide-sm">The pilot</Link>
            <Link href="/about" className="hide-sm">About</Link>
            <Link href="/login" className="btn">Sign in</Link>
            <Link href="/pilot" className="btn fill">Start free</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-foot">
        <div className="wrap">
          <p className="serif text-lg">Mastiff flags. Your firm makes every payment decision.</p>
          <nav className="foot-nav">
            <Link href="/how-it-works">How it works</Link>
            <Link href="/pilot">The pilot</Link>
            <Link href="/about">About</Link>
            <Link href="/legal">Privacy and terms</Link>
            <Link href="/login">Sign in</Link>
          </nav>
          <p className="grey text-sm">Mastiff · Oxford, Michigan · Statistics link to their sources.</p>
        </div>
      </footer>
    </div>
  );
}
