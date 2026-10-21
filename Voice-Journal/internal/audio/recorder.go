package audio

import (
	"fmt"
	"sync"
	"time"

	"github.com/gordonklaus/portaudio"
)

const (
	SampleRate = 16000
	Channels   = 1
	BufferSize = 512
)

type Recorder struct {
	stream    *portaudio.Stream
	buffer    []int16
	mu        sync.Mutex
	recording bool
}

func NewRecorder() (*Recorder, error) {
	if err := portaudio.Initialize(); err != nil {
		return nil, fmt.Errorf("initialize portaudio: %w", err)
	}

	buffer := make([]int16, BufferSize)

	stream, err := portaudio.OpenDefaultStream(
		Channels,
		0,
		SampleRate,
		BufferSize,
		buffer,
	)
	if err != nil {
		portaudio.Terminate()
		return nil, fmt.Errorf("open audio stream: %w", err)
	}

	return &Recorder{
		stream: stream,
		buffer: buffer,
	}, nil
}

func (r *Recorder) Close() error {
	closeErr := r.stream.Close()
	portaudio.Terminate()
	if closeErr != nil {
		return fmt.Errorf("close audio stream: %w", closeErr)
	}
	return nil
}

func (r *Recorder) Record(stop <-chan struct{}) ([]int16, time.Duration, error) {
	// Prevent concurrent recordings
	r.mu.Lock()
	if r.recording {
		r.mu.Unlock()
		return nil, 0, fmt.Errorf("already recording")
	}
	r.recording = true
	r.mu.Unlock()

	defer func() {
		r.mu.Lock()
		r.recording = false
		r.mu.Unlock()
	}()

	if err := r.stream.Start(); err != nil {
		return nil, 0, fmt.Errorf("start audio stream: %w", err)
	}

	start := time.Now()

	// Pre-allocate capacity for 60 seconds to avoid repeated slice growth
	samples := make([]int16, 0, SampleRate*60)

	for {
		if err := r.stream.Read(); err != nil {
			_ = r.stream.Stop()
			return samples, time.Since(start), fmt.Errorf("read audio stream: %w", err)
		}

		samples = append(samples, r.buffer...)

		select {
		case <-stop:
			if err := r.stream.Stop(); err != nil {
				return samples, time.Since(start), fmt.Errorf("stop audio stream: %w", err)
			}
			return samples, time.Since(start), nil
		default:
		}
	}
}