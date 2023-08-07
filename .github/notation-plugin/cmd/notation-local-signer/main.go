package main

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"os/signal"

	"github.com/notaryproject/notation-go/plugin/proto"
	"github.com/spf13/cobra"
)

func main() {
	ctx := context.Background()
	ctx, cancel := signal.NotifyContext(ctx, os.Interrupt)
	defer cancel()

	cmd := &cobra.Command{
		Use:           "notation-local-signer",
		SilenceUsage:  true,
		SilenceErrors: true,
	}
	cmd.AddCommand(
		getMetadataCommand(),
		describeKeyCommand(),
		signCommand(),
	)
	if err := cmd.ExecuteContext(ctx); err != nil {
		var rerr proto.RequestError
		if !errors.As(err, &rerr) {
			err = proto.RequestError{
				Code: proto.ErrorCodeGeneric,
				Err:  err,
			}
		}
		json.NewEncoder(os.Stderr).Encode(err)
		os.Exit(1)
	}
}
