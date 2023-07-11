# Notation Action
Github Action for `notation setup`, `notation sign` and `notation verify`.
# Usage
1. notation-verify:
    ```sh
    - name: verify released artifact
      uses: notaryproject/notation-action/verify@main
      with:
        target_artifact_reference: <target_artifact_reference_in_remote_registry>
        trust_policy_filepath: <file_path_to_user_defined_trustpolicy.json>
        trust_store_dir: <dir_to_user_trust_store>
    ```
   For example,
    ```sh
    - name: verify released artifact
      uses: notaryproject/notation-action/verify@main
      with:
        target_artifact_reference: myRegistry.azurecr.io/myRepo@sha256:aaabbb
        trust_policy_filepath: .github/trustpolicy/trustpolicy.json
        trust_store_dir: .github/truststore
    ```
    where `.github/truststore` MUST be in following structure:
    ```
    .github/truststore
      |- trust_store1
          |- certificate1
          |- certificate2
      |- trust_store2
          |- certificate3
          |- certificate4
    ```