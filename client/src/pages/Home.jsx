import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import InteractiveAIOrb from "../components/ui/InteractiveAIOrb";

export default function Home() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();
  const [localTime, setLocalTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      // Format time in GMT+5 (Pakistan Time) beautifully
      const options = {
        timeZone: "Asia/Karachi",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      setLocalTime(now.toLocaleTimeString("en-US", options));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = ["Home", "Features", "Dashboard", "AI Agent", "Pricing", "Support"];
  const resourceLinks = [
    "WhatsApp Automation",
    "Inventory Intelligence",
    "Weather Insights",
    "Customer Segments",
    "Order Analytics",
  ];

  return (
    <div className="landing-page-root min-h-screen w-full relative px-4 md:px-12 py-6 md:py-10 flex flex-col justify-between">
      {/* Top Capsule Navigation Header */}
      <header className="w-full max-w-6xl mx-auto mb-16">
        <div className="landing-capsule-nav flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs md:text-sm text-white/60 truncate">
            <span className="material-symbols-outlined text-[20px] text-[#1390ff] animate-pulse">lens_blur</span>
            <span className="font-medium tracking-wide truncate">Your neighborhood shop, beautifully powered by smart retail AI</span>
          </div>
          
          <div className="flex items-center gap-2">
            {[
              { icon: "public", url: "#" },
              { icon: "smart_display", url: "#" },
              { icon: "forum", url: "#" },
              { icon: "alternate_email", url: "#" },
              { icon: "code", url: "#" }
            ].map((item, idx) => (
              <a 
                key={idx}
                href={item.url}
                className="w-8 h-8 rounded-full border border-white/10 bg-white/5 hover:bg-[#1390ff]/20 hover:border-[#1390ff] flex items-center justify-center transition-all duration-300 group"
              >
                <span className="material-symbols-outlined text-[14px] text-white/70 group-hover:text-white transition-colors">
                  {item.icon}
                </span>
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-12 lg:gap-8 items-start my-auto">
        {/* Left Column: Heading, Tagline, CTAs */}
        <div className="flex flex-col items-start text-left">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="landing-title-main"
          >
            Market Pulse AI
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="landing-tagline-sub"
          >
            GROW YOUR SHOP TO MARKET PULSE AI
          </motion.div>

          <p className="mt-6 max-w-xl text-[14px] md:text-[15px] leading-relaxed text-white/60 font-normal">
            Automate customer management, predict demand using AI models, schedule smart orders, 
            and seamlessly communicate with neighborhood retail insights custom built for Pakistani merchants.
          </p>

          {/* Interactive CTA Buttons & Creative Tooltip */}
          <div className="relative flex flex-col sm:flex-row flex-wrap items-center gap-4 mt-8 w-full sm:w-auto">
            <button
              onClick={() => navigate("/register")}
              className="landing-btn-primary w-full sm:w-auto justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              Start Now
            </button>
            
            <button
              onClick={() => navigate("/login")}
              className="landing-btn-secondary w-full sm:w-auto justify-center"
            >
              Sign In
            </button>

            {/* Playful yellow cursor tooltip as seen in user's reference image */}
            <div className="sm:absolute left-[80%] top-[90%] sm:top-[-45px] mt-4 sm:mt-0 flex flex-col items-center sm:items-start select-none z-10">
              <div className="yellow-badge animate-bounce">
                AI. Insights. Growth.
              </div>
              <svg 
                className="hidden sm:block w-4 h-4 ml-8 text-[#ffad1e] fill-current" 
                viewBox="0 0 24 24"
                style={{ transform: "rotate(-30deg)" }}
              >
                <path d="M4 2l16 10-8 2 8 8-3 1-8-8-5 5z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Lists & AI Orb */}
        <div className="flex flex-col items-center gap-8 w-full">
          <InteractiveAIOrb />
          <div className="grid grid-cols-2 gap-8 pt-4 lg:pl-16 w-full">
            <div>
              <h3 className="text-white/95 text-[20px] font-bold tracking-tight mb-5 font-sora uppercase">
                Navigate
              </h3>
              <ul className="space-y-3.5">
                {navLinks.map((link) => (
                  <li key={link} className="text-[14px] text-white/70 hover:text-white flex items-center transition-colors duration-200 cursor-pointer">
                    <span className="star-bullet">✶</span>
                    {link}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-white/95 text-[20px] font-bold tracking-tight mb-5 font-sora uppercase">
                Resources
              </h3>
              <ul className="space-y-3.5">
                {resourceLinks.map((link) => (
                  <li key={link} className="text-[14px] text-white/70 hover:text-white flex items-center transition-colors duration-200 cursor-pointer">
                    <span className="star-bullet">✶</span>
                    {link}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <footer className="w-full max-w-6xl mx-auto border-t border-white/10 pt-8 mt-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase text-white/40 tracking-widest mb-3">All rights reserved.</p>
          <div className="footer-rights">
            © {year} MARKET PULSE AI
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto">
          <div>
            <p className="text-white/40 text-[11px] font-semibold tracking-widest uppercase">Local Time</p>
            <p className="text-sm font-medium text-white/80 mt-2 flex items-center gap-2">
              <span className="text-[#1390ff]">✶</span> {localTime || "00:00:00 AM"}, PKT (GMT +5)
            </p>
          </div>
          
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="w-11 h-11 rounded-full bg-[#1390ff] hover:bg-[#0f7bcc] flex items-center justify-center shadow-[0_0_20px_rgba(19,144,255,0.45)] hover:shadow-[0_0_30px_rgba(19,144,255,0.65)] transition-all duration-300 transform hover:-translate-y-1"
            aria-label="Scroll to top"
          >
            <span className="material-symbols-outlined text-[20px] text-white font-bold">arrow_upward</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
