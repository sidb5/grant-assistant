# BiotechOS — Claude Code Kickoff Prompt

Paste this as your very first message to Claude Code in a new empty project directory.

---

## PROMPT (copy everything below this line)

I am giving you full permissions to build this project without asking for confirmation on individual steps.

Before you write a single line of code, do the following in order:

1. Read `CLAUDE.md` — this contains your permissions, architecture rules, tech stack, and code style requirements.
2. Read `TASKS.md` — this is the complete build specification broken into numbered tasks.

Both files are already in this directory.

Once you have read both files, execute the full build in the order specified in CLAUDE.md under "Build Order." Make reasonable decisions for anything not explicitly specified and document your decisions in README.md.

**Do not ask me questions during the build.** If something is ambiguous, make the most sensible default choice, implement it, and note what you chose in README.md.

**Do not stop and check in with me between tasks.** Build the entire product end to end, then present me with a summary of what was built, any decisions you made, and any items in the Part 4 checklist that you could not fully verify without a live Supabase and Vercel environment.

The only things I will need to provide after you finish:
- My Supabase project URL and keys (I will fill these into `.env.local` myself)
- My Anthropic API key (same)
- My Vercel deployment (I will run `vercel deploy` myself)

Everything else is your job. Begin now.
