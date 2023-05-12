if ! command -v npx &>/dev/null; then
  echo "npx is not installed. Please install npx and try again."
  exit 1
fi
echo "npx deno-bin run --allow-read --allow-sys --allow-env=RMMBR_SERVER,HOME https://raw.githubusercontent.com/uriva/rmmbr/main/cli/src/index.ts --RMMBR_SERVER=https://uriva-rmmbr.deno.dev" >rmmbr
chmod +x rmmbr
sudo mv rmmbr /usr/local/bin/
echo "rmmbr cli installed. Restart your terminal and run \`rmmbr login\`"
