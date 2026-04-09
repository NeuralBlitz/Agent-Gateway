{ pkgs }: {
  channel = "stable-24_05";
  deps = [
    pkgs.python312Packages.pytest_7
    pkgs.fish
    pkgs.zsh
    pkgs.tree
    pkgs.bottom
    pkgs.htop-vim
    pkgs.nodejs-slim
  ];
}
