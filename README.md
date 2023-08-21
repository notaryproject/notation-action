# Notation Github Actions
Github Actions for [Notation](https://notaryproject.dev/).

Supported actions: `Notation: Setup`, `Notation: Sign` and `Notation: Verify`.

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
    version: "1.0.0"
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
    plugin_config: <list_of_plugin_defined_configs>
    allow_referrers_api: <boolean_flag_for_referrers_api>
```
For example,
```yaml
- name: sign releasd artifact with notation-azure-kv plugin
  uses: notaryproject/notation-action/sign@main
  with:
    plugin_name: azure-kv
    plugin_url: https://github.com/Azure/notation-azure-kv/releases/download/v1.0.0/notation-azure-kv_1.0.0_linux_amd64.tar.gz
    plugin_checksum: 82d4fee34dfe5e9303e4340d8d7f651da0a89fa8ae03195558f83bb6fa8dd263
    key_id: https://testnotationakv.vault.azure.net/keys/notationLeafCert/c585b8ad8fc542b28e41e555d9b3a1fd
    target_artifact_reference: myRegistry.azurecr.io/myRepo@sha256:aaabbb
    signature_format: cose
    plugin_config: |-
      ca_certs=.github/cert-bundle/cert-bundle.crt
      self_signed=false
```
Example of using the [Referrers API](https://github.com/opencontainers/distribution-spec/blob/v1.1.0-rc.3/spec.md#listing-referrers),
```yaml
- name: sign releasd artifact with notation-azure-kv plugin
  uses: notaryproject/notation-action/sign@main
  env:
    NOTATION_EXPERIMENTAL: 1  # this is requried by Notation to use Referrers API
  with:
    allow_referrers_api: 'true'
    plugin_name: azure-kv
    plugin_url: https://github.com/Azure/notation-azure-kv/releases/download/v1.0.0/notation-azure-kv_1.0.0_linux_amd64.tar.gz
    plugin_checksum: 82d4fee34dfe5e9303e4340d8d7f651da0a89fa8ae03195558f83bb6fa8dd263
    key_id: https://testnotationakv.vault.azure.net/keys/notationLeafCert/c585b8ad8fc542b28e41e555d9b3a1fd
    target_artifact_reference: myRegistry.azurecr.io/myRepo@sha256:aaabbb
    signature_format: cose
    plugin_config: |-
      ca_certs=.github/cert-bundle/cert-bundle.crt
      self_signed=false
```

### Notation: Verify
```yaml
- name: verify released artifact
  uses: notaryproject/notation-action/verify@main
  with:
    target_artifact_reference: <target_artifact_reference_in_remote_registry>
    trust_policy: <file_path_to_user_defined_trustpolicy.json>
    trust_store: <dir_to_user_trust_store>
    allow_referrers_api: <boolean_flag_for_referrers_api>
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
`.github/trustpolicy/trustpolicy.json` MUST follow the Notation [trust policy specs](https://github.com/notaryproject/specifications/blob/v1.0.0-rc.2/specs/trust-store-trust-policy.md#trust-policy).

`.github/truststore` MUST follow the Notation [trust store specs](https://github.com/notaryproject/specifications/blob/v1.0.0-rc.2/specs/trust-store-trust-policy.md#trust-store). For example,
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
Example of using the [Referrers API](https://github.com/opencontainers/distribution-spec/blob/v1.1.0-rc.3/spec.md#listing-referrers),
```yaml
- name: verify released artifact
  uses: notaryproject/notation-action/verify@main
  env:
    NOTATION_EXPERIMENTAL: 1  # this is requried by Notation to use Referrers API
  with:
    allow_referrers_api: 'true'
    target_artifact_reference: myRegistry.azurecr.io/myRepo@sha256:aaabbb
    trust_policy: .github/trustpolicy/trustpolicy.json
    trust_store: .github/truststore
```