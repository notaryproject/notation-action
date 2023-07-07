# Notation Action
# Usage
1. notation-verify:
    ```sh
    - name: verify released image
      uses: notaryproject/notation-action/verify@main
      with:
        target_artifact_reference: <target_artifact_reference_in_remote_registry>
        trust_policy_filepath: <file_path_to_user_defined_trustpolicy.json>
        trust_store_name: <user_chosen_ca_trust_store_name>
        trust_certificate_path: <path_to_user_trust_certificate>
    ```
   An example:
    ```sh
    - name: verify released image
      uses: notaryproject/notation-action/verify@main
      with:
        target_artifact_reference: myRegistry.azurecr.io/myRepo@sha256:aaabbb
        trust_policy_filepath: .github/trustpolicy/trustpolicy.json
        trust_store_name: myTrustStore
        trust_certificate_path: .github/truststore/root.crt
    ```