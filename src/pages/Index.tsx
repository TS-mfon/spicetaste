import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, Brain } from "lucide-react";

const features = [
  { icon: Brain, title: "AI Judges", desc: "Multi-agent consensus evaluates creative works with distinct aesthetic profiles." },
  { icon: Zap, title: "On-Chain Verdicts", desc: "Results are permanently stored on the blockchain as composable credentials." },
  { icon: Shield, title: "Trustless & Fair", desc: "No single entity decides. Validators must reach consensus for results to be accepted." },
];

export default function Index() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative flex flex-1 items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(42_92%_56%/0.06)_0%,transparent_70%)]" />
        <div className="container relative z-10 mx-auto px-4 py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Zap className="h-3.5 w-3.5" /> Powered by GenLayer
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl font-display text-5xl font-bold leading-tight tracking-tight text-foreground md:text-7xl">
              Proof of{" "}
              <span className="text-gradient-gold">Taste</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Submit creative works. Let AI judges with distinct personalities evaluate them.
              Earn an on-chain taste credential.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link to="/submit">
                <Button size="lg" className="bg-gradient-gold font-display text-base font-semibold text-primary-foreground hover:opacity-90">
                  Submit a Work <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/arena">
                <Button variant="outline" size="lg" className="font-display text-base">
                  View Arena
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 py-24">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              className="rounded-xl border border-border bg-gradient-card p-6"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Built on GenLayer — Subjective consensus at scale
        </div>
      </footer>
    </div>
  );
}
