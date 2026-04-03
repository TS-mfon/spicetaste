
 What It Is
  An on-chain "Taste Score" for any creative work. A creator submits a URL, and a specialized committee of AI validators—each with a distinct aesthetic
  profile—evaluates the work. The result is a Taste Score: a composable on-chain credential that other protocols can use for gating, curation, or
  governance.

  Why It Wins the Bradbury Special Track
   - Subjective Consensus at Scale: Demonstrates how GenLayer can reach agreement on "taste"—the ultimate non-deterministic metric.
   - Multi-Agent Governance: Uses three distinct AI "personalities" to find a balanced middle ground.
   - Infrastructure Primitive: It’s a tool others build on (e.g., a DAO that only allows members with a high "Taste Score" to submit proposals).

  ---

  LIFECYCLE OF A TASTE EVALUATION

  1️⃣ SUBMISSION (Instant)
     ├─ Creator submits URL + Statement (Title, Category, Intent)
     ├─ Transaction is accepted instantly (No timeouts)
     └─ Work is stored as pending_evaluation

  2️⃣ TRI-PROFILE EVALUATION (Asynchronous)
     ├─ Triggered by a call to calculate_taste_score(id)
     ├─ The Leader fetches a 500-character summary of the work.
     ├─ The Leader simulates three distinct "Critique Personas" internally:
     │  ├─ Formalist: Scores technical craft (0-100)
     │  ├─ Culturalist: Scores resonance and context (0-100)
     │  ├─ Futurist: Scores novelty and potential (0-100)
     ├─ Consensus: Validators re-run the personas and must reach consensus on the Composite Score (the weighted average).
     └─ Status moves to certified; Score is minted to the creator's profile.

  3️⃣ CREDENTIAL MINTING
     ├─ The final score (0-100) is locked on-chain.
     └─ Other contracts can now call get_taste_score(address) to verify credentials.

  ---

  AI VALIDATOR PROFILES (Internal to the Consensus Logic)

  To ensure speed and consensus, the contract uses run_nondet_unsafe where the leader generates the full critique, but the network only enforces equality on
  the Final Composite Score.

   - Profile A: "Formalist Critic" — Prioritizes technical craft and structural integrity.
   - Profile B: "Cultural Commentator" — Prioritizes cultural context and emotional impact.
   - Profile C: "Futurist" — Prioritizes novelty, experimentation, and "ceiling."

  ---

  FRONTEND ARCHITECTURE

  /proof-of-taste
  ├── Submit      — Drop a URL, select category, add creator statement (Step 1)
  ├── Review Queue — UI to trigger the Tri-Profile AI Analysis (Step 2)
  ├── Score Card  — Animated reveal of the 3 persona scores → final composite
  ├── Leaderboard — Top scored works by category (Music, Art, Code, Writing)
  ├── Portfolio   — Creator's certified taste credential (shareable link)
  └── Verify      — Check if an address holds a certified taste credential

  Key UI moment: The "Agreement Ring". When the three profiles finish their evaluation, the UI shows three cards flipping over. If the consensus is tight
  (validators agreed quickly), the ring glows gold. If the AI personas were divided but reached a middle ground, the ring shows the variance, illustrating
  the "Subjective Consensus" in action.

  ---

  CONSENSUS PROCESS (Optimized)

  Leader:
   1. Fetches data: "The work uses complex polyrhythms and lo-fi textures..."
   2. Runs Persona A (92), B (75), C (88) -> Composite: 85
   3. Proposes: 85 + Full JSON Critique.

  Validators:
   1. Run their own personas on the same data.
   2. If their Composite Score is within a ±3 point tolerance of the leader, they AGREE.
   3. ACCEPTED: The score 85 is written to the blockchain.



this is the contract address: 0xC0182ca8C2DFbc5B039BfD21Afc6f8Cc28719B90
deployed on genlayer studio net

this is how to use the users use the contract

 A decentralized dispute/testing platform.

  Step 1: Create the Test (Instant)
  Method: create_test
  Arguments: [name, var_a_url, var_b_url, var_a_desc, var_b_desc, metric, stake]
  UI Note: Use "" for URLs if they aren't needed. Returns a test_id.

  Step 2: Submit Evidence
  Method: submit_evidence
  Arguments: [test_id: int, url: str, description: str]
  UI Note: Users can call this multiple times to build their case before resolution.

  Step 3: Resolve & Judge (The AI Call)
  Method: resolve
  Arguments: [test_id: int]
  UI Note: This triggers the AI "Judge" to read the evidence and pick a winner. It returns the winner ("A", "B", or "inconclusive").

  ---
