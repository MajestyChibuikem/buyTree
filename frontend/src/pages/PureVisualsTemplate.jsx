import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, useScroll, useTransform } from 'framer-motion';
import Lenis from 'lenis';

const brand = 'BUYTREE';

const HERO_LEFT =
  'https://framerusercontent.com/images/47vWLizj8nJWWX1ItmZK8MEspc.png?width=1024&height=1024';
const HERO_RIGHT =
  'https://framerusercontent.com/images/YDcBLDpZXBmQp6m1BDMjM5L5s.png?width=896&height=1280';

// Section 2 images (left / right / large "blown up" image)
const WHO_LEFT =
  'https://framerusercontent.com/images/LpOI2nu5puE541zFY6qCNYUnm4.png?width=896&height=1280';
const WHO_RIGHT =
  'https://framerusercontent.com/images/0qUEzVXR8RJEfI0oag2iWsNiH2A.png?width=904&height=1200';
const WHO_BIG =
  'https://framerusercontent.com/images/tizU5jI420nBgVarza7aTqNZDVc.png?width=1024&height=1024';


function scrollToRef(ref) {
  if (!ref?.current) return;
  ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function PureVisualsTemplate() {
  const navigate = useNavigate();

  const aboutRef = useRef(null);
  const contactRef = useRef(null);
  const heroRef = useRef(null);

  // Lenis smooth scroll — smooths the actual browser scroll position
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // All transforms derive from the smoothed progress — no per-transform springs needed.
  // Panel split
  const leftX = useTransform(heroProgress, [0, 0.55, 1], ['0%', '-120%', '-120%']);
  const rightX = useTransform(heroProgress, [0, 0.55, 1], ['0%', '120%', '120%']);
  const splitOpacity = useTransform(heroProgress, [0, 0.55, 0.8, 1], [1, 1, 0, 0]);

  // BUYTREE teal color fades in as panels split
  const brandColorOpacity = useTransform(heroProgress, [0, 0.25, 0.45, 0.55], [0.15, 0.3, 0.7, 1]);

  // Phase 2: BUYTREE moves to top and scales up
  const brandY = useTransform(heroProgress, [0, 0.35, 0.5, 1], ['0%', '0%', '-120%', '-120%']);
  const brandScale = useTransform(heroProgress, [0, 0.35, 0.5, 1], [1, 1, 1.8, 1.8]);

  // Tagline texts
  const taglineOpacity = useTransform(heroProgress, [0, 0.22, 0.35, 1], [0, 0, 1, 1]);
  const taglineLeftX = useTransform(heroProgress, [0, 0.22, 0.35, 1], ['-60px', '-60px', '0px', '0px']);
  const taglineRightX = useTransform(heroProgress, [0, 0.22, 0.35, 1], ['60px', '60px', '0px', '0px']);

  // Section 2: sticky text + images translating upward.
  const whoRef = useRef(null);
  const { scrollYProgress: whoProgress } = useScroll({
    target: whoRef,
    offset: ['start start', 'end start'],
  });
  const whoImgsY = useTransform(whoProgress, [0, 0.5, 1], ['0%', '-100%', '-100%']);
  const whoImgsScale = useTransform(whoProgress, [0, 1], [1, 1.08]);

  // Section 3: "THE IDEA" + store panels sliding in over it
  const ideaRef = useRef(null);
  const { scrollYProgress: ideaProgress } = useScroll({
    target: ideaRef,
    offset: ['start end', 'end start'],
  });
  const ideaImgY = useTransform(ideaProgress, [0, 1], ['0%', '-15%']);
  const ideaTextOpacity = useTransform(ideaProgress, [0, 0.15, 0.3], [0, 0, 1]);
  const ideaTextY = useTransform(ideaProgress, [0, 0.15, 0.3], ['40px', '40px', '0px']);
  // Store panels slide in mid-scroll, then hold in view before next section
  const storeLeftX = useTransform(ideaProgress, [0.35, 0.55], ['-100%', '0%']);
  const storeRightX = useTransform(ideaProgress, [0.35, 0.55], ['100%', '0%']);

  // Section 5: "THE REACH" — parallax + stats
  const reachRef = useRef(null);
  const { scrollYProgress: reachProgress } = useScroll({
    target: reachRef,
    offset: ['start end', 'end start'],
  });
  const reachImgY = useTransform(reachProgress, [0, 1], ['0%', '-15%']);
  const reachTextOpacity = useTransform(reachProgress, [0, 0.3, 0.5], [0, 0, 1]);

  // Section 6: "YOUR TURN" CTA
  const ctaRef = useRef(null);
  const { scrollYProgress: ctaProgress } = useScroll({
    target: ctaRef,
    offset: ['start end', 'end start'],
  });
  const ctaTextOpacity = useTransform(ctaProgress, [0, 0.25, 0.5], [0, 0, 1]);
  const ctaTextScale = useTransform(ctaProgress, [0, 0.25, 0.5], [0.85, 0.85, 1]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sticky-ish liquid nav */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-xl">
            <div className="absolute inset-0 -z-10 rounded-2xl purevisuals-liquid-bg" />
            <div className="relative flex items-center gap-3">
              <span className="text-sm font-medium tracking-wide text-black/90">
                {brand}
              </span>
            </div>

            <nav className="relative flex items-center gap-6">
              <button
                type="button"
                onClick={() => scrollToRef(aboutRef)}
                className="text-sm font-medium text-black/80 hover:text-black"
              >
                About
              </button>
              <button
                type="button"
                onClick={() => scrollToRef(contactRef)}
                className="text-sm font-medium text-black/80 hover:text-black"
              >
                Contact
              </button>
              <button
                type="button"
                onClick={() => {}}
                className="text-sm font-medium text-black/80 hover:text-black"
              >
                Get Template
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Fixed hero — always behind, never moves */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-[#e4e4e7]">
        {/* Background split panels */}
        <Motion.div
          className="absolute inset-0 flex z-20"
          style={{ opacity: splitOpacity }}
          aria-hidden="true"
        >
          <Motion.div
            className="relative h-full w-1/2 overflow-hidden"
            style={{ x: leftX, willChange: 'transform' }}
          >
            <img
              src={HERO_LEFT}
              alt=""
              className="h-full w-full object-cover"
            />
          </Motion.div>
          <Motion.div
            className="relative h-full w-1/2 overflow-hidden"
            style={{ x: rightX, willChange: 'transform' }}
          >
            <img
              src={HERO_RIGHT}
              alt=""
              className="h-full w-full object-cover"
            />
          </Motion.div>
        </Motion.div>

        {/* Title overlay (truly centered in viewport) */}
        <div className="absolute inset-0 z-10 flex flex-col items-center px-6">
          {/* Brand text — centered, then moves up + scales on scroll */}
          <Motion.div
            className="absolute top-1/2 left-1/2 text-center"
            style={{ y: brandY, scale: brandScale, x: '-50%', translateY: '-50%', transformOrigin: 'center center', willChange: 'transform' }}
          >
            <Motion.div
              className="text-[120px] font-extrabold tracking-widest leading-none sm:text-[160px]"
              style={{ color: '#056363', opacity: brandColorOpacity }}
            >
              {brand}
            </Motion.div>
          </Motion.div>

          {/* Tagline — appears after BUYTREE moves up */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 px-8">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-6">
              <Motion.div
                className="text-[28px] font-light italic leading-tight text-black sm:text-[36px]"
                style={{ opacity: taglineOpacity, x: taglineLeftX }}
              >
                Grow Your Brand<br />With A
              </Motion.div>
              <Motion.div
                className="text-right text-[28px] font-light italic leading-tight text-black sm:text-[36px]"
                style={{ opacity: taglineOpacity, x: taglineRightX }}
              >
                Store Built<br />For You
              </Motion.div>
            </div>
          </div>

          {/* Scrolling brand logos — fades at edges, infinite seamless loop */}
          <div className="absolute bottom-10 left-0 right-0">
            <div className="purevisuals-marquee-mask overflow-hidden pt-6">
              <div className="purevisuals-marquee-track flex items-center gap-20">
                {/* First set — enough logos to fill full screen width */}
                {Array.from({ length: 10 }).map((_, i) => (
                  <img
                    key={`a-${i}`}
                    src={i % 2 === 0 ? '/logo-black.png' : '/pokas-logo.jpg'}
                    alt=""
                    className="h-[84px] w-auto shrink-0 opacity-60"
                    aria-hidden="true"
                  />
                ))}
                {/* Identical duplicate for seamless loop */}
                {Array.from({ length: 10 }).map((_, i) => (
                  <img
                    key={`b-${i}`}
                    src={i % 2 === 0 ? '/logo-black.png' : '/pokas-logo.jpg'}
                    alt=""
                    className="h-[84px] w-auto shrink-0 opacity-60"
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invisible spacer — gives scroll room for hero animations */}
      <div ref={heroRef} className="relative z-0 h-[285vh]" />

      {/* Section 2 (sticky text, moving images) */}
      <section
        ref={whoRef}
        id="about"
        className="relative scroll-mt-28 bg-black z-30"
        style={{ transform: 'translate3d(0,0,0)' }}
      >
        {/* Gradient fade from transparent to black — softens the hard edge */}
        <div className="absolute top-0 left-0 right-0 -translate-y-full h-[30vh] bg-gradient-to-b from-transparent to-black z-30 pointer-events-none" />
        <div className="relative h-[230vh]">
          {/* Images that move up + disappear — clipped independently */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <Motion.div
              className="absolute inset-0"
              style={{ y: whoImgsY, scale: whoImgsScale, willChange: 'transform' }}
              aria-hidden="true"
            >
              {/* Image 1 — far left, bigger */}
              <div className="absolute left-[2%] top-[10%] h-[50%] w-[30%] overflow-hidden rounded-2xl">
                <img
                  src={WHO_LEFT}
                  alt=""
                  className="h-full w-full object-cover blur-[2px] saturate-120"
                  style={{ transform: 'translate3d(0,0,0)' }}
                />
              </div>
              <div className="absolute left-[2%] top-[62%] w-[30%] px-1">
                <p className="text-[18px] font-light text-white/50 leading-snug">
                  See every order the moment it drops.
                </p>
              </div>
              {/* Image 2 — far right, starts at 5/6th height of image 1 */}
              <div className="absolute right-[2%] top-[52%] h-[45%] w-[28%] overflow-hidden rounded-2xl">
                <img
                  src={WHO_RIGHT}
                  alt=""
                  className="h-full w-full object-cover blur-[1px] saturate-120"
                  style={{ transform: 'translate3d(0,0,0)' }}
                />
              </div>
              <div className="absolute right-[2%] top-[99%] w-[28%] px-1 text-right">
                <p className="text-[18px] font-light text-white/50 leading-snug">
                  Your brand. Your identity. Worn and sold.
                </p>
              </div>
              {/* Image 3 — far left, starts at 5/6th height of image 2 */}
              <div className="absolute left-[2%] top-[82%] h-[40%] w-[50%] overflow-hidden rounded-3xl">
                <img
                  src={WHO_BIG}
                  alt=""
                  className="h-full w-full object-cover opacity-70 blur-[6px]"
                  style={{ transform: 'translate3d(0,0,0)' }}
                />
              </div>
              <div className="absolute left-[2%] top-[124%] w-[50%] px-1">
                <p className="text-[18px] font-light text-white/50 leading-snug">
                  Built on the tools that scale.
                </p>
              </div>
            </Motion.div>
          </div>

          {/* Sticky editorial text */}
          <div className="sticky top-24 px-6 pb-20">
            <div className="mx-auto max-w-7xl">
              <div className="text-[72px] font-extrabold tracking-tight leading-[0.95] sm:text-[96px]" style={{ color: '#056363' }}>
                We Build Stores<br />That Sell
              </div>
              <p className="mt-8 max-w-2xl text-[22px] leading-relaxed text-white/50 font-light ml-auto text-right">
                BuyTree turns your brand into an online storefront — no code, no wait, no limits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — THE IDEA (dark bg, sticky — store panels close over it) */}
      <div ref={ideaRef} className="relative z-10" style={{ height: '235vh' }}>
        <div className="sticky top-0 h-screen overflow-hidden bg-black" style={{ transform: 'translate3d(0,0,0)' }}>
          <Motion.div
            className="absolute inset-0"
            style={{ y: ideaImgY, willChange: 'transform', transform: 'translate3d(0,0,0)' }}
          >
            <img
              src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1920&q=80"
              alt=""
              className="h-[115%] w-full object-cover brightness-[0.35]"
            />
          </Motion.div>
          {/* "THE IDEA" text */}
          <div className="relative z-10 flex h-full items-center justify-center px-6">
            <Motion.div
              className="text-center"
              style={{ opacity: ideaTextOpacity, y: ideaTextY, willChange: 'transform, opacity' }}
            >
              <div className="text-[64px] font-extrabold tracking-tight leading-[0.95] sm:text-[96px]" style={{ color: '#056363' }}>
                Every brand starts<br />with an idea.
              </div>
              <p className="mt-6 max-w-2xl mx-auto text-[22px] leading-relaxed text-white/50 font-light">
                We give it a storefront, a checkout, and a customer base — in minutes.
              </p>
            </Motion.div>
          </div>
          {/* Store panels — slide in over "THE IDEA" as you keep scrolling */}
          <div className="absolute inset-0 z-20 flex pointer-events-none" style={{ transform: 'translate3d(0,0,0)' }}>
            <Motion.div
              className="h-full w-[70%] shrink-0 overflow-hidden bg-[#e4e4e7] pointer-events-auto"
              style={{ x: storeLeftX, willChange: 'transform', transform: 'translate3d(0,0,0)' }}
            >
              <img
                src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1920&q=80"
                alt=""
                className="h-full w-full object-cover"
              />
            </Motion.div>
            <Motion.div
              className="flex h-full w-[30%] shrink-0 items-center bg-[#e4e4e7] px-8 md:px-14 pointer-events-auto"
              style={{ x: storeRightX, willChange: 'transform', transform: 'translate3d(0,0,0)' }}
            >
              <div>
                <div className="text-[40px] font-extrabold tracking-tight leading-[0.95] text-black/85 sm:text-[56px]">
                  We make<br />it real.
                </div>
                <p className="mt-6 text-[18px] leading-relaxed font-light italic" style={{ color: '#056363' }}>
                  Your store. Your brand.<br />Live in minutes.
                </p>
              </div>
            </Motion.div>
          </div>
        </div>
      </div>

      {/* Section 5 — THE REACH (dark bg, full-bleed with stats) */}
      <section
        ref={reachRef}
        className="relative z-10 h-screen overflow-hidden bg-black"
      >
        <Motion.div
          className="absolute inset-0"
          style={{ y: reachImgY, willChange: 'transform' }}
        >
          <img
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&q=80"
            alt=""
            className="h-[115%] w-full object-cover brightness-[0.3]"
          />
        </Motion.div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
          <Motion.div style={{ opacity: reachTextOpacity, willChange: 'opacity' }}>
            <div className="text-center text-[56px] font-extrabold tracking-tight leading-[0.95] text-white sm:text-[88px]">
              Across campuses.<br />Across states.
            </div>
            <p className="mt-6 text-center text-[22px] font-light italic text-white/40">
              From dorm rooms to delivery trucks — BuyTree sellers are everywhere.
            </p>
            <div className="mt-16 flex flex-wrap items-center justify-center gap-14 sm:gap-20">
              {[
                { num: '100+', label: 'Stores launched' },
                { num: '5,000+', label: 'Orders delivered' },
                { num: '10+', label: 'Campuses connected' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-[48px] font-extrabold tracking-tight sm:text-[64px]" style={{ color: '#056363' }}>
                    {s.num}
                  </div>
                  <div className="mt-2 text-[18px] font-light text-white/40">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </Motion.div>
        </div>
      </section>

      {/* Section 6 — YOUR TURN (cinematic CTA) */}
      <section
        ref={ctaRef}
        className="relative z-10 h-screen overflow-hidden bg-black"
      >
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1920&q=80"
            alt=""
            className="h-full w-full object-cover brightness-[0.2]"
          />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
          <Motion.div
            className="text-center"
            style={{ opacity: ctaTextOpacity, scale: ctaTextScale, willChange: 'transform, opacity' }}
          >
            <div className="text-[80px] font-extrabold tracking-tight leading-none sm:text-[120px]" style={{ color: '#056363' }}>
              Your turn.
            </div>
            <p className="mt-6 text-[20px] font-light text-white/50">
              Launch your store in under 5 minutes. No code. No fees to start.
            </p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-5">
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="rounded-full px-10 py-4 text-[18px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#056363' }}
              >
                Launch Your Store
              </button>
              <button
                type="button"
                onClick={() => navigate('/shop/demo')}
                className="rounded-full border-2 px-10 py-4 text-[18px] font-semibold transition-colors hover:bg-white/5"
                style={{ borderColor: '#056363', color: '#056363' }}
              >
                See How It Works
              </button>
            </div>
          </Motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer
        ref={contactRef}
        id="contact"
        className="relative bg-black pt-16 pb-10 z-10"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-10 md:flex-row md:items-start">
            <div>
              <div className="text-2xl font-extrabold tracking-widest" style={{ color: '#056363' }}>
                {brand}
              </div>
              <p className="mt-3 max-w-xs text-[16px] leading-relaxed text-white/40">
                The simplest way to launch your online store and start selling to your community.
              </p>
            </div>
            <div className="flex gap-16 text-[16px]">
              <div>
                <div className="font-semibold tracking-wide text-white/70">Product</div>
                <div className="mt-4 flex flex-col gap-3 text-white/40">
                  <button type="button" onClick={() => scrollToRef(aboutRef)} className="text-left hover:text-white/60">About</button>
                  <button type="button" className="text-left hover:text-white/60">Features</button>
                </div>
              </div>
              <div>
                <div className="font-semibold tracking-wide text-white/70">Legal</div>
                <div className="mt-4 flex flex-col gap-3 text-white/40">
                  <button type="button" className="text-left hover:text-white/60">Privacy</button>
                  <button type="button" className="text-left hover:text-white/60">Terms</button>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-14 border-t border-white/10 pt-6 text-center text-sm text-white/30">
            &copy; {new Date().getFullYear()} BuyTree. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

