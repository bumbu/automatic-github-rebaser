#!/usr/bin/env bash

log_file="/Users/alexandrt/Development/rebaser/rebase.log"

# Log both to screen and file (both logs and errors)
exec > >(tee -a $log_file) 2>&1

printf "\n\n\n\n===\n" >>$log_file

# make sure this is a Git directory
if [[ (-z $(git rev-parse HEAD 2>>$log_file)) ]]; then
    echo "$PWD is not a Git repository"
    [[ "$0" = "$BASH_SOURCE" ]] && exit 2 || return 2
fi


ret_code=0
base=$1
target=$2
current=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
failed_in=0

echo "Current is $current"
echo "Start rebasing $target from $base"

# abort any rebase in progress
if [[ (-z $(git rebase --abort)) ]]; then
    echo "No rebase in progress"
else
    echo "Canceled a rebase in progress"
fi

git_rebase_command="git rebase $base"
git_delete_branch_command="git branch -D $target"
git_commands=(
    # Sync base branch
    "git fetch origin $base -f"
    "git checkout $base"
    "git pull -f"

    # Sync target branch
    "$git_delete_branch_command"
    "git fetch origin $target -f"
    "git checkout $target"

    # Rebase
    "$git_rebase_command"

    # Push back
    "git push -f"
)

# Iterate through commands
for git_command in "${git_commands[@]}"; do
    echo "$git_command"
    $git_command

    if [[ ("$?" -ne "0") ]]; then
        # Filter for branch delete
        # TODO should be somehow defined in the commands list
        if [ "$git_command" != "$git_delete_branch_command" ]; then
            echo "`$git_command failed`"
            failed_in=$git_command
            ret_code=1
            break
        fi
    fi
done

# Abort rebase if it failed
if [ "$failed_in" = "$git_rebase_command" ]; then
    echo "Aborting the rebase"
    git rebase --abort
    if [[ ("$?" -ne "0") ]]; then
        echo "Aborting rebase failed"
    fi
fi

if [[ (! -z "$current") ]]; then
    echo "Switching to $current"
    git checkout "$current" &>/dev/null
fi

[[ "$0" = "$BASH_SOURCE" ]] && exit "$ret_code" || return "$ret_code"
