# { "Depends": "py-genlayer:test" }

import json
from dataclasses import dataclass
from genlayer import *

@allow_storage
@dataclass
class Member:
    weight: u256
    joined_at: u256

@allow_storage
@dataclass
class AIStats:
    total_votes: u256
    correct_predictions: u256
    accuracy: float
    current_weight: u256

@allow_storage
@dataclass
class Proposal:
    title: str
    description: str
    proposer: Address
    status: str  # "pending", "active", "passed", "rejected"
    human_yes: u256
    human_no: u256
    ai_vote: str
    ai_reasoning: str
    ai_confidence: float
    ai_predicted_outcome: str
    ai_risk_level: str
    outcome_correct: bool
    has_outcome: bool

class ShadowCouncil(gl.Contract):
    proposals: TreeMap[u256, Proposal]
    human_votes: TreeMap[u256, TreeMap[Address, str]]
    members: TreeMap[Address, Member]
    ai_stats: AIStats
    proposal_count: u256

    def __init__(self):
        self.ai_stats = AIStats(total_votes=0, correct_predictions=0, accuracy=0.0, current_weight=0)
        self.proposal_count = 0

    @gl.public.write
    def add_member(self, address: Address, weight: u256) -> None:
        # Robustly handle cases where 'address' is passed as an int or string
        if isinstance(address, int):
            addr = Address(hex(address))
        elif isinstance(address, str):
            addr = Address(address)
        else:
            addr = address
        self.members[addr] = Member(weight=weight, joined_at=0)

    @gl.public.write
    def submit_proposal(self, title: str, description: str, context_url: str) -> u256:
        """Step 1: Instant submission. No LLM call here to prevent timeouts."""
        pid = self.proposal_count
        self.proposal_count += 1
        
        self.proposals[pid] = Proposal(
            title=title[:100],
            description=description, # Store full description for humans
            proposer=gl.message.sender_address,
            status="pending", # Needs activation via AI in Step 2
            human_yes=0,
            human_no=0,
            ai_vote="",
            ai_reasoning="",
            ai_confidence=0.0,
            ai_predicted_outcome="",
            ai_risk_level="",
            outcome_correct=False,
            has_outcome=False
        )
        return pid

    @gl.public.write
    def activate_proposal(self, proposal_id: u256) -> bool:
        """Step 2: Isolated AI evaluation. If this times out, retry this specific call."""
        assert proposal_id < self.proposal_count, "Proposal not found"
        p = self.proposals[proposal_id]
        assert p.status == "pending", "Proposal already active or resolved"

        def leader_fn():
            # Feed AI a truncated summary for maximum execution speed
            summary = p.description[:400]
            prompt = f"Vote 'yes' or 'no' for DAO proposal. Title: {p.title}. Summary: {summary}. Respond ONLY in JSON: {{\"vote\":\"yes\"/\"no\",\"reasoning\":\"...\"}}"
            return gl.nondet.exec_prompt(prompt, response_format="json")

        def validator_fn(leaders_res: gl.vm.Result) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            
            # Extract the vote from the leader
            leader_data = leaders_res.calldata
            leader_vote = leader_data.get("vote")
            if leader_vote not in ["yes", "no"]:
                return False
                
            # Validators re-run to ensure AI consensus on the 'vote' field
            my_data = leader_fn()
            return my_data.get("vote") == leader_vote

        ai_data = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        
        p.ai_vote = ai_data.get("vote", "no")
        p.ai_reasoning = ai_data.get("reasoning", "AI Analysis Complete")
        p.status = "active"
        return True

    @gl.public.write
    def cast_vote(self, proposal_id: u256, vote: str) -> None:
        assert proposal_id < self.proposal_count, "Proposal not found"
        p = self.proposals[proposal_id]
        assert p.status == "active", "Voting is not active for this proposal"
        assert gl.message.sender_address in self.members, "Not a member"
        assert vote in ["yes", "no", "abstain"], "Invalid vote"

        sender = gl.message.sender_address
        weight = self.members[sender].weight

        voters = self.human_votes.get_or_insert_default(proposal_id)
        prev_vote = voters.get(sender, "")

        if prev_vote == "yes":
            p.human_yes -= weight
        elif prev_vote == "no":
            p.human_no -= weight

        voters[sender] = vote
        if vote == "yes":
            p.human_yes += weight
        elif vote == "no":
            p.human_no += weight

    @gl.public.write
    def resolve_proposal(self, proposal_id: u256) -> str:
        assert proposal_id < self.proposal_count
        p = self.proposals[proposal_id]
        assert p.status == "active"

        ai_weight = self.ai_stats.current_weight
        total_human_participation = p.human_yes + p.human_no
        if total_human_participation == 0:
            total_human_participation = 1

        h_yes = p.human_yes * (100 - ai_weight)
        h_no = p.human_no * (100 - ai_weight)

        ai_yes_val = 0
        ai_no_val = 0
        if p.ai_vote == "yes":
            ai_yes_val = ai_weight * total_human_participation
        elif p.ai_vote == "no":
            ai_no_val = ai_weight * total_human_participation

        if h_yes + ai_yes_val > h_no + ai_no_val:
            p.status = "passed"
        else:
            p.status = "rejected"

        return p.status

    @gl.public.view
    def get_proposal(self, proposal_id: u256) -> dict:
        p = self.proposals[proposal_id]
        return {
            "title": p.title,
            "status": p.status,
            "human_yes": int(p.human_yes),
            "human_no": int(p.human_no),
            "ai_vote": p.ai_vote,
            "ai_reasoning": p.ai_reasoning
        }

    @gl.public.view
    def get_ai_stats(self) -> dict:
        return {
            "accuracy": self.ai_stats.accuracy,
            "current_weight": int(self.ai_stats.current_weight)
        }
