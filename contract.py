# { "Depends": "py-genlayer:test" }

import json
from dataclasses import dataclass
from genlayer import *

@allow_storage
@dataclass
class Variant:
    url: str
    description: str
    content_snapshot: str

@allow_storage
@dataclass
class Evidence:
    submitter: Address
    url: str
    description: str
    content: str

@allow_storage
@dataclass
class ABTest:
    id: u256
    name: str
    creator: Address
    variant_a: Variant
    variant_b: Variant
    success_metric: str
    stake: u256
    status: str # "collecting", "resolved"
    winner: str # "A", "B", "inconclusive"
    ai_reasoning: str

class TrustlessABTest(gl.Contract):
    tests: TreeMap[u256, ABTest]
    # Use a separate TreeMap for evidence to avoid nested collection errors (DynArray inside TreeMap)
    test_evidence: TreeMap[u256, DynArray[str]] 
    test_count: u256

    def __init__(self):
        self.test_count = 0

    @gl.public.write
    def create_test(
        self,
        name: str,
        variant_a_url: str,
        variant_b_url: str,
        variant_a_description: str,
        variant_b_description: str,
        success_metric: str,
        stake: u256
    ) -> u256:
        tid = self.test_count
        self.test_count += 1

        def fetch_variants():
            content_a, content_b = "n/a", "n/a"
            try:
                # Robustly handle empty URLs
                if variant_a_url and variant_a_url.strip():
                    res_a = gl.nondet.web.get(variant_a_url)
                    content_a = res_a.body.decode("utf-8", errors="ignore")[:1000]
                if variant_b_url and variant_b_url.strip():
                    res_b = gl.nondet.web.get(variant_b_url)
                    content_b = res_b.body.decode("utf-8", errors="ignore")[:1000]
            except:
                pass
            return json.dumps({"a": content_a, "b": content_b}, sort_keys=True)

        # Ensure validators reach consensus on the content snapshots
        v_raw = gl.eq_principle.strict_eq(fetch_variants)
        v = json.loads(v_raw)

        self.tests[tid] = ABTest(
            id=tid,
            name=name[:100],
            creator=gl.message.sender_address,
            variant_a=Variant(variant_a_url, variant_a_description[:200], v["a"]),
            variant_b=Variant(variant_b_url, variant_b_description[:200], v["b"]),
            success_metric=success_metric[:200],
            stake=stake,
            status="collecting",
            winner="",
            ai_reasoning=""
        )
        return tid

    @gl.public.write
    def submit_evidence(self, test_id: u256, url: str, description: str) -> None:
        assert test_id < self.test_count, "Test not found"
        t = self.tests[test_id]
        assert t.status == "collecting", "Test is already resolved"

        def fetch():
            try:
                if url and url.strip():
                    res = gl.nondet.web.get(url)
                    return res.body.decode("utf-8", errors="ignore")[:1000]
                return "n/a"
            except:
                return "error_fetching"

        content = gl.eq_principle.strict_eq(fetch)
        
        # Serialize the Evidence dataclass to JSON to store it in a DynArray[str]
        ev = {
            "submitter": gl.message.sender_address.as_hex,
            "url": url,
            "description": description[:200],
            "content": content
        }
        
        submissions = self.test_evidence.get_or_insert_default(test_id)
        submissions.append(json.dumps(ev))

    @gl.public.write
    def resolve(self, test_id: u256) -> str:
        assert test_id < self.test_count
        t = self.tests[test_id]
        assert t.status == "collecting"

        def leader_fn():
            ev_list = self.test_evidence.get(test_id)
            ev_text = ""
            if ev_list:
                # Process top 5 evidence submissions to avoid token limit issues
                for i in range(min(len(ev_list), 5)):
                    e = json.loads(ev_list[i])
                    ev_text += f"\n- {e['description']}: {e['content'][:200]}"

            prompt = f"""You are an objective AI evaluator.
Test: {t.name}
Metric: {t.success_metric}
Variant A: {t.variant_a.description}. Content: {t.variant_a.content_snapshot[:400]}
Variant B: {t.variant_b.description}. Content: {t.variant_b.content_snapshot[:400]}
Evidence Summary: {ev_text if ev_text else "None"}

Evaluate which variant wins. Respond ONLY JSON: {{"winner":"A"|"B"|"inconclusive","reasoning":"..."}}"""
            return gl.nondet.exec_prompt(prompt, response_format="json")

        def validator_fn(leaders_res: gl.vm.Result) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            leader_winner = leaders_res.calldata.get("winner")
            if leader_winner not in ["A", "B", "inconclusive"]:
                return False
            
            # Re-run evaluation to reach consensus on the winner field
            my_data = leader_fn()
            return my_data.get("winner") == leader_winner

        ai_data = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        
        t.winner = ai_data.get("winner", "inconclusive")
        t.ai_reasoning = ai_data.get("reasoning", "Analysis Complete")
        t.status = "resolved"
        
        return t.winner

    @gl.public.view
    def get_test(self, test_id: u256) -> dict:
        t = self.tests[test_id]
        return {
            "id": int(t.id),
            "name": t.name,
            "status": t.status,
            "winner": t.winner,
            "reasoning": t.ai_reasoning,
            "stake": int(t.stake)
        }
