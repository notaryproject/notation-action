# GitHub Actions for Notation

This repository contains the implementation of [GitHub Actions](https://docs.github.com/en/actions) for [Notation](https://notaryproject.dev/). It provides multiple actions for signing and verifying OCI artifacts with Notation in CI/CD. This project is still in early development status.

The following three actions are available:

- `setup`: Install Notation
- `sign`: Sign an OCI artifact with a specified plugin
- `verify`: Verify a signature

> **Note** The Notary Project documentation is available [here](https://notaryproject.dev/docs/). You can also find the Notary Project [README](https://github.com/notaryproject/.github/blob/main/README.md) to learn about the overall Notary Project.

## Usage

### Notation: Setup
```yaml
- name: setup Notation CLI
  uses: notaryproject/notation-action/setup@main
  with:
    version: <version_of_official_Notation_CLI_release>
    url: <url_of_customized_Notation_CLI>
    checksum: <SHA256_of_the_customized_Notation_CLI>
```
For example,
```yaml
- name: setup Notation CLI
  uses: notaryproject/notation-action/setup@main
  with:
    version: 1.0.0-rc.7
```

### Notation: Sign
```yaml
- name: sign releasd artifact with signing plugin
  uses: notaryproject/notation-action/sign@main
  with:
    plugin_name: <notation_signing_plugin_name>
    plugin_url: <plugin_download_url>
    plugin_checksum: <SHA256_of_the_signing_plugin>
    key_id: <key_identifier_to_sign>
    target_artifact_reference: <target_artifact_reference_in_remote_registry>
    signature_format: <signature_envelope_format>
    plugin_config: <plugin_defined_config>
```
For example,
```yaml
- name: sign releasd artifact with notation-azure-kv plugin
  uses: notaryproject/notation-action/sign@main
  with:
    plugin_name: azure-kv
    plugin_url: https://github.com/Azure/notation-azure-kv/releases/download/v1.0.0-rc.2/notation-azure-kv_1.0.0-rc.2_linux_amd64.tar.gz
    plugin_checksum: 4242054463089f4b04019805f2c009267dbcc9689e386bc88d3c4fc4E095e52c
    key_id: https://testnotationakv.vault.azure.net/keys/notationLeafCert/c585b8ad8fc542b28e41e555d9b3a1fd
    target_artifact_reference: myRegistry.azurecr.io/myRepo@sha256:aaabbb
    signature_format: cose
    plugin_config: ca_certs=.github/cert-bundle/cert-bundle.crt
```
### Notation: Verify
```yaml
- name: verify released artifact
  uses: notaryproject/notation-action/verify@main
  with:
    target_artifact_reference: <target_artifact_reference_in_remote_registry>
    trust_policy: <file_path_to_user_defined_trustpolicy.json>
    trust_store: <dir_to_user_trust_store>
```

For example,
```yaml
- name: verify released artifact
  uses: notaryproject/notation-action/verify@main
  with:
    target_artifact_reference: myRegistry.azurecr.io/myRepo@sha256:aaabbb
    trust_policy: .github/trustpolicy/trustpolicy.json
    trust_store: .github/truststore
```

where `.github/truststore` MUST follow the Notation [trust store specs](https://github.com/notaryproject/notaryproject/blob/main/specs/trust-store-trust-policy.md#trust-store).

For example,
```
.github/truststore
└── x509
    ├── ca
    │   └── <my_trust_store1>
    │       ├── <my_certificate1>
    │       └── <my_certificate2>
    └── signingAuthority
        └── <my_trust_store2>
            ├── <my_certificate3>
            └── <my_certificate4>
```