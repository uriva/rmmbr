if ! command -v deno &>/dev/null; then
  echo "Deno is not installed. Please install it and try again."
  exit 1
fi
cli_location=https://raw.githubusercontent.com/uriva/rmmbr/main/cli/src/index.ts
tmp_rmmbr=$(mktemp)
echo "
if [ \"$1\" == \"update\" ] || [ \"$1\" == \"upgrade\" ]; then
  deno cache --reload $cli_location
fi
export RMMBR_SERVER=https://uriva-rmmbr.deno.dev;
deno run --allow-run --allow-read --allow-net --allow-sys --allow-env $cli_location \"\$@\"
" >$tmp_rmmbr
chmod +x $tmp_rmmbr
sudo mv $tmp_rmmbr /usr/local/bin/rmmbr
echo "rmmbr cli installed. Run \`rmmbr login\`"
