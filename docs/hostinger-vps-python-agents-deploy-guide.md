# Hostinger VPS Deployment Guide for ShipStory Python Agents

This guide deploys the Python multi-agent workspace under `agents/` on a Hostinger VPS using `uv` and a `systemd` service.

## 1. Provision the VPS

Use a Linux VPS image, ideally Ubuntu 22.04 or 24.04. Make sure you can SSH in as `root` or a sudo user.

```bash
ssh root@YOUR_SERVER_IP
```

Update the server and install the basics:

```bash
sudo apt update
sudo apt install -y git curl build-essential python3 python3-venv python3-pip
```

## 2. Create a deploy user - NOT DONE

Running the agents as a normal user is cleaner than using `root`.

```bash
sudo adduser shipstory
sudo usermod -aG sudo shipstory
su - shipstory
```

## 3. Clone the repository

Pick a stable deployment directory like `/shipstory`.

```bash
sudo mkdir -p /shipstory
sudo chown -R shipstory:shipstory /shipstory
cd /shipstory
git clone YOUR_REPO_URL .
```

## 4. Install `uv`

The agent workspace is managed with `uv`.

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source "$HOME/.cargo/env"
uv --version
```

If `uv` is already available on your Hostinger image, you can skip this step.

## 5. Install agent dependencies

The Python workspace lives in `agents/`.

```bash
cd /srv/shipstory/agents
uv sync
```

That will create the environment and install the dependencies defined in `agents/pyproject.toml`.

## 6. Create the `.env` file

The agent modules load environment variables from `agents/.env`, so place the file there.

```bash
cd /srv/shipstory/agents
nano .env
```

A practical starting point is:

```env
# Band runtime
BAND_WS_URL=wss://app.band.ai/api/v1/socket/websocket
BAND_REST_URL=https://app.band.ai/

# LLM provider for shared/llm_provider.py
AIML_API_KEY=your_key_here
AIML_API_BASE=https://api.aimlapi.com/v1
AIML_MODEL=gpt-4o

# Optional alternatives if you use them instead of AIML
# OPENAI_API_KEY=your_key_here
# OPENAI_API_BASE=https://api.openai.com/v1
# GROQ_API_KEY=your_key_here
# FEATHERLESS_API_KEY=your_key_here

# Shared integrations used by the agents
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
CLOUDINARY_FOLDER=shipstory
TAVILY_API_KEY=your_tavily_key
MONGODB_URI=your_mongo_connection_string
```

Only set the provider keys you actually use. The code in `agents/shared/llm_provider.py` will pick the first configured provider in its priority order.

## 7. Smoke test manually

Before turning it into a service, run the orchestrator once from the terminal:

```bash
cd /shipstory/agents
uv run python run_agents.py
```

You should see all six agent processes start and connect to Band. Stop it with `Ctrl+C` after confirming there are no startup errors.

## 8. Run it with `systemd`

Create a dedicated service so the agents restart on reboot.

```bash
sudo nano /etc/systemd/system/shipstory-agents.service
```

Use this service file:

```ini
[Unit]
Description=ShipStory Python Agents
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=shipstory
WorkingDirectory=/root/shipstory/agents
EnvironmentFile=/root/shipstory/agents/.env
ExecStart=/home/shipstory/.local/bin/uv run python run_agents.py
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

If `uv` lives somewhere else on your VPS, update the `ExecStart` path accordingly.

Then enable the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable shipstory-agents
sudo systemctl start shipstory-agents
sudo systemctl stop shipstory-agents
sudo systemctl status shipstory-agents
```

## 9. Check logs

Use `journalctl` to watch startup and runtime logs:

```bash
sudo journalctl -u shipstory-agents -f
```

## 10. Update workflow

For future deployments:

```bash
cd /srv/shipstory
git pull
cd agents
uv sync
sudo systemctl restart shipstory-agents
```

## 11. Common issues

- If the service starts but no agents connect, verify `BAND_WS_URL` and `BAND_REST_URL`.
- If model calls fail, confirm the correct provider key is present for the provider selected in `agents/shared/llm_provider.py`.
- If Cloudinary uploads fail, check the `CLOUDINARY_*` variables.
- If Band or API credentials changed, restart the service after updating `.env`.

## Recommended setup notes

- Keep `agents/.env` readable only by the deploy user.
- Put the repository behind a private Git remote if the VPS is publicly reachable.
- If you also deploy the web app on the same VPS, run it as a separate service rather than inside the agent process.
