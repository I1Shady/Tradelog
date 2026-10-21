package audio

import (
	"context"
	"fmt"
	"os/exec"
)

func ConvertToWAV(ctx context.Context, input, output string) error {
	cmd := exec.CommandContext(ctx, "ffmpeg",
		"-y",
		"-i", input,
		"-ar", "16000",
		"-ac", "1",
		"-c:a", "pcm_s16le",
		output,
	)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("ffmpeg: %w\n%s", err, string(out))
	}
	return nil
}