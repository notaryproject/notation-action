package main

import (
	"encoding/json"
	"os"

	"github.com/notaryproject/notation-go/plugin/proto"
	"github.com/spf13/cobra"
)

func getMetadataCommand() *cobra.Command {
	return &cobra.Command{
		Use:  string(proto.CommandGetMetadata),
		Args: cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			return runGetMetadata()
		},
	}
}

func runGetMetadata() error {
	return json.NewEncoder(os.Stdout).Encode(proto.GetMetadataResponse{
		Name:        "local-signer",
		Description: "Sign artifacts with local keys",
		Version:     "0.1.0",
		// URL:                       "https://github.com/notaryproject/notation-action/tree/e2e-notation-plugin/.github/notation-plugin",
		URL:                       "https://github.com/Two-Hearts/notation-action/tree/e2e-notation-plugin/.github/notation-plugin",
		SupportedContractVersions: []string{proto.ContractVersion},
		Capabilities:              []proto.Capability{proto.CapabilitySignatureGenerator},
	})
}
