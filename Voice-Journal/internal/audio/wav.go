package audio

import (
	"encoding/binary"
	"fmt"
	"os"
)

func SaveWAV(filename string, samples []int16) (err error) {
	file, err := os.Create(filename)
	if err != nil {
		return fmt.Errorf("create WAV file: %w", err)
	}

	// Check Close error since buffered data may be lost otherwise
	defer func() {
		if cerr := file.Close(); cerr != nil && err == nil {
			err = fmt.Errorf("close WAV file: %w", cerr)
		}
	}()

	dataSize := len(samples) * 2

	if err := writeHeader(file, dataSize); err != nil {
		return fmt.Errorf("write WAV header: %w", err)
	}

	if err := binary.Write(file, binary.LittleEndian, samples); err != nil {
		return fmt.Errorf("write WAV data: %w", err)
	}

	return nil
}

func writeHeader(file *os.File, dataSize int) error {
	byteRate := SampleRate * Channels * 2
	blockAlign := Channels * 2

	header := struct {
		RIFF        [4]byte
		FileSize    uint32
		WAVE        [4]byte
		FMT         [4]byte
		ChunkSize   uint32
		AudioFormat uint16
		Channels    uint16
		SampleRate  uint32
		ByteRate    uint32
		BlockAlign  uint16
		Bits        uint16
		Data        [4]byte
		DataSize    uint32
	}{
		RIFF:        [4]byte{'R', 'I', 'F', 'F'},
		FileSize:    uint32(36 + dataSize),
		WAVE:        [4]byte{'W', 'A', 'V', 'E'},
		FMT:         [4]byte{'f', 'm', 't', ' '},
		ChunkSize:   16,
		AudioFormat: 1,
		Channels:    Channels,
		SampleRate:  SampleRate,
		ByteRate:    uint32(byteRate),
		BlockAlign:  uint16(blockAlign),
		Bits:        16,
		Data:        [4]byte{'d', 'a', 't', 'a'},
		DataSize:    uint32(dataSize),
	}

	return binary.Write(file, binary.LittleEndian, header)
}