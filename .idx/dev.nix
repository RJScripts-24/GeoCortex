{ pkgs, ... }: {
  channel = "stable-24.05"; # Updates to the latest stable channel
  packages = [
    pkgs.python311
    pkgs.python311Packages.pip
    pkgs.nodejs_20
    pkgs.nodePackages.nodemon
    pkgs.google-cloud-sdk
  ];
  idx = {
    extensions = [
      "ms-python.python"
      "rangav.vscode-thunder-client"
    ];
    workspace = {
      onCreate = {
        install = "pip install -r requirements.txt";
      };
    };
  };
}