# LastLogin - GitHub Strategy (winning "Best Use of GitHub")

GitHub is a confirmed HackPrix sponsor. "Best Use of GitHub" is **not** about
code quality - it's about demonstrating you used GitHub *as a collaboration
platform*. It's the cheapest prize to win because it's pure process. Judges
(and the MLH README rubric) look for: meaningful commit history, branches +
pull requests, issues, a project board, code review between teammates, Actions
(CI), and a strong README. A repo with one giant commit from one account loses
this every time.

Do all of the following. It costs ~30 min total spread across the event.

---

## 0. One-time setup (Dev C, Phase 0)
```bash
# C creates the repo and pushes the scaffold
gh repo create lastlogin --public --source=. --remote=origin --push
# add teammates as collaborators (replace handles)
gh repo edit --add-collaborator devA-handle
gh repo edit --add-collaborator devB-handle
```
On github.com → Settings → Branches → add a protection rule for `main`:
**require a pull request before merging** + **require 1 approval**. This single
toggle is what forces the PR-and-review pattern judges reward.

Enable **Issues** and create a **Project board** (Settings → Projects → new board,
columns: Backlog / In progress / Review / Done).

---

## 1. The branching model (all three)
Never commit to `main` directly. One branch per task:
```bash
git checkout main && git pull
git checkout -b feat/contract-confirm-death     # A
git checkout -b feat/voice-pipeline             # B
git checkout -b feat/vault-crud                 # C
```
Branch name prefixes: `feat/`, `fix/`, `chore/`, `docs/`.

## 2. Commit like a human, often
Small, scoped, conventional commits beat one "final commit" dump.
```bash
git add backend/src/services/ai/sarvam.js
git commit -m "feat(ai): add Sarvam Bulbul TTS for Hindi output"
git push -u origin feat/voice-pipeline
```
Aim for **40–80 commits across the team** by submission - it shows real work.

## 3. Pull requests + cross-review (the key signal)
```bash
gh pr create --fill --base main --head feat/voice-pipeline
# then ANOTHER teammate reviews - never self-merge
gh pr review <num> --approve --body "LGTM, tested the Hindi clip"
gh pr merge <num> --squash --delete-branch
```
**Rule: you may not merge your own PR.** A reviews B, B reviews C, C reviews A.
This alone produces the review trail that wins the prize.

## 4. Issues + board
- File an issue per roadmap task (`gh issue create --title "..." --body "..."`).
- Link PRs to issues: put `Closes #12` in the PR description → auto-closes + links.
- Move cards on the board as you go. A judge glancing at the board sees momentum.

## 5. Actions (CI) - already scaffolded
`.github/workflows/ci.yml` runs install + contract compile on every push/PR. Keep
it green. A passing CI badge in the README is a concrete "we use GitHub" proof.

## 6. README + topics
Strong README (see BUILD_PROMPTS S1). Add repo topics: `hackathon`, `ethereum`,
`gemini`, `elevenlabs`, `sarvam-ai`, `mongodb`. Add a CI badge and the live link.

## 7. In your submission, say it explicitly
One line wins it: *"Built collaboratively across N branches and M reviewed pull
requests with CI on every push - see the commit history and project board."*
Link the Insights → Contributors graph; it visually proves 3-person collaboration.

---

## Exact per-dev cheat sheet (pin this in your group chat)

**Start of every task (all):**
```bash
git checkout main && git pull && git checkout -b feat/<thing>
```
**During work (all):** commit every working chunk with a clear message.
**End of task (all):**
```bash
git push -u origin feat/<thing>
gh pr create --fill --base main
# ping the assigned reviewer in chat
```
**Reviewer (rotate A→B→C→A):**
```bash
gh pr checkout <num>   # pull it, run it locally
gh pr review <num> --approve --body "tested X, works"
gh pr merge <num> --squash --delete-branch
```

### AI prompt to keep your history clean
```
Given these staged changes, write a single conventional-commit message
(type(scope): summary, imperative mood, <72 chars). If the changes span multiple
concerns, tell me how to split them into separate commits instead.
```

### AI prompt for a good PR description
```
Write a GitHub PR description for this branch: a one-line summary, a "What & why"
section, a "How to test" checklist, and a "Closes #<issue>" line. Keep it short.
```

---

## What NOT to do (instant disqualifiers for this prize)
- One person committing everything from one account.
- A single "initial commit" with the whole project.
- Force-pushing over history / squashing everything into one commit at the end.
- Committing `.env` or API keys. (It's in `.gitignore` - keep it that way. If you
  ever leak a key, rotate it immediately, don't just delete the commit.)
