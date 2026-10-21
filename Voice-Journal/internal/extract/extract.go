package extract

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "strings"
    "time"
)

type Extractor struct {
    apiKey  string
    baseURL string
    model   string
    client  *http.Client
}

func New(apiKey, baseURL, model string) *Extractor {
    return &Extractor{
        apiKey:  apiKey,
        baseURL: baseURL,
        model:   model,
        client:  &http.Client{Timeout: 90 * time.Second},
    }
}

type chatRequest struct {
    Model          string        `json:"model"`
    Messages       []chatMessage `json:"messages"`
    ResponseFormat interface{}   `json:"response_format,omitempty"`
    MaxTokens      int           `json:"max_tokens,omitempty"`
    Temperature    float64       `json:"temperature,omitempty"`
}

type chatMessage struct {
    Role    string `json:"role"`
    Content string `json:"content"`
}

type chatResponse struct {
    Choices []struct {
        Message struct {
            Content string `json:"content"`
        } `json:"message"`
    } `json:"choices"`
    Error *struct {
        Message string `json:"message"`
        Type    string `json:"type"`
    } `json:"error,omitempty"`
}

// Extract returns the raw JSON string from the model.
// The caller is responsible for validating it against the schema.
func (e *Extractor) Extract(ctx context.Context, rawText string) (string, error) {
    const maxRetries = 3

    var lastErr error
    for attempt := 0; attempt < maxRetries; attempt++ {
        if attempt > 0 {
            time.Sleep(time.Duration(attempt*attempt) * 3 * time.Second)
        }

        out, err := e.tryExtract(ctx, rawText)
        if err == nil {
            return out, nil
        }

        lastErr = err

        // Don't retry on non-retryable errors
        errStr := err.Error()
        if !strings.Contains(errStr, "rate limit") &&
            !strings.Contains(errStr, "429") &&
            !strings.Contains(errStr, "502") &&
            !strings.Contains(errStr, "503") {
            return "", err
        }
    }
    return "", fmt.Errorf("after %d retries: %w", maxRetries, lastErr)
}

func (e *Extractor) tryExtract(ctx context.Context, rawText string) (string, error) {
    reqBody := chatRequest{
        Model: e.model,
        Messages: []chatMessage{
            {Role: "system", Content: SystemPrompt},
            {Role: "user", Content: rawText},
        },
        ResponseFormat: map[string]string{"type": "json_object"},
        MaxTokens:      4096,
        Temperature:    0.2,
    }

    body, err := json.Marshal(reqBody)
    if err != nil {
        return "", fmt.Errorf("marshal: %w", err)
    }

    req, err := http.NewRequestWithContext(
        ctx, "POST", e.baseURL+"/chat/completions", bytes.NewReader(body),
    )
    if err != nil {
        return "", fmt.Errorf("new request: %w", err)
    }
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer "+e.apiKey)

    resp, err := e.client.Do(req)
    if err != nil {
        return "", fmt.Errorf("http: %w", err)
    }
    defer resp.Body.Close()

    respBody, err := io.ReadAll(resp.Body)
    if err != nil {
        return "", fmt.Errorf("read: %w", err)
    }

    if resp.StatusCode == 429 {
        return "", fmt.Errorf("rate limit: %s", string(respBody))
    }
    if resp.StatusCode >= 500 {
        return "", fmt.Errorf("server error %d: %s", resp.StatusCode, string(respBody))
    }
    if resp.StatusCode != 200 {
        return "", fmt.Errorf("status %d: %s", resp.StatusCode, string(respBody))
    }

    var chatResp chatResponse
    if err := json.Unmarshal(respBody, &chatResp); err != nil {
        return "", fmt.Errorf("unmarshal: %w\nbody: %s", err, string(respBody))
    }

    if chatResp.Error != nil {
        return "", fmt.Errorf("api: %s (type=%s)", chatResp.Error.Message, chatResp.Error.Type)
    }

    if len(chatResp.Choices) == 0 {
        return "", fmt.Errorf("no choices")
    }

    content := chatResp.Choices[0].Message.Content
    content = strings.TrimSpace(content)

    // Strip markdown fences just in case
    content = strings.TrimPrefix(content, "```json")
    content = strings.TrimPrefix(content, "```")
    content = strings.TrimSuffix(content, "```")
    content = strings.TrimSpace(content)

    return content, nil
}