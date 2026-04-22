/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  CheckCircle2, 
  Smartphone, 
  FileText, 
  Users, 
  BrainCircuit, 
  MapPin, 
  Mail, 
  Instagram, 
  Youtube,
  Menu,
  X,
  Target,
  Sparkles,
  ShieldCheck,
  Building2,
  ChevronRight
} from 'lucide-react';

// --- Components ---

const Navbar = ({ onOpenReport }: { onOpenReport: () => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Approach', href: '#approach' },
    { name: 'The App', href: 'https://app.careershifu.com/', external: true },
    { name: 'The Report', href: '#report', triggerModal: true },
    { name: 'Schools', href: '#schools' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white border-b border-brand-border py-3 shadow-sm' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">CS</span>
          </div>
          <span className="text-xl font-bold font-display tracking-tight text-brand-text">Career<span className="text-brand-orange">Shifu</span></span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            link.triggerModal ? (
              <button 
                key={link.name} 
                onClick={onOpenReport}
                className="text-xs uppercase tracking-widest font-bold text-brand-text hover:text-brand-orange transition-colors cursor-pointer"
              >
                {link.name}
              </button>
            ) : (
              <a 
                key={link.name} 
                href={link.href} 
                {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="text-xs uppercase tracking-widest font-bold text-brand-text hover:text-brand-orange transition-colors"
              >
                {link.name}
              </a>
            )
          ))}
          <a href="https://app.careershifu.com/" target="_blank" rel="noopener noreferrer" className="bg-brand-orange text-white px-5 py-2 rounded-full font-bold text-[10px] uppercase tracking-wider">Try Free App</a>
        </div>

        {/* Mobile Toggle */}
        <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-brand-text">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 bg-brand-bg z-[60] flex flex-col p-8"
          >
            <div className="flex justify-end mb-8">
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-brand-text">
                <X className="w-8 h-8" />
              </button>
            </div>
            <div className="flex flex-col gap-8 text-center text-sm uppercase tracking-widest font-bold">
              {navLinks.map((link) => (
                link.triggerModal ? (
                  <button 
                    key={link.name} 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenReport();
                    }}
                    className="text-brand-text uppercase tracking-widest font-bold"
                  >
                    {link.name}
                  </button>
                ) : (
                  <a 
                    key={link.name} 
                    href={link.href} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-brand-text"
                  >
                    {link.name}
                  </a>
                )
              ))}
              <a href="https://app.careershifu.com/" target="_blank" rel="noopener noreferrer" onClick={() => setIsMobileMenuOpen(false)} className="bg-brand-orange text-white py-3 rounded-full">Try Free App</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const SectionHeading = ({ children, badge, alignment = 'center', dark = false, orangeBadge = true }: { children: ReactNode, badge?: string, alignment?: 'left' | 'center', dark?: boolean, orangeBadge?: boolean }) => (
  <div className={`mb-12 ${alignment === 'center' ? 'text-center mx-auto' : ''} max-w-2xl`}>
    {badge && (
      <span className={orangeBadge ? 'badge-orange mb-4 inline-block' : 'badge-purple mb-4 inline-block'}>
        {badge}
      </span>
    )}
    <h2 className={`text-3xl md:text-5xl font-display font-bold leading-[1.1] tracking-tight ${dark ? 'text-white' : 'text-brand-text'}`}>
      {children}
    </h2>
  </div>
);

// --- Sections ---

