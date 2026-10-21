package config

const (
	TelegramBotToken = "8571832892:AAHX4xBBeiZpuf2Oj7_myfQ3wvCgSBKCxds"

	AIAPIKey  = "sk-yEEkBmOLVtRGnDy2dvtVu8lnXIPuuk7z68pt87bX2mfI7dnT"
    AIBaseURL = "https://seekai.cc/v1"
    AIModel   = "deepseek-ai/DeepSeek-V4-Flash-0731"

	BaseDir = "/home/user1/Documents/Journal/voice-journal/"
	VoicesDir = BaseDir+"voices"
	JournalsDir = BaseDir + "journals"

	WhisperBin     = BaseDir+"whisper.cpp/build/bin/whisper-cli"
	WhisperModel = BaseDir+"whisper.cpp/models/ggml-persian-v4-q8_0.bin"
	WhisperLang    = "fa"
	WhisperThreads = 4

	WhisperPrompt = 
		"لانگ، شورت، دش، بیت‌کوین، اتریوم، سولانا، " +
		"تایم فریم، روند، ورودی، استاپ لاس، تیک پرافیت، مارجین، " +
		"اهرم، سود، ضرر، پوزیشن، تحلیل، چک‌لیست، داو تئوری، " +
		"مقاومت، حمایت، حجم، بازار، صرافی."
)