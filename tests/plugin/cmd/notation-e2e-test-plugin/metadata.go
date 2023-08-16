// Copyright The Notary Project Authors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
		Name:                      "e2e-test-plugin",
		Description:               "Sign artifacts with local keys for testing purposes",
		Version:                   "0.1.0",
		URL:                       "https://github.com/notaryproject/notation-action",
		SupportedContractVersions: []string{proto.ContractVersion},
		Capabilities:              []proto.Capability{proto.CapabilitySignatureGenerator},
	})
}
