if ! command -v deno &>/dev/null; then
  echo "Deno is required. Please install it and try again: https://deno.com/manual/getting_started/installation"
  return 1
fi
cli_location=https://raw.githubusercontent.com/uriva/rmmbr/main/cli/src/index.ts
tmp_rmmbr=$(mktemp)
echo "
if [ \"\$1\" == \"update\" ] || [ \"\$1\" == \"upgrade\" ]; then
  deno cache --reload $cli_location;
  return 0;
fi
export RMMBR_SERVER=https://rmmbr.net;
deno run --allow-write --allow-run --allow-read --allow-net --allow-sys --allow-env $cli_location \"\$@\"
" >$tmp_rmmbr
chmod +x $tmp_rmmbr
sudo mv $tmp_rmmbr /usr/local/bin/rmmbr
echo "rmmbr cli installed. Run \`rmmbr login\`"
