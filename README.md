# Notation Action 

> `notation-action` is a GitHub Action that installs and configures the [Notation](https://github.com/notaryproject/notation) CLI for digitally signing Open Container Initiative (OCI) compliant artifacts.

## Usage

Setup the `notation` CLI:

```
steps:
- uses: notaryproject/notation-action@v1.0.0
```

A specific version of the `notation` CLI can be installed:

```
steps:
- uses: notaryproject/notation-action@v1.0.0
  with:
    version: 1.0.0-rc.7
```

A [plugin for Azure Key Vault](https://github.com/Azure/notation-azure-kv) can be added to the `notation` CLI:

```
steps:
  - name: Setup Notation with azure-kv plugin
  - uses: notaryproject/notation-action@v1.0.0 
    with:
      version: 1.0.0-rc.7
      key_name: example
      certificate_key_id: https://rg-kv.vault.azure.net/keys/certname/2c12753ba2b44646bd27d4d447020018
      plugin_name: notation-azure-kv
      plugin_version:  0.6.0 
```

## Inputs

The actions supports the following inputs:
- `version`: The version of the `notation` to install, defaulting to `1.0.0-rc.1`
- `key_name`: The name of the signing key that is added to Notation, defaulting to `example`
- `certificate_key_id`: The key identifer for the signing certificate located within a key management service, such as Azure Key Vault, AWS Secrets Manager, and GCP Cloud Key Management.
- `plugin_name`: The name of the `notation` plugin to install
- `plugin_version`: The version of the `notation` plugin to install.
