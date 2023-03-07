# safer-scp-rollouts

This project explores a number of ways to make AWS Service Control Policy (SCP)
rollouts safer. It accompanies [a blog post on jSherz.com].

[a blog post on jSherz.com]: https://jsherz.com

## Usage

1. Install NodeJS v18 and enable corepack:

    ```bash
    # any method works, doesn't have to be NVM
    nvm use 18
    
    corepack enable # if not already run
    
    yarn install
    ```

2. Configure AWS credentials and run the examples:

    ```bash
    # any method works
    export AWS_PROFILE=...
    aws sso login

    yarn build
    node dist/
    ```
