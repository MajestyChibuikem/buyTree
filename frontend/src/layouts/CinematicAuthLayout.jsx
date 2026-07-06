import React from 'react';
import { motion } from 'framer-motion';

/**
 * CinematicAuthLayout - A 50/50 split screen layout for auth pages.
 * Left side: Stunning full-bleed image with massive typography.
 * Right side: The authentication form.
 */
export default function CinematicAuthLayout({ 
  children, 
  title = "Start Selling.", 
  subtitle = "Join the future of white-label e-commerce in Nigeria.",
  imageSrc = "https://images.unsplash.com/photo-1661956602116-aa6865609028?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
}) {
  return (
    <div className="flex min-h-screen w-full bg-cinematic-bgDark text-white font-cinematic">
      
      {/* LEFT SIDE: Cinematic Image Panel (Hidden on mobile) */}
      <div className="relative hidden lg:flex lg:w-1/2 overflow-hidden bg-black flex-col justify-end p-16">
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="absolute inset-0 bg-black/40 z-10"></div> {/* Brightness darkening */}
          <img 
            src={imageSrc} 
            alt="Cinematic background" 
            className="w-full h-full object-cover"
            style={{ transform: 'translate3d(0,0,0)' }}
          />
        </motion.div>

        {/* Text Overlay */}
        <div className="relative z-20 max-w-xl">
          <motion.h1 
            className="text-6xl lg:text-8xl font-bold tracking-tight mb-6 leading-none"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            style={{ willChange: 'transform, opacity' }}
          >
            {title}
          </motion.h1>
          <motion.p 
            className="text-xl lg:text-2xl text-zinc-300 font-light"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            style={{ willChange: 'transform, opacity' }}
          >
            {subtitle}
          </motion.p>
        </div>
      </div>

      {/* RIGHT SIDE: Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-24 bg-zinc-950 relative">
        {/* Subtle top-right accent glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cinematic-light/10 blur-[120px] rounded-full pointer-events-none"></div>

        <motion.div 
          className="w-full max-w-md relative z-10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          style={{ willChange: 'transform, opacity' }}
        >
          {children}
        </motion.div>
      </div>
      
    </div>
  );
}
