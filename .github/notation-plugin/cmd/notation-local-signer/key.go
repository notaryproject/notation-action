package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"

	"github.com/notaryproject/notation-core-go/signature"
	"github.com/notaryproject/notation-core-go/x509"
	"github.com/notaryproject/notation-go/plugin/proto"
	"github.com/spf13/cobra"
)

func describeKeyCommand() *cobra.Command {
	return &cobra.Command{
		Use:  string(proto.CommandDescribeKey),
		Args: cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			return runDescribeKey()
		},
	}
}

func runDescribeKey() error {
	// decode request
	var req proto.DescribeKeyRequest
	if err := json.NewDecoder(os.Stdin).Decode(&req); err != nil {
		return proto.RequestError{
			Code: proto.ErrorCodeValidation,
			Err:  fmt.Errorf("failed to unmarshal request input: %w", err),
		}
	}

	// describe key
	certs, err := x509.ReadCertificateFile(req.KeyID)
	if err != nil {
		return proto.RequestError{
			Code: proto.ErrorCodeValidation,
			Err:  fmt.Errorf("failed to read certificate file: %w", err),
		}
	}
	if len(certs) == 0 {
		return proto.RequestError{
			Code: proto.ErrorCodeValidation,
			Err:  errors.New("no certificate found"),
		}
	}
	keySpec, err := signature.ExtractKeySpec(certs[0])
	if err != nil {
		return proto.RequestError{
			Code: proto.ErrorCodeValidation,
			Err:  fmt.Errorf("failed to extract key spec: %w", err),
		}
	}
	protoKeySpec, err := proto.EncodeKeySpec(keySpec)
	if err != nil {
		return fmt.Errorf("failed to encode key spec: %w", err)
	}
	resp := &proto.DescribeKeyResponse{
		KeyID:   req.KeyID,
		KeySpec: protoKeySpec,
	}

	// encode response
	return json.NewEncoder(os.Stdout).Encode(resp)
}
