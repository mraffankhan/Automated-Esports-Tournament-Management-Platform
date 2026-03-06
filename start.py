import os
import sys
import subprocess

# This points to the src directory
BASE_DIR = os.path.join(os.path.dirname(__file__), "argon", "src")

# Paths to the bot scripts
main_bot_path = os.path.join(BASE_DIR, "bot.py")
private_bot_path = os.path.join(BASE_DIR, "private_bot.py")

print("Starting both Argon and the Private bot...", flush=True)

# Launch both bots concurrently as separate processes
# We use subprocess so their event loops and database connections don't clash.
process1 = subprocess.Popen([sys.executable, main_bot_path])
process2 = subprocess.Popen([sys.executable, private_bot_path])

try:
    # Keep the start.py script running and wait for both processes
    process1.wait()
    process2.wait()
except KeyboardInterrupt:
    print("\nStopping bots...")
    process1.terminate()
    process2.terminate()
    process1.wait()
    process2.wait()
    print("Both bots stopped successfully!")
