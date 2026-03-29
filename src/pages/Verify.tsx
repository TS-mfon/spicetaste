import { useState } from "react";
import TasteContract, { TestResult } from "@/lib/contracts/TasteContract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AgreementRing } from "@/components/AgreementRing";
import { StatusBadge } from "@/components/StatusBadge";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Search, ShieldCheck } from "lucide-react";

export default function Verify() {
  const [testIdInput, setTestIdInput] = useState("");
  const [test, setTest] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleVerify = async () => {
    const id = parseInt(testIdInput);
    if (isNaN(id) || id < 0) {
      toast.error("Enter a valid test ID");
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const contract = new TasteContract();
      const result = await contract.getTest(id);
      setTest(result);
    } catch (err: any) {
      toast.error(err.message || "Test not found");
      setTest(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24">
      <div className="container mx-auto max-w-xl px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Verify</h1>
              <p className="text-sm text-muted-foreground">Check the on-chain result of any taste evaluation.</p>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Input
              placeholder="Test ID"
              value={testIdInput}
              onChange={(e) => setTestIdInput(e.target.value)}
              type="number"
              min="0"
              className="bg-secondary border-border"
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            />
            <Button onClick={handleVerify} disabled={loading} className="bg-gradient-gold text-primary-foreground font-display hover:opacity-90">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {test && (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-8 rounded-xl border border-border bg-gradient-card p-8"
              >
                <div className="flex flex-col items-center text-center">
                  <AgreementRing winner={test.winner} status={test.status} />
                  <h2 className="mt-6 font-display text-xl font-bold text-foreground">{test.name}</h2>
                  <div className="mt-3">
                    <StatusBadge status={test.status} />
                  </div>

                  {test.status === "resolved" && (
                    <div className="mt-6 w-full space-y-3">
                      <div className="rounded-lg border border-border bg-muted/50 p-4 text-left">
                        <p className="text-sm text-muted-foreground">Winner</p>
                        <p className="font-display text-lg font-bold text-foreground">
                          {test.winner === "A" ? "Variant A" : test.winner === "B" ? "Variant B" : "Inconclusive"}
                        </p>
                      </div>
                      {test.reasoning && (
                        <div className="rounded-lg border border-border bg-muted/50 p-4 text-left">
                          <p className="text-sm text-muted-foreground">AI Reasoning</p>
                          <p className="mt-1 text-sm text-foreground">{test.reasoning}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {test.status === "collecting" && (
                    <p className="mt-4 text-sm text-muted-foreground">This test is still collecting evidence and hasn't been resolved yet.</p>
                  )}
                </div>
              </motion.div>
            )}

            {searched && !loading && !test && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center text-sm text-muted-foreground">
                No test found with that ID.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
