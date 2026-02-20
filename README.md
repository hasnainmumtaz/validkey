# validkey

A small CLI that checks whether an API key is valid for services like OpenAI. It does one minimal, read-only request (e.g. list models) and reports valid or invalid with the right exit code for scripts.

**Requirements:** Node.js 18 or later.

## Install

**From npm (recommended):**

```bash
npm install -g validkey
```

Or run once without installing:

```bash
npx validkey openai
```

**From source:**

```bash
git clone https://github.com/hasnainmumtaz/validkey.git validkey
cd validkey
npm install
npm run build
npm link
```

After `npm link`, the `validkey` command is available globally. To uninstall later, run `npm unlink -g validkey` from the project folder.

## Usage

```bash
validkey <service> [key]
```

- **`validkey <service> <key>`** – Check the given key for that service.
- **`validkey <service>`** – Use the key from the environment (e.g. `OPENAI_API_KEY` for `openai`). Fails with a clear error if the variable is missing.

### Options

| Option | Description |
|--------|-------------|
| `-q`, `--quiet` | Only exit code; no output (for scripts). |
| `-h`, `--help` | Show usage and supported services. |

### Examples

```bash
# Check an OpenAI key passed as an argument
validkey openai sk-your-key-here

# Check using OPENAI_API_KEY from the environment
validkey openai

# Script-friendly: only exit code
validkey openai --quiet
if validkey openai -q; then echo "Key is valid"; fi
```

### Exit codes

| Code | Meaning |
|------|--------|
| `0` | Key is valid. |
| `1` | Key is invalid, service unknown, or key missing (e.g. env var not set). |

### Supported services

| Service | CLI name | Env variable |
|---------|----------|--------------|
| OpenAI | `openai` | `OPENAI_API_KEY` |

More services can be added; see the `codebase/` folder for how the tool is structured and how to add new validators.