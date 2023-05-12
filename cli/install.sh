if ! command -v npx &>/dev/null; then
  echo "npx is not installed. Please install npx and try again."
  exit 1
fi
cli_location=https://raw.githubusercontent.com/uriva/rmmbr/main/cli/src/index.ts
echo "export RMMBR_SERVER=https://uriva-rmmbr.deno.dev; npx deno-bin run --allow-run --allow-read --allow-net --allow-sys --allow-env $cli_location \"\$@\"" >rmmbr
chmod +x rmmbr
sudo mv rmmbr /usr/local/bin/
echo "rmmbr cli installed. Run \`rmmbr login\`"
