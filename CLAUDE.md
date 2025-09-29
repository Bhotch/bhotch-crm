- Check Claude Code MCP connections
claude mcp list && claude mcp test github && claude mcp test vercel

# Verify Vercel deployment and build status  
vercel ls && vercel logs --since=1h

# Test live application endpoints
curl -I https://[your-app].vercel.app/api/health
curl -I https://script.google.com/macros/s/[script-id]/exec?action=test

# Check GitHub commit synchronization
git log --oneline -5 && git status
- Check Claude Code MCP connections
claude mcp list && claude mcp test github && claude mcp test vercel

# Verify Vercel deployment and build status  
vercel ls && vercel logs --since=1h

# Test live application endpoints
curl -I https://[your-app].vercel.app/api/health
curl -I https://script.google.com/macros/s/[script-id]/exec?action=test

# Check GitHub commit synchronization
git log --oneline -5 && git status