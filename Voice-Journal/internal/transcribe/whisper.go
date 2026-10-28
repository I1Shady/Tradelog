
package transcribe

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

type Whisper struct {
	APIURL string
	APIKey string
	Client *http.Client
}

func New(apiURL, apiKey string) *Whisper {
	return &Whisper{
		APIURL: apiURL,
		APIKey: apiKey,
		Client: &http.Client{
			Timeout: 60 * time.Minute,
		},
	}
}

func (w *Whisper) Transcribe(ctx context.Context, audioPath string) (string, error) {
	audio, err := os.Open(audioPath)
	if err != nil {
		return "", fmt.Errorf("open audio: %w", err)
	}
	defer audio.Close()

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	part, err := writer.CreateFormFile("file", filepath.Base(audioPath))
	if err != nil {
		return "", fmt.Errorf("create multipart file: %w", err)
	}

	if _, err := io.Copy(part, audio); err != nil {
		return "", fmt.Errorf("write audio: %w", err)
	}

	if err := writer.Close(); err != nil {
		return "", fmt.Errorf("close multipart writer: %w", err)
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		w.APIURL,
		&body,
	)
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("X-API-Key", w.APIKey)

	client := w.Client
	if client == nil {
		client = http.DefaultClient
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("whisper API request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		responseBody, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return "", fmt.Errorf(
			"whisper API returned %s: %s",
			resp.Status,
			string(responseBody),
		)
	}

	var result struct {
		Text string `json:"text"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("decode whisper response: %w", err)
	}

	return result.Text, nil
}
