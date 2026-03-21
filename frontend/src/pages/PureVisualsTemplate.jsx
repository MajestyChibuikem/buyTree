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

// Featured works
const LIQUID_FUSION_IMG = 'https://framerusercontent.com/images/LOIbS2rhmapNJvTNFn65dTpPQ.png';
const HYPER_DRIVE_IMG = 'https://framerusercontent.com/images/Bo7XI7xqY7zvBCeEt0ya1vHYEnE.png';

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
              {/* Image 2 — far right, starts at 5/6th height of image 1 */}
              <div className="absolute right-[2%] top-[52%] h-[45%] w-[28%] overflow-hidden rounded-2xl">
                <img
                  src={WHO_RIGHT}
                  alt=""
                  className="h-full w-full object-cover blur-[1px] saturate-120"
                  style={{ transform: 'translate3d(0,0,0)' }}
                />
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
            </Motion.div>
          </div>

          {/* Sticky glass text — outside overflow:hidden so it actually sticks */}
          <div className="sticky top-24 px-6 pb-20">
            <div className="mx-auto max-w-7xl">
              <div className="relative grid items-start gap-8 md:grid-cols-12">
                <div className="md:col-span-6">
                  <div className="text-[68px] font-extrabold tracking-[0.02em] text-white/90 leading-none">
                    WHO WE ARE
                  </div>
                </div>

                <div className="md:col-span-6">
                  <div className="max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <p className="text-sm leading-relaxed text-white/70">
                      At BuyTree, we are a team dedicated to crafting
                      compelling storefront experiences—bringing brands,
                      stories, and concepts to life with a refined touch.
                    </p>
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => {}}
                        className="text-sm font-medium text-white/85 underline decoration-white/30 underline-offset-4 hover:decoration-white/70"
                      >
                        About Us
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 (Featured works) */}
      <section className="relative bg-black pt-24 pb-28 z-10" id="works">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <div className="text-[56px] font-extrabold tracking-[0.12em] text-white/85 leading-none">
              FEATURED WORKS
            </div>
            <p className="mx-auto mt-6 max-w-3xl text-sm leading-relaxed text-white/60">
              A showcase of our finest creations—where creativity meets
              impact. From bold branding to immersive digital experiences, each
              project reflects our passion for design and innovation. Explore
              how we bring ideas to life through thoughtful execution and
              striking visuals
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <img
                src={LIQUID_FUSION_IMG}
                alt="Liquid Fusion"
                className="h-[280px] w-full object-cover"
              />
              <div className="p-6">
                <div className="text-lg font-semibold tracking-widest">
                  LIQUID FUSION
                </div>
                <div className="mt-2 text-xs tracking-wide text-white/50">
                  FOOD & BEVERAGE
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <img
                src={HYPER_DRIVE_IMG}
                alt="Hyper Drive"
                className="h-[280px] w-full object-cover"
              />
              <div className="p-6">
                <div className="text-lg font-semibold tracking-widest">
                  HYPER DRIVE
                </div>
                <div className="mt-2 text-xs tracking-wide text-white/50">
                  PRODUCT
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Placeholder contact section (for nav scroll) */}
      <section
        ref={contactRef}
        id="contact"
        className="bg-black scroll-mt-28 pt-10 pb-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-xl">
            <div className="text-2xl font-bold tracking-wide">
              Contact (placeholder)
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Add your form/link here later. For now, the nav scroll is wired
              up to this section.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
                onClick={() => {}}
              >
                Email us
              </button>
              <button
                type="button"
                className="rounded-full bg-white/15 px-6 py-2 text-sm font-medium text-white/90 hover:bg-white/20"
                onClick={() => {}}
              >
                Call / WhatsApp
              </button>
              <button
                type="button"
                className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-black hover:bg-white/80"
                onClick={() => navigate('/')}
              >
                Back to app
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

