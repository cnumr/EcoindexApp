#!/bin/bash
# NOT USED
echo "Ask which node launched..."
unset npm_config_prefix > /dev/null 2>&1
[[ -f ~/.zshrc ]] && source ~/.zshrc > /dev/null 2>&1

# must be the last row
which node