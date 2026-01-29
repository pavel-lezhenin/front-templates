# 🖥️ Terminal Management Rules

## ⚠️ CRITICAL: Minimize Terminal Creation

**Default behavior: NEVER create new terminals unnecessarily!**

## 📋 Rules

### ❌ FORBIDDEN:
```bash
# Creating new terminal for simple commands
run_in_terminal("pnpm dev", isBackground=false)  # ❌ Uses existing or creates new

# Multiple terminals for sequential operations
run_in_terminal("pnpm install")  # ❌
run_in_terminal("pnpm build")    # ❌
```

### ✅ CORRECT:
```bash
# Use existing terminal with compound commands
run_in_terminal("pnpm install && pnpm build")  # ✅ One terminal

# Check what's already running
terminal_last_command()  # ✅ Before creating new
```

## 🎯 When to Create New Terminal

**ONLY** create new terminal when:
1. **Background process needed** - dev server, watch mode
2. **Parallel execution required** - build + test simultaneously  
3. **Different working directory** - but prefer `cd && command` first

### Background Process Pattern:
```bash
# ✅ Acceptable - dev server runs in background
run_in_terminal("pnpm dev", isBackground=true)
```

## 🔍 Before ANY Terminal Command

**Checklist:**
1. ✅ Check `terminal_last_command()` - is there active terminal?
2. ✅ Is existing terminal in correct directory?
3. ✅ Can I chain commands instead of new terminal?
4. ✅ Is this REALLY a background task?

## 📊 Terminal Limit

**Maximum terminals in typical session: 2-3**
- 1 for dev server (background)
- 1 for commands (reuse)
- 1 for parallel task (rare)

## 🚫 Anti-Patterns

- Creating terminal for every command
- Not checking existing terminals
- Forgetting isBackground=true for servers
- Not using command chaining

## ✅ Best Practices

1. **Reuse terminals** - one terminal for all non-background commands
2. **Chain commands** - `cd dir && cmd1 && cmd2`
3. **Check first** - always `terminal_last_command()` before creating
4. **Background wisely** - only dev servers, watchers, long-running tasks

---

**Remember: Every new terminal = context switching overhead! 🎯**