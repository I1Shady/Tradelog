package transcribe

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type Whisper struct {
	BinaryPath string
	ModelPath  string
	Language   string
	Prompt     string
	Threads    int
}

func New(binaryPath, modelPath, language, prompt string) *Whisper {
	return &Whisper{
		BinaryPath: binaryPath,
		ModelPath:  modelPath,
		Language:   language,
		Prompt:     prompt,
		Threads:    4,
	}
}

func (w *Whisper) Transcribe(ctx context.Context, audioPath string) (string, error) {
	if _, err := os.Stat(audioPath); err != nil {
		return "", fmt.Errorf("audio not found: %w", err)
	}

	args := []string{
		"-m", w.ModelPath,
		"-f", audioPath,
		"-l", w.Language,
		"-t", fmt.Sprintf("%d", w.Threads),
		"--output-txt",
		"--no-prints",
	}

	if w.Prompt != "" {
		args = append(args, "--prompt", w.Prompt)
	}

	cmd := exec.CommandContext(ctx, w.BinaryPath, args...)
	cmd.Dir = filepath.Dir(audioPath)

	
	absBin, err := filepath.Abs(w.BinaryPath)
	if err == nil {
		binDir := filepath.Dir(absBin)
		cmd.Env = append(os.Environ(),
			"LD_LIBRARY_PATH="+binDir+":"+os.Getenv("LD_LIBRARY_PATH"),
		)
	}
	
	if out, err := cmd.CombinedOutput(); err != nil {
		return "", fmt.Errorf("whisper: %w\n%s", err, string(out))
	}

	txtPath := audioPath + ".txt"
	data, err := os.ReadFile(txtPath)
	if err != nil {
		return "", fmt.Errorf("read whisper output: %w", err)
	}
	return strings.TrimSpace(string(data)), nil
}