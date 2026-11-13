import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import './Login.css';

interface LoginProps {
  onAuthenticated: () => void;
}

export function Login({ onAuthenticated }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  const isSignup = mode === 'signup';

  // Star animation
  useEffect(() => {
    const canvas = document.getElementById('stars') as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stars: { x: number; y: number; r: number; p: number; s: number; c: string }[] = [];
    let width = 0;
    let height = 0;
    let animationId = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars = Array.from({ length: Math.round((width * height) / 14000) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.1 + 0.25,
        p: Math.random() * 6.28,
        s: Math.random() * 0.0012 + 0.0004,
        c: Math.random() < 0.2 ? '170,220,255' : '235,240,255',
      }));
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const star of stars) {
        const alpha = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(time * star.s * 6 + star.p));
        ctx.fillStyle = `rgba(${star.c},${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, 6.283);
        ctx.fill();
      }
      if (!reducedMotion) animationId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    if (!reducedMotion) animationId = requestAnimationFrame(draw);
    else draw(0);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Authentication state changes are handled by App.tsx's Supabase listener.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNote('');

    if (!password || password.length < 6) {
      setNote('Password must contain at least 6 characters.');
      return;
    }
    if (isSignup && !username.trim()) {
      setNote('Enter a username.');
      return;
    }
    if (!email.trim()) {
      setNote('Enter your email address.');
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { username: username.trim() },
          },
        });
        if (error) throw error;

        if (data.session) {
          onAuthenticated();
        } else {
          setNote('Account created! Please check your email to verify your account.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        onAuthenticated();
      }
    } catch (error) {
      setNote(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setNote('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (error) {
      setNote(error instanceof Error ? error.message : 'Google login failed.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="scene" aria-hidden="true">
        <div className="fill" />
        <div className="hero" id="hero"><i /></div>
        <canvas id="stars" />
        <div className="shade" />
      </div>

      <main className="stage">
        <header className="title">
          <small>Space health monitoring</small>
          <h1>WELCOME TO AITHER KAIROS</h1>
        </header>

        <section className="panel" data-mode={mode}>
          <div className="head">
            <h2>{isSignup ? 'Create your account' : 'Welcome back'}</h2>
            <p className="sub">
              {isSignup ? 'Begin your journey with Aither Kairos.' : 'Continue your journey with Aither Kairos.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <input
                id="user"
                type={isSignup ? 'text' : 'email'}
                name={isSignup ? 'username' : 'email'}
                placeholder=" "
                autoComplete={isSignup ? 'username' : 'email'}
                required
                value={isSignup ? username : email}
                onChange={(e) => isSignup ? setUsername(e.target.value) : setEmail(e.target.value)}
              />
              <label htmlFor="user">{isSignup ? 'Username' : 'Email'}</label>
            </div>

            {isSignup && (
              <div className="extra">
                <div className="field">
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder=" "
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <label htmlFor="email">Email</label>
                </div>
              </div>
            )}

            <div className="field">
              <input
                id="pw"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder=" "
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label htmlFor="pw">Password</label>
              <button
                type="button"
                className="eye"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <button className={`btn primary ${loading ? 'loading' : ''}`} type="submit" disabled={loading}>
              <span className="spin" />
              <span className="txt">
                {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Log in'}
              </span>
            </button>
          </form>

          <div className="or">OR</div>
          <button className="btn ghost" type="button" onClick={handleGoogleLogin} disabled={loading}>
            Continue with Google
          </button>

          <div className="foot">
            <span>{isSignup ? 'Already have an account?' : 'Don’t have an account?'}</span>{' '}
            <button
              className="link"
              type="button"
              onClick={() => {
                setMode(isSignup ? 'login' : 'signup');
                setUsername('');
                setEmail('');
                setPassword('');
                setNote('');
              }}
            >
              {isSignup ? 'Log in' : 'Sign up'}
            </button>
            <p className="note" role="status" aria-live="polite">{note}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
