import { Link } from "react-router-dom";
import "./Landing.css";

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing__hero">
        <h1 className="landing__headline">
          <span className="landing__headline-accent">Quality</span> ensures
          your future
        </h1>
        <p className="landing__tagline">
          See what matters, fix what counts, and ship work you're proud of —
          before anyone else notices.
        </p>
        <hr className="landing__hero-rule" aria-hidden="true" />
      </header>

      <section className="landing__benefits" aria-label="Benefits">
        <div className="landing__benefits-inner">
          <article className="landing__benefit">
            <h2 className="landing__benefit-title">See problems first</h2>
            <p className="landing__benefit-text">
              Catch quality gaps before they reach your audience. Real clarity,
              not dashboards full of noise.
            </p>
          </article>
          <article className="landing__benefit">
            <h2 className="landing__benefit-title">Ship with confidence</h2>
            <p className="landing__benefit-text">
              Know exactly where to improve so you move faster without cutting
              corners.
            </p>
          </article>
          <article className="landing__benefit">
            <h2 className="landing__benefit-title">Prove your impact</h2>
            <p className="landing__benefit-text">
              Turn quality into a measurable advantage. Show stakeholders the
              value of getting it right.
            </p>
          </article>
        </div>
      </section>

      <section className="landing__cta" aria-label="Get started">
        <h2 className="landing__cta-heading">Let's check it</h2>
        <p className="landing__cta-sub">
          Join creative teams who refuse to compromise on quality.
        </p>
        <div className="landing__cta-actions">
          <Link to="/signup" className="landing__btn landing__btn--primary">
            Sign up
          </Link>
          <Link to="/login" className="landing__btn landing__btn--secondary">
            Sign in
          </Link>
        </div>
      </section>
    </div>
  );
}