export default function App() {
  const [isSampleReportOpen, setIsSampleReportOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden font-sans">
      <Navbar onOpenReport={() => setIsSampleReportOpen(true)} />

      {/* Sample Report Modal */}
      <AnimatePresence>
        {isSampleReportOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
          >
            <div className="absolute inset-0 bg-brand-text/60 backdrop-blur-sm" onClick={() => setIsSampleReportOpen(false)} />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-6 md:p-12 geometric-card border-t-8 border-t-brand-purple"
            >
              <button 
                onClick={() => setIsSampleReportOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-brand-text" />
              </button>

              <div className="flex flex-col gap-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="badge-purple mb-2 inline-block tracking-widest uppercase">Sample Report View</span>
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-brand-text tracking-tight">Your Career Roadmap</h2>
                    <p className="text-brand-muted mt-2">Personalised based on your unique thinking style and strengths.</p>
                  </div>
                  <a href="https://app.careershifu.com/" className="primary-button bg-brand-purple hover:bg-brand-purple/90">Get Your Own Report</a>
                </div>

                <div className="grid gap-6">
                  {/* Thinking Style Section */}
                  <div className="bg-brand-purple rounded-2xl p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <BrainCircuit className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em] mb-4">Section 1 — Thinking Style</h3>
                      <h4 className="text-2xl font-display font-bold mb-4">"The Careful Observer"</h4>
                      <p className="opacity-80 leading-relaxed max-w-2xl italic text-sm">
                        "You tend to pause and take in all sides before you speak or decide. When someone's upset, you listen first. You prefer breaking things into steps rather than winging it. This careful approach means people trust you to handle tense situations."
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Strengths & Areas to Watch */}
                    <div className="bg-brand-orange/5 border-2 border-brand-orange/10 rounded-2xl p-6">
                      <h3 className="text-[10px] font-bold text-brand-orange uppercase tracking-[0.2em] mb-6">Strengths & Blind Spots</h3>
                      <div className="space-y-4">
                        <div className="bg-white/50 p-4 rounded-xl">
                          <h4 className="font-bold text-xs mb-1">Your Strengths</h4>
                          <ul className="space-y-2">
                             <li className="flex items-center gap-2 text-[11px]"><CheckCircle2 className="w-3 h-3 text-brand-orange" /> Bouncing back from setbacks quickly</li>
                             <li className="flex items-center gap-2 text-[11px]"><CheckCircle2 className="w-3 h-3 text-brand-orange" /> Solid grasp of language and concepts</li>
                          </ul>
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-xs mb-1">Areas to Watch</h4>
                          <p className="text-[11px] text-brand-muted leading-relaxed italic">
                            "You sometimes delay starting because you're still figuring out the right entry point..."
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Career Deep-Dives */}
                    <div className="bg-brand-purple/5 border-2 border-brand-purple/10 rounded-2xl p-6">
                      <h3 className="text-[10px] font-bold text-brand-purple uppercase tracking-[0.2em] mb-6">Career Deep-Dives</h3>
                      <div className="space-y-3">
                         {[
                           "Building digital products people use",
                           "Writing and creating stories that resonate",
                           "Making music and sound experiences"
                         ].map((career, i) => (
                           <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl border border-brand-purple/10">
                             <span className="text-[11px] font-bold">{career}</span>
                             <ChevronRight className="w-4 h-4 text-brand-purple" />
                           </div>
                         ))}
                         <p className="text-[10px] text-brand-muted pt-2">Includes fit analysis, stream guidance, degrees, and your first 30-day roadmap.</p>
                      </div>
                    </div>

                    {/* Parent Summary */}
                    <div className="bg-white border-2 border-brand-border rounded-2xl p-6 col-span-full">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-[10px] font-bold text-brand-text uppercase tracking-[0.2em] mb-2">For Parents to Read</h3>
                            <p className="text-[11px] text-brand-muted leading-relaxed max-w-xl">
                              "They want both creative expression and stability, which sometimes feel at odds. Computer Science or Humanities could both work, depending on their lean..."
                            </p>
                          </div>
                          <div className="flex -space-x-2 shrink-0">
                            {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" />)}
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
                    <p className="text-xs text-brand-muted italic mb-4">
                      And 12+ pages of actionable roadmap data and stream guidance...
                    </p>
                    <a href="https://app.careershifu.com/" className="text-[10px] font-bold uppercase tracking-widest text-brand-purple hover:underline">Get your personalised roadmap now &rarr;</a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="col-span-12 md:col-span-12 lg:col-span-5 flex flex-col justify-center"
          >
            <div className="bg-brand-orange-light p-8 rounded-2xl border-2 border-brand-orange/10 h-full flex flex-col justify-center gap-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight">
                Trust Your Path. <br />Evolution, Human <br /><span className="text-brand-orange">& Insight.</span>
              </h1>
              <p className="text-lg text-brand-muted leading-relaxed">
                Humans evolve, and so do career decisions. We handhold you through the journey, mapping your path as you grow and enriching your perspective.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <a href="https://app.careershifu.com/" target="_blank" rel="noopener noreferrer" className="primary-button text-center">Start Free Test</a>
                <button onClick={() => setIsSampleReportOpen(true)} className="secondary-button text-center">View Sample Report</button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="col-span-12 md:col-span-12 lg:col-span-7 grid md:grid-cols-2 gap-6"
          >
            {/* Free Assessment Card */}
            <div className="geometric-card flex flex-col justify-between border-t-4 border-t-brand-orange">
              <div>
                <div className="w-10 h-10 bg-brand-orange/10 rounded-full flex items-center justify-center mb-4">
                  <Smartphone className="text-brand-orange w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold mb-2">5 Min of Knowing You</h2>
                <p className="text-sm text-brand-muted mb-4 leading-relaxed">A short psychometric journey to unlock your core interests. Simple, fast, and completely private.</p>
              </div>
              <div className="bg-brand-orange/5 p-3 rounded-lg flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-orange font-bold">No Phone No. Required</span>
                <a href="https://app.careershifu.com/" target="_blank" rel="noopener noreferrer" className="text-brand-orange font-bold text-sm hover:underline">Try Now &rarr;</a>
              </div>
            </div>

            {/* Premium Report Card */}
            <div className="geometric-card flex flex-col justify-between border-t-4 border-t-brand-purple bg-brand-purple-light">
              <div>
                <div className="w-10 h-10 bg-brand-purple/10 rounded-full flex items-center justify-center mb-4">
                  <FileText className="text-brand-purple w-6 h-6" />
                </div>
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold mb-2">Personalized Report</h2>
                  <span className="bg-brand-purple text-white text-[10px] px-2 py-1 rounded font-bold">BEST VALUE</span>
                </div>
                <p className="text-sm text-brand-muted mb-4 leading-relaxed">Personalised based on your unique inputs—mapping your thinking style, strengths, and roadmap.</p>
              </div>
              <a href="https://app.careershifu.com/" target="_blank" rel="noopener noreferrer" className="w-full bg-brand-purple text-white py-3 rounded-xl font-bold text-sm text-center">Get Report for ₹499</a>
            </div>

            {/* Credibility Card */}
            <div className="geometric-card flex flex-col justify-center">
              <div>
                <h3 className="text-sm font-bold mb-1">Knowledge, Human & AI</h3>
                <p className="text-xs text-brand-muted mb-4 leading-relaxed">Deep domain knowledge meets human context, powered by consistent AI-driven signals.</p>
              </div>
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-brand-orange border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-brand-purple border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-yellow-400 border-2 border-white"></div>
                </div>
                <div className="ml-4 text-[10px] font-bold text-brand-muted flex items-center italic tracking-wider">Validated by many students</div>
              </div>
            </div>

            {/* Institutions Card */}
            <div className="geometric-card bg-brand-amber border-none flex flex-col justify-center items-center text-center p-6">
              <h3 className="text-brand-amber-text font-bold text-lg mb-1">For Institutions</h3>
              <p className="text-sm text-brand-amber-text opacity-80 mb-4 leading-relaxed">Bring consistent professional guidance to your students.</p>
              <a href="mailto:partner@careershifu.com" className="text-[11px] font-bold uppercase tracking-wider border-b-2 border-brand-amber-text text-brand-amber-text pb-1">Contact for Schools</a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Problem (Geometric Style) */}
      <section className="py-24 px-6 bg-white border-y border-brand-border">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-5">
            <div className="bg-brand-text text-white p-10 rounded-2xl flex flex-col justify-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
               <h3 className="text-brand-orange font-bold mb-6 badge-orange">The Problem</h3>
               <p className="text-lg leading-relaxed opacity-90 font-medium">
                 Career guidance today is inconsistent and inaccessible. We bridge this gap by offering every student world-class depth of insight.
               </p>
               <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <X className="w-4 h-4 text-red-500" /> Fragmented Advice
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <X className="w-4 h-4 text-red-500" /> Inconsistent Quality
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <X className="w-4 h-4 text-red-500" /> Academic Isolation
                  </div>
               </div>
            </div>
          </div>
          <div className="md:col-span-7">
            <SectionHeading badge="The Gap" alignment="left">
              The Career Guidance <br /> Paradox
            </SectionHeading>
            <p className="text-lg text-brand-muted leading-relaxed">
              Academic counselling in India is fragmented and dependent on individuals. CareerShifu bridges this gap, ensuring every student has access to consistent, high-depth guidance and clarity.
            </p>
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section id="approach" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div className="order-2 md:order-1">
              <div className="relative">
                <img 
                  src="https://picsum.photos/seed/approach/1000/1000" 
                  alt="AI and Human Collaboration" 
                  className="rounded-2xl shadow-xl grayscale hover:grayscale-0 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 border-2 border-brand-orange/20 rounded-2xl -translate-x-4 translate-y-4 -z-10" />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <SectionHeading badge="Our Approach" alignment="left">
                Expertise, Context. <br />
                <span className="text-brand-purple">Built for Trust.</span>
              </SectionHeading>
              <div className="grid gap-4">
                {[
                  { title: "Personalised Roadmap", desc: "Elaborated based on your unique inputs and evolving goals.", color: "amber" },
                  { title: "Human Connection", desc: "Counsellors who provide handholding as you grow.", color: "purple" },
                  { title: "Digital Insights", desc: "Enriching your knowledge and perspective.", color: "orange" }
                ].map((item, i) => (
                  <div key={i} className="geometric-card flex items-center gap-6 p-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.color === 'orange' ? 'bg-brand-orange/10 text-brand-orange' : item.color === 'purple' ? 'bg-brand-purple/10 text-brand-purple' : 'bg-brand-amber text-brand-amber-text'}`}>
                      {item.color === 'orange' ? <BrainCircuit /> : item.color === 'purple' ? <Users /> : <ShieldCheck />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{item.title}</h4>
                      <p className="text-xs text-brand-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Schools Section (Geometric) */}
      <section id="schools" className="py-24 px-6 bg-brand-amber/30">
        <div className="max-w-7xl mx-auto text-center flex flex-col items-center">
           <SectionHeading badge="Institutions" orangeBadge={false}>For Schools & Institutions</SectionHeading>
           <p className="text-xl text-brand-amber-text max-w-2xl mb-12 font-medium">
             Bring the CareerShifu advantage to your entire student body. Consistent, high-depth guidance for every class.
           </p>
           <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              {[
                "Bulk Registrations", "Detailed Analytics", "Progress Tracking", "Stream Alignment"
              ].map((feature) => (
                <div key={feature} className="bg-white border-2 border-brand-amber-text/10 p-6 rounded-xl font-bold text-brand-amber-text uppercase tracking-widest text-xs">
                  {feature}
                </div>
              ))}
           </div>
           <button className="primary-button mt-12 bg-brand-amber-text text-white shadow-none">Partner With Us</button>
        </div>
      </section>

      {/* Backed by ATRIOS */}
      <section className="py-24 px-6 border-b border-brand-border bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-12 py-4 border-4 border-brand-orange mb-8 rounded-2xl">
             <span className="text-4xl font-display font-black tracking-tighter text-brand-text">ATRIOS</span>
          </div>
          <p className="text-2xl font-display font-bold mb-6 text-brand-text">10 Years. Thousands of Placements.</p>
          <p className="text-brand-muted leading-relaxed text-lg italic">
            "We understand what careers actually look like in the real world because we've built them for a decade."
          </p>
        </div>
      </section>

      {/* Footer (Geometric) */}
      <footer className="w-full py-10 px-8 border-t border-brand-border bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-brand-muted">
             <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-brand-orange rounded flex items-center justify-center text-white text-[10px]">CS</div>
                <span className="text-brand-text">CareerShifu</span>
             </div>
             <span className="hidden sm:block">&copy; 2026</span>
             <span className="hidden md:block">Backed by ATRIOS</span>
          </div>
          
          <div className="flex gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-text">
            {['Instagram', 'YouTube', 'LinkedIn'].map(social => (
              <a key={social} href="#" className="hover:text-brand-orange transition-colors">{social}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
