import { motion } from "framer-motion";

interface AgreementRingProps {
  winner: string;
  status: string;
}

export function AgreementRing({ winner, status }: AgreementRingProps) {
  const isResolved = status === "resolved";
  const isPending = status === "collecting";

  const ringColor = isResolved
    ? winner === "A"
      ? "hsl(42 92% 56%)"
      : winner === "B"
      ? "hsl(280 60% 60%)"
      : "hsl(220 10% 48%)"
    : "hsl(220 14% 16%)";

  const glowColor = isResolved
    ? winner === "A"
      ? "0 0 40px hsl(42 92% 56% / 0.4), 0 0 80px hsl(42 92% 56% / 0.15)"
      : winner === "B"
      ? "0 0 40px hsl(280 60% 60% / 0.4), 0 0 80px hsl(280 60% 60% / 0.15)"
      : "0 0 20px hsl(220 10% 48% / 0.2)"
    : "none";

  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="absolute h-32 w-32 rounded-full"
        style={{ border: `3px solid ${ringColor}`, boxShadow: glowColor }}
        animate={isPending ? { rotate: 360 } : { scale: [1, 1.05, 1] }}
        transition={isPending ? { duration: 8, repeat: Infinity, ease: "linear" } : { duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="relative flex h-24 w-24 items-center justify-center rounded-full border-2"
        style={{ borderColor: ringColor }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
      >
        <span className="font-display text-2xl font-bold" style={{ color: ringColor }}>
          {isResolved ? (winner === "inconclusive" ? "≈" : winner) : "?"}
        </span>
      </motion.div>
    </div>
  );
}
