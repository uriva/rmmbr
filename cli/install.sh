set -e
cli_location=https://raw.githubusercontent.com/uriva/rmmbr/main/cli/src/index.ts
script_desired_location=/usr/local/bin/rmmbr
echo "
set -e
if ! command -v deno &>/dev/null;
then
  echo "Deno is required. Please install it and try again: https://deno.com/manual/getting_started/installation"
  exit
fi
if [ \"\$1\" == \"update\" ] || [ \"\$1\" == \"upgrade\" ];
then
  deno cache --reload $cli_location;
else
  export RMMBR_SERVER=https://rmmbr.net;
  deno run --allow-write --allow-run --allow-read --allow-net --allow-sys --allow-env $cli_location \"\$@\"
fi
" >$script_desired_location
chown $SUDO_USER $script_desired_location
chmod u+x $script_desired_location
echo "rmmbr cli installed. Run \`rmmbr login\`"
