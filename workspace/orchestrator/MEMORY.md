# MEMORY.md - Orchestrator Long-Term Memory

## Key Learnings - April 27, 2026

### Successful Specialist Agent Routing and Spawning
- Confirmed that the orchestrator can successfully route to specialist agents based on intent
- Social-media agent routing works for "create posts" type requests
- Personality agent routing works for tone/voice/personality requests
- Each agent maintains independence by loading its own workspace and configuration

### Technical Solutions Discovered
1. **Model Restriction Workaround**: When `openrouter/nvidia/nemotron-3-super-120b-a12b:free` is blocked, use `openrouter/auto` as a functional alternative
2. **Session Spawning Protocol**: Proper use of `sessions_spawn` tool with correct parameters enables agent creation
3. **Workspace Isolation**: Each agent correctly loads its own SOUL.md/AGENTS.md from its dedicated workspace

### Workflow Verification
- Social-media agent completed full 10-step Standard Workflow for Hare Krishna community content
- Personality agent successfully spawned and ready to assist with tone/voice/messaging
- All agents accessed their respective workspaces:
  * Social-media: `/home/node/.openclaw/workspace/social-media/`
  * Personality: `/home/node/.openclaw/workspace/personality/`

### Future Session Guidance
If returning after time away and experiencing routing issues:
1. Check agent workspace existence: `/home/node/.openclaw/workspace/[agent-name]/`
2. Try spawning with `openrouter/auto` model if specific models are blocked
3. Verify each agent loads its own configuration files on startup
4. Refer to detailed session notes in `memory/2026-04-27.md`

This confirms the OpenClaw routing system functions correctly when properly configured and agents are accessible.