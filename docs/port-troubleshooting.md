# Port Already in Use (8787)

If you see `[ERROR] Address already in use (127.0.0.1:8787)`:
- Find the process using the port: `lsof -i :8787`
- Kill the process: `kill <PID>` (use PID from lsof output)
- Or force kill if needed: `kill -9 <PID>`
- Check for zombie Wrangler processes: `ps aux | grep wrangler`
