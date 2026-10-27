---
name: create-instructions
description: Use this skill to automatically generate markdown architecture instructions for the /docs directory and update AGENT.md.
---

# Instruction Generation Routine
When the user asks to document an architectural layer, look at the input provided. 

1. Generate a concise, clear agent instruction `.md` file inside the `/docs` directory.
2. If the user provided a specific filename, use it. Otherwise, create an appropriate filename based on the content.
3. Automatically update the `AGENT.md` file in the workspace root to register the new or modified instruction file.
4. If the user didn't supply context, prompt them to describe the layer of architecture or coding standards they want to document.
