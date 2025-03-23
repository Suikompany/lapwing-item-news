ARG VARIANT="22-bookworm"
FROM mcr.microsoft.com/devcontainers/javascript-node:${VARIANT}

# Install pnpm
RUN su node -c "npm install -g pnpm@10"

# Install Terraform
RUN wget -O - https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list \
  && sudo apt update && sudo apt install terraform
