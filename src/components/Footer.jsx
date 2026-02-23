import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Subscription failed');
      }
      setStatus('success');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  return (
    <footer className="bg-surface-sunken text-foreground py-20 px-6 md:px-12 border-t border-foreground/5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        {/* Brand */}
        <div className="max-w-sm">
          <h2 className="text-3xl font-serif text-accent mb-4">LUPORA</h2>
          <p className="text-subtle text-sm leading-relaxed uppercase tracking-widest">
            Natural botanicals. Eternal elegance.
          </p>
        </div>

        {/* Newsletter */}
        <div className="flex flex-col gap-4 max-w-xs w-full">
          <p className="text-[10px] tracking-[0.4em] uppercase text-muted">
            Stay in the world of Lupora
          </p>
          {status === 'success' ? (
            <p className="text-accent text-xs tracking-widest uppercase">
              Thank you for subscribing.
            </p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                required
                className="flex-1 bg-transparent border border-foreground/15 text-foreground text-xs px-4 py-2.5 placeholder-faint focus:border-accent focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-5 py-2.5 bg-accent text-black text-[9px] tracking-[0.3em] uppercase font-medium hover:bg-accent-hover transition-all duration-300 disabled:opacity-50"
              >
                {status === 'loading' ? '...' : 'Join'}
              </button>
            </form>
          )}
          {status === 'error' && (
            <p className="text-red-400 text-[10px]">{errorMsg}</p>
          )}
        </div>

        {/* Links */}
        <div className="flex flex-col space-y-4 text-[10px] tracking-widest uppercase text-muted">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/shipping" className="hover:text-foreground transition-colors">Shipping</Link>
          <a
            href="https://www.instagram.com/lupora_perfumes/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent-hover transition-colors"
          >
            @lupora_perfumes
          </a>
        </div>
      </div>
      <div className="mt-20 text-center text-[8px] tracking-[0.5em] text-dim uppercase">
        &copy; 2025 LUPORA PERFUMES
      </div>
    </footer>
  );
}
