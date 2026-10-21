package telegram

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"

	"voice-journal/internal/config"
)

type Bot struct {
	api *tgbotapi.BotAPI
}

func New(token string) (*Bot, error) {
	api, err := tgbotapi.NewBotAPI(token)
	if err != nil {
		return nil, fmt.Errorf("new bot api: %w", err)
	}
	return &Bot{api: api}, nil
}

func (b *Bot) Username() string {
	return b.api.Self.UserName
}

func (b *Bot) Run(handler func(*VoiceFile) error) error {
	if err := os.MkdirAll(config.VoicesDir, 0o755); err != nil {
		return fmt.Errorf("create voices dir: %w", err)
	}

	u := tgbotapi.NewUpdate(0)
	u.Timeout = 120
	u.AllowedUpdates = []string{"channel_post"}

	updates := b.api.GetUpdatesChan(u)
	log.Println("Waiting for channel voice messages...")

	for update := range updates {
		if err := b.handleUpdate(update, handler); err != nil {
			log.Printf("update error: %v", err)
		}
	}
	return nil
}

type VoiceFile struct {
	Path     string
	Duration int
	ChatID   int64
	MessageID int
}

func (b *Bot) handleUpdate(update tgbotapi.Update, handler func(*VoiceFile) error) error {
	if update.ChannelPost == nil || update.ChannelPost.Voice == nil {
		return nil
	}

	msg := update.ChannelPost
	voice := msg.Voice

	log.Printf("voice detected: chat=%s duration=%ds file_id=%s",
		msg.Chat.Title, voice.Duration, voice.FileID)

	file, err := b.api.GetFile(tgbotapi.FileConfig{FileID: voice.FileID})
	if err != nil {
		return fmt.Errorf("get file: %w", err)
	}

	ts := time.Now().Format("2006-01-02_15-04-05")
	filename := fmt.Sprintf("%s_%d.ogg", ts, msg.MessageID)
	outputPath := filepath.Join(config.VoicesDir, filename)

	if err := downloadFile(file.Link(b.api.Token), outputPath); err != nil {
		return fmt.Errorf("download: %w", err)
	}

	info, _ := os.Stat(outputPath)
	log.Printf("saved: %s (%d bytes)", outputPath, info.Size())

	return handler(&VoiceFile{
		Path:      outputPath,
		Duration:  voice.Duration,
		ChatID:    msg.Chat.ID,
		MessageID: msg.MessageID,
	})
}

func downloadFile(url, outputPath string) error {
	resp, err := http.Get(url)
	if err != nil {
		return fmt.Errorf("http get: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("telegram status: %d", resp.StatusCode)
	}

	file, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("create file: %w", err)
	}
	defer file.Close()

	if _, err := io.Copy(file, resp.Body); err != nil {
		os.Remove(outputPath)
		return fmt.Errorf("save file: %w", err)
	}
	return nil
}