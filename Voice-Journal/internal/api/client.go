package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func SendJournal(data map[string]any) error {
	body, _ := json.Marshal(data)
	
	resp, err := http.Post("https://tradelog-1-po60.onrender.com/api/trades", "application/json", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 && resp.StatusCode != 201 {
		return fmt.Errorf("bad status: %d", resp.StatusCode)
	}
	return nil
}