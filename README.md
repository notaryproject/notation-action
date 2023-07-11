# Notation Action
Github Action for `notation setup`, `notation sign` and `notation verify`.
# Usage
1. notation-sign
    ```sh
    - name: sign releasd artifact with signing plugin
      uses: notaryproject/notation-action/sign@main
      with:
        plugin_name: <notation_signing_plugin_name>
        plugin_url: <plugin_download_url>
        key_id: <key_identifier_to_sign>
        target_artifact_reference: <target_artifact_reference_in_remote_registry>
        plugin_config: <plugin_defined_config>
    ```
    For example,
    ```sh
    - name: sign releasd artifact with notation-azure-kv plugin
      uses: notaryproject/notation-action/sign@main
      with:
        plugin_name: azure-kv
        plugin_url: https://github.com/Azure/notation-azure-kv/releases/download/v1.0.0-rc.2/notation-azure-kv_1.0.0-rc.2_linux_amd64.tar.gz
        plugin_checksum: 4242054463089F4b04019805f2c009267dbcc9689e386BC88d3c4fc4E095e52c
        key_id: https://testnotationakv.vault.azure.net/keys/notationLeafCert/c585b8ad8fc542b28e41e555d9b3a1fd
        target_artifact_reference: myRegistry.azurecr.io/myRepo@sha256:aaabbb
        plugin_config: ca_certs=.github/cert-bundle/cert-bundle.crt
    ```