import subprocess
import sys
import time
import os

AGENTS = [
    ("Connie (Chief of Staff)", "connie_assistant"),
    ("Devin (Software Engineer)", "devin_eng"),
    ("Priscilla (Product Manager)", "priscilla_product"),
    ("Gigi (Creative Copywriter)", "gigi_marketing"),
    ("Marshall (Strategic Researcher)", "marshall_research"),
    ("Vinci (Art Director/Designer)", "vinci_design"),
]

def main():
    processes = []
    print("=" * 60)
    print("      SHIPSTORY ADVERSARIAL MULTI-AGENT ORCHESTRATION SERVER")
    print("=" * 60)
    print("Starting all 6 platform agents concurrently...")

    cwd = os.path.dirname(os.path.abspath(__file__))

    for name, module in AGENTS:
        print(f"[Launcher] Starting {name} process...")
        # Start each agent via `uv run python -m <module>.agent`
        p = subprocess.Popen(
            [sys.executable, "-m", f"{module}.agent"],
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            env={**os.environ, "PYTHONUNBUFFERED": "1"}
        )
        processes.append((name, p))
        time.sleep(0.5) # Slight offset to prevent connection stampede

    print("\nAll agent connections established! Listening for Band network events.")
    print("Press Ctrl+C to stop all agent processes concurrently.\n")

    # Thread to read outputs without blocking
    import threading
    def read_output(name, process):
        try:
            for line in iter(process.stdout.readline, ""):
                print(f"[{name}] {line.strip()}")
        except Exception:
            pass

    threads = []
    for name, p in processes:
        t = threading.Thread(target=read_output, args=(name, p), daemon=True)
        t.start()
        threads.append(t)

    try:
        while True:
            # Check if any process has died
            for name, p in processes:
                code = p.poll()
                if code is not None:
                    print(f"\n[Launcher] WARNING: {name} terminated unexpectedly with exit code {code}.")
                    processes.remove((name, p))
            if not processes:
                print("[Launcher] All agent processes have terminated.")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[Launcher] Interrupt received. Shutting down all agent processes...")
    finally:
        for name, p in processes:
            p.terminate()
            p.wait()
        print("[Launcher] All agent processes stopped cleanly.")

if __name__ == "__main__":
    main()
