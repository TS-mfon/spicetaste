import { useState } from "react";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import TasteContract, { TestResult } from "@/lib/contracts/TasteContract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AgreementRing } from "@/components/AgreementRing";
import { StatusBadge } from "@/components/StatusBadge";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Search, FileText, Gavel, RefreshCw } from "lucide-react";

export default function Arena() {
  const { address, isConnected } = useWallet();
  const [testIdInput, setTestIdInput] = useState("");
  const [test, setTest] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [resolving, setResolving] = useState(false);

  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceDesc, setEvidenceDesc] = useState("");

  const fetchTest = async () => {
    const id = parseInt(testIdInput);
    if (isNaN(id) || id < 0) {
      toast.error("Enter a valid test ID");
      return;
    }
    setLoading(true);
    try {
      const contract = new TasteContract(address);
      const result = await contract.getTest(id);
      setTest(result);
    } catch (err: any) {
      toast.error(err.message || "Test not found");
      setTest(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!test || !isConnected || !address) return;
    setSubmittingEvidence(true);
    try {
      const contract = new TasteContract(address);
      await contract.submitEvidence(test.id, evidenceUrl, evidenceDesc);
      toast.success("Evidence submitted!");
      setEvidenceUrl("");
      setEvidenceDesc("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit evidence");
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const handleResolve = async () => {
    if (!test || !isConnected || !address) return;
    setResolving(true);
    try {
      const contract = new TasteContract(address);
      await contract.resolve(test.id);
      toast.success("Resolution triggered! Refreshing…");
      // Refetch
      const result = await contract.getTest(test.id);
      setTest(result);
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve");
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="min-h-screen pt-24">
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">The Arena</h1>
          <p className="mt-2 text-muted-foreground">
            Look up a test, submit evidence, and trigger AI resolution.
          </p>

          {/* Lookup */}
          <div className="mt-8 flex gap-3">
            <Input
              placeholder="Enter Test ID (e.g. 0)"
              value={testIdInput}
              onChange={(e) => setTestIdInput(e.target.value)}
              type="number"
              min="0"
              className="bg-secondary border-border"
            />
            <Button onClick={fetchTest} disabled={loading} className="bg-gradient-gold text-primary-foreground font-display hover:opacity-90">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {/* Test Card */}
          <AnimatePresence mode="wait">
            {test && (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-8 rounded-xl border border-border bg-gradient-card p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground">{test.name}</h2>
                    <div className="mt-2 flex items-center gap-3">
                      <StatusBadge status={test.status} />
                      <span className="text-xs text-muted-foreground">ID: {test.id}</span>
                      {test.stake > 0 && <span className="text-xs text-primary">{test.stake} GEN</span>}
                    </div>
                  </div>
                  <AgreementRing winner={test.winner} status={test.status} />
                </div>

                {/* Resolved result */}
                {test.status === "resolved" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 space-y-4"
                  >
                    <div className="rounded-lg border border-border bg-muted/50 p-4">
                      <p className="text-sm font-medium text-foreground">
                        Winner: <span className={test.winner === "A" ? "text-primary" : test.winner === "B" ? "text-accent" : "text-muted-foreground"}>{test.winner}</span>
                      </p>
                      {test.reasoning && (
                        <p className="mt-2 text-sm text-muted-foreground">{test.reasoning}</p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Actions for collecting status */}
                {test.status === "collecting" && isConnected && (
                  <div className="mt-6 space-y-6">
                    {/* Submit Evidence */}
                    <div className="rounded-lg border border-border p-5">
                      <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                        <FileText className="h-4 w-4 text-primary" /> Submit Evidence
                      </h3>
                      <form onSubmit={handleEvidence} className="mt-4 space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Evidence URL</Label>
                          <Input placeholder="https://..." value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} className="bg-secondary border-border" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Textarea placeholder="Describe the evidence…" value={evidenceDesc} onChange={(e) => setEvidenceDesc(e.target.value)} maxLength={200} rows={2} className="bg-secondary border-border resize-none" />
                          <p className="text-xs text-muted-foreground">{evidenceDesc.length}/200</p>
                        </div>
                        <Button type="submit" disabled={submittingEvidence} variant="outline" size="sm" className="font-display">
                          {submittingEvidence ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <FileText className="mr-2 h-3 w-3" />}
                          Submit Evidence
                        </Button>
                      </form>
                    </div>

                    {/* Resolve */}
                    <Button onClick={handleResolve} disabled={resolving} className="w-full bg-gradient-accent font-display font-semibold text-accent-foreground hover:opacity-90">
                      {resolving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> AI is judging…</> : <><Gavel className="mr-2 h-4 w-4" /> Trigger AI Resolution</>}
                    </Button>
                  </div>
                )}

                {/* Refresh */}
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={fetchTest} className="text-muted-foreground">
                    <RefreshCw className="mr-2 h-3 w-3" /> Refresh
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
