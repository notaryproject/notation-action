# GitHub Actions for Notation

This repository contains the implementation of [GitHub Actions](https://docs.github.com/en/actions) for [Notation](https://github.com/notaryproject/notation). It provides actions for signing and verifying OCI artifacts with Notation in CI/CD.

The following three actions are available:

- `setup`: Install Notation
- `sign`: Sign OCI artifacts with a specified Notation plugin
- `verify`: Verify signatures with Notation trust store and trust policy

> [!NOTE]
> The Notary Project documentation is available [here](https://notaryproject.dev/docs/). You can also find the Notary Project [README](https://github.com/notaryproject/.github/blob/main/README.md) to learn about the overall Notary Project.

## Usage

Signing an image relies on a Notation plugin, such as [AWS Signer plugin for Notation](https://docs.aws.amazon.com/signer/latest/developerguide/Welcome.html), [Azure Key Vault for Notation](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-tutorial-sign-build-push), [HashiCorp Vault plugin](https://github.com/notaryproject/notation-hashicorp-vault/pulls). 

Currently, [Azure Key Vault plugin for Notation](https://github.com/Azure/notation-azure-kv) has been well tested in the Notation Github Actions by the sub-project maintainers. See this [doc](https://github.com/notation-playground/notation-integration-with-ACR-and-AKV/blob/main/sign-action.md) for hands-on steps if you want to use Notation with the AKV plugin. You can submit test cases and examples for other plugins here.

### Notation Setup

```yaml
- name: setup Notation CLI
  uses: notaryproject/notation-action/setup@v1
  with:
    version: <version_of_official_Notation_CLI_release>
    url: <url_of_customized_Notation_CLI>
    checksum: <SHA256_of_the_customized_Notation_CLI>
```

<details>

<summary>See an example (Click here).</summary>

```yaml
- name: setup Notation CLI
  uses: notaryproject/notation-action/setup@v1
  with:
    version: "1.2.0"
```

</details>

### Notation Sign

```yaml
- name: sign releasd artifact with signing plugin
  uses: notaryproject/notation-action/sign@v1
  with:
    plugin_name: <notation_signing_plugin_name>
    plugin_url: <plugin_download_url>
    plugin_checksum: <SHA256_of_the_signing_plugin>
    key_id: <key_identifier_to_sign>
    target_artifact_reference: <list_of_target_artifact_references_in_remote_registry>
    signature_format: <signature_envelope_format>
    plugin_config: <list_of_plugin_defined_configs>
    allow_referrers_api: <boolean_flag_for_referrers_api>
    timestamp_url: <timestamp_authority_url>
    timestamp_root_cert: <timestamp_authority_root_cert_filepath>
```

<details>

<summary>See an example (Click here).</summary>

```yaml
- name: sign releasd artifact with notation-azure-kv plugin
  uses: notaryproject/notation-action/sign@v1
  with:
    plugin_name: azure-kv
    plugin_url: https://github.com/Azure/notation-azure-kv/releases/download/v1.2.0/notation-azure-kv_1.2.0_linux_amd64.tar.gz
    plugin_checksum: 06bb5198af31ce11b08c4557ae4c2cbfb09878dfa6b637b7407ebc2d57b87b34
    key_id: https://testnotationakv.vault.azure.net/keys/notationLeafCert/c585b8ad8fc542b28e41e555d9b3a1fd
    target_artifact_reference: |-
      myRegistry.azurecr.io/myRepo@sha256:aaabbb
      myOtherRegistry.azurecr.io/myOtherRepo@sha256:cccddd
    signature_format: cose
    plugin_config: |-
      ca_certs=.github/cert-bundle/cert-bundle.crt
      self_signed=false
    timestamp_url: http://timestamp.digicert.com
    timestamp_root_cert: .github/DigiCertTSARootSHA384.cer
```

Example of using the [Referrers API](https://github.com/opencontainers/distribution-spec/blob/v1.1.0-rc.3/spec.md#listing-referrers) in signing:

```yaml
- name: sign releasd artifact with notation-azure-kv plugin
  uses: notaryproject/notation-action/sign@v1
  env:
    NOTATION_EXPERIMENTAL: 1  # this is required by Notation to use Referrers API
  with:
    allow_referrers_api: 'true'
    plugin_name: azure-kv
    plugin_url: https://github.com/Azure/notation-azure-kv/releases/download/v1.2.0/notation-azure-kv_1.2.0_linux_amd64.tar.gz
    plugin_checksum: 06bb5198af31ce11b08c4557ae4c2cbfb09878dfa6b637b7407ebc2d57b87b34
    key_id: https://testnotationakv.vault.azure.net/keys/notationLeafCert/c585b8ad8fc542b28e41e555d9b3a1fd
    target_artifact_reference: |-
      myRegistry.azurecr.io/myRepo@sha256:aaabbb
      myOtherRegistry.azurecr.io/myOtherRepo@sha256:cccddd
    signature_format: cose
    plugin_config: |-
      ca_certs=.github/cert-bundle/cert-bundle.crt
      self_signed=false
    timestamp_url: http://timestamp.digicert.com
    timestamp_root_cert: .github/DigiCertTSARootSHA384.cer
```

</details>

### Notation Verify

```yaml
- name: verify released artifact
  uses: notaryproject/notation-action/verify@v1
  with:
    target_artifact_reference: <list_of_target_artifact_references_in_remote_registry>
    trust_policy: <file_path_to_user_defined_trustpolicy.json>
    trust_store: <dir_to_user_trust_store>
    allow_referrers_api: <boolean_flag_for_referrers_api>
```

<details>

<summary>See an example (Click here).</summary>

```yaml
- name: verify released artifact
  uses: notaryproject/notation-action/verify@v1
  with:
    target_artifact_reference: |-
      myRegistry.azurecr.io/myRepo@sha256:aaabbb
      myOtherRegistry.azurecr.io/myOtherRepo@sha256:cccddd
    trust_policy: .github/trustpolicy/trustpolicy.json
    trust_store: .github/truststore
```

> [!NOTE]
> - `.github/trustpolicy/trustpolicy.json` MUST follow the Notation [trust policy specs](https://github.com/notaryproject/specifications/blob/v1.0.0/specs/trust-store-trust-policy.md#trust-policy).
> - `.github/truststore` MUST follow the Notation [trust store specs](https://github.com/notaryproject/specifications/blob/v1.0.0/specs/trust-store-trust-policy.md#trust-store). See an example of trust store below.
 
```
.github/truststore
└── x509
    ├── ca
    │   └── <my_trust_store1>
    │       ├── <my_certificate1>
    │       └── <my_certificate2>
    ├── signingAuthority
    |   └── <my_trust_store2>
    |       ├── <my_certificate3>
    |       └── <my_certificate4>
    └── tsa
        └── <tsa_trust_store>
            ├── <tsa_certificate1>
            └── <tsa_certificate2>
```

Example of using the [Referrers API](https://github.com/opencontainers/distribution-spec/blob/v1.1.0-rc.3/spec.md#listing-referrers) in verification:

```yaml
- name: verify released artifact
  uses: notaryproject/notation-action/verify@v1
  env:
    NOTATION_EXPERIMENTAL: 1  # this is required by Notation to use Referrers API
  with:
    allow_referrers_api: 'true'
    target_artifact_reference: |-
      myRegistry.azurecr.io/myRepo@sha256:aaabbb
      myOtherRegistry.azurecr.io/myOtherRepo@sha256:cccddd
    trust_policy: .github/trustpolicy/trustpolicy.json
    trust_store: .github/truststore
```

</details>

## Authentication

To sign and verify an image stored in the private registry with Notation GitHub Actions, you need to authenticate with the registry and KMS (Key Management Service). See the following authentication options for references. 

### Registry authentication

- Use [Docker login GitHub Action](https://github.com/marketplace/actions/docker-login).
- Use vendor-based login GitHub Action, such as [Amazon ECR "Login" Action for GitHub Actions](https://github.com/marketplace/actions/amazon-ecr-login-action-for-github-actions), [GitHub Action for Azure Login](https://github.com/marketplace/actions/azure-login) or [Azure Container Registry Login GitHub Actions](https://github.com/marketplace/actions/azure-container-registry-login).

### KMS authentication

If your signing key and certificate are stored in a KMS, make sure to authenticate with the KMS before signing the image in your GitHub Actions workflow.
