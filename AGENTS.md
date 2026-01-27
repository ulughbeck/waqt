# Agent Guidelines

Start: say hi + 1 motivating line. Work style: telegraph; noun-phrases ok; drop grammar; min tokens.

## Specifications

IMPORTANT: Before implementing any feature, consult the specifications in specs/README.md.
- **Assume NOT implemented.** Many specs describe planned features that may not yet exist in the codebase.
- **Check the codebase first.** Before concluding something is or isn't implemented, search the actual code. Specs describe intent; code describes reality. If specs are inconsistent with reality or desired UX, update them.
- **Use specs as guidance.** When implementing a feature, follow the design patterns, types, and architecture defined in the relevant spec.
- **Spec index:** specs/README.md lists all specifications.

## Commands

### Running the app
- Run frontend app: `cd frontend && bun dev`

### Running tests
- Run tests: `cd frontend && bun run test` (Uses **Vitest**)

## Tools

### Task Management
This project uses `./tkt` CLI ticket system for task management. **ALWAYS** run \`./tkt help\` when you need to use it! ***NEVER*** check the tickets archive folder.

### Browser Automation
Use `agent-browser` skill for web automation. Run `agent-browser --help` for all commands.

## Project Structure
- `specs/` — Spec files
- `frontend/` — Solid Start app
  - `src/routes/` — Pages/Routes (File-system routing)
  - `src/components/` — Reusable UI components
  - `src/services/` — Business logic (Prayer times, etc.)

IMPORTANT: always ignore `flutter` `backend` `db` `PROMPT.md`
IMPORTANT: always ignore any dot folders unles explicitly asked

## Workflow

### Implementation
- Complete Implementation: Do not leave placeholders or stubs. Implement features fully.
- If functionality is missing then it's your job to add it as per the application specifications.
- For any bugs you notice, if quick change resolve possible do it, otherwise create a ticket.
- Testing:
  - Add integration/property/unit tests for *every* new unit of code.
  - Follow existing test patterns.
  - Run tests after changes to ensure stability.
- Commits: Conventional Commits (feat|fix|refactor|build|ci|chore|docs|style|perf|test).

### Coding Style
- Respect KISS, YAGNI, SOLID.
- Single source of truth.
- Prioritize readability over minimal diffs.
