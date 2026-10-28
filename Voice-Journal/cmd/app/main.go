package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

	"voice-journal/internal/api"
	"voice-journal/internal/audio"
	"voice-journal/internal/config"
	"voice-journal/internal/extract"
	"voice-journal/internal/telegram"
	"voice-journal/internal/transcribe"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "Error:", err)
		os.Exit(1)
	}
}

func run() error {
	bot, err := telegram.New(config.TelegramBotToken)
	if err != nil {
		return err
	}
	log.Printf("bot @%s started", bot.Username())

	tr := transcribe.New(config.WhisperAPIURL, config.WhisperAPIKey)
	
	ext := extract.New(config.AIAPIKey, config.AIBaseURL, config.AIModel)
	ctx := context.Background()

	return bot.Run(func(v *telegram.VoiceFile) error {
		wavPath := strings.TrimSuffix(v.Path, ".ogg") + ".wav"

		if err := audio.ConvertToWAV(ctx, v.Path, wavPath); err != nil {
			return fmt.Errorf("convert: %w", err)
		}

		text, err := tr.Transcribe(ctx, wavPath)
		if err != nil {
			return fmt.Errorf("transcribe: %w", err)
		}

		rawJSON, err := ext.Extract(ctx, text)
		if err != nil {
			return fmt.Errorf("extract: %w", err)
		}

		log.Println(rawJSON)

		if strings.TrimSpace(rawJSON) == "" {
			return fmt.Errorf("AI returned empty response")
		}
		
		var parsed map[string]any
		if err := json.Unmarshal([]byte(rawJSON), &parsed); err != nil {
    		return fmt.Errorf("parse json: %w\nraw: %q", err, rawJSON)
		}

		//sending to API...
		if err := api.SendJournal(parsed); err != nil {
			log.Printf("❌ API error: %v", err)
		} else {
			log.Println("✅ Saved to database via API")
		}

		os.Remove(wavPath)
		return nil
	})
}