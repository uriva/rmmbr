# set -e

# Download the latest binary executable from GitHub.
wget https://github.com/uriva/rmmbr/releases/download/latest/cli

# Place the binary executable in the user's $HOME/bin directory.
mv cli $HOME/bin/rmmbr

# Make the binary executable executable.
chmod +x $HOME/bin/rmmbr

echo "rmmbr cli installed. Run \`rmmbr login\`"
