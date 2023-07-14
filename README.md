# Notation Action
Github Action for `setup notation`, `notation sign` and `notation verify`.
# Usage
1. notation-verify:
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