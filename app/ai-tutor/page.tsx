'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Phone, PhoneOff, MessageSquare, Volume2, VolumeX } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'student' | 'ai';
  timestamp: Date;
}

export default function AITutorPage() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [textInput, setTextInput] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      
      // Initialize speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setCurrentTranscript(transcript);

          // If final result, process the message
          if (event.results[event.results.length - 1].isFinal) {
            handleStudentMessage(transcript);
            setCurrentTranscript('');
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startCall = async () => {
    try {
      // First, stop any existing streams and wait a bit for cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Clear video element
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject = null;
      }
      
      // Wait a moment for devices to be released
      await new Promise(resolve => setTimeout(resolve, 100));

      // Start with audio-only mode to avoid device conflicts
      let stream: MediaStream;
      
      try {
        // Try audio-only first - this is most reliable
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: false, 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        setIsVideoOn(false);
        console.log('Audio-only mode started successfully');
        
        // If audio works, optionally try to add video later
        if (isVideoOn) {
          try {
            const videoStream = await navigator.mediaDevices.getUserMedia({ 
              video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
              }, 
              audio: false 
            });
            
            // Combine audio and video tracks
            const combinedStream = new MediaStream([
              ...stream.getAudioTracks(),
              ...videoStream.getVideoTracks()
            ]);
            
            // Stop the old audio-only stream
            stream.getTracks().forEach(track => track.stop());
            stream = combinedStream;
            setIsVideoOn(true);
            console.log('Video added successfully');
          } catch (videoErr) {
            console.warn('Video failed, continuing with audio-only:', videoErr);
            setIsVideoOn(false);
          }
        }
        
      } catch (audioErr: any) {
        console.error('Audio failed, trying minimal constraints:', audioErr);
        
        // Fallback to minimal audio constraints
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { 
              echoCancellation: false, 
              noiseSuppression: false,
              autoGainControl: false
            }
          });
          setIsVideoOn(false);
          console.log('Minimal audio mode successful');
        } catch (minimalErr: any) {
          console.error('All audio attempts failed:', minimalErr);
          
          // Last resort - try basic audio
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setIsVideoOn(false);
          console.log('Basic audio mode successful');
        }
      }
      
      streamRef.current = stream;
      setIsCallActive(true);
      
      if (videoRef.current && stream.getVideoTracks().length > 0) {
        videoRef.current.srcObject = stream;
      }
      
      addAIMessage("Hello! I'm your AI tutor. I'm running in audio mode to avoid device conflicts. How can I help you today? Feel free to speak naturally, and I'll listen and respond.");
    } catch (err: any) {
      console.error('Error starting call:', {
        name: err.name,
        message: err.message,
        constraint: err.constraint
      });
      
      // Final fallback - start without media but allow text interaction
      setIsCallActive(true);
      setIsVideoOn(false);
      addAIMessage("I'm having trouble accessing your microphone, but I'm still here to help! You can type your questions and I'll respond. If you'd like voice interaction, please check your browser permissions and try refreshing the page.");
    }
  };

  const endCall = async () => {
    setIsCallActive(false);
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Stop all media streams with proper cleanup
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => {
        track.stop();
        track.enabled = false;
      });
      videoRef.current.srcObject = null;
    }
    
    // Wait for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    setMessages([]);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && isListening) {
      stopListening();
    }
  };

  const toggleVideo = async () => {
    if (!isVideoOn) {
      // Turning video ON
      try {
        if (streamRef.current) {
          // Stop existing stream and wait for cleanup
          streamRef.current.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
          });
          streamRef.current = null;
        }
        
        // Wait for device cleanup
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }, 
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsVideoOn(true);
      } catch (err: any) {
        console.error('Error enabling video:', {
          name: err.name,
          message: err.message,
          constraint: err.constraint
        });
        
        if (err.name === 'NotReadableError') {
          alert('Camera is busy. Please:\n1. Close other apps using the camera\n2. Wait a moment and try again\n3. Check if camera permissions are allowed');
        } else if (err.name === 'NotAllowedError') {
          alert('Camera permission denied. Please:\n1. Click the camera icon in browser address bar\n2. Allow camera access\n3. Try again');
        } else if (err.name === 'NotFoundError') {
          alert('No camera found. Please check your camera is connected and working.');
        } else {
          alert(`Camera error (${err.name}): ${err.message}\n\nTry refreshing the page or restarting your browser.`);
        }
      }
    } else {
      // Turning video OFF - keep audio only
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
          });
          streamRef.current = null;
        }
        
        // Wait for cleanup
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: false, 
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        setIsVideoOn(false);
      } catch (err) {
        console.error('Error disabling video:', err);
      }
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    if (!isSpeakerOn && synthRef.current) {
      synthRef.current.cancel();
      setAiSpeaking(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isMuted) {
      try {
        setIsListening(true);
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting speech recognition:', err);
        setIsListening(false);
        alert('Speech recognition failed to start. Please check your microphone permissions.');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleStudentMessage = (text: string) => {
    if (text.trim()) {
      const studentMessage: Message = {
        id: Date.now().toString(),
        text: text.trim(),
        sender: 'student',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, studentMessage]);
      
      // Generate AI response immediately
      generateAIResponse(text.trim());
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleStudentMessage(textInput);
      setTextInput('');
    }
  };

  const generateAIResponse = (studentInput: string) => {
    // Simple AI response logic - in real implementation, this would connect to an AI service
    let response = '';
    
    const input = studentInput.toLowerCase();
    
    if (input.includes('math') || input.includes('mathematics')) {
      response = "I'd be happy to help you with mathematics! What specific topic are you struggling with? Is it algebra, geometry, calculus, or something else?";
    } else if (input.includes('science') || input.includes('physics') || input.includes('chemistry')) {
      response = "Science is fascinating! Which area would you like to explore? I can help with physics concepts, chemistry equations, or biology processes.";
    } else if (input.includes('study') || input.includes('exam')) {
      response = "Great question about studying! I recommend breaking your study sessions into focused 25-minute blocks with 5-minute breaks. What subject are you preparing for?";
    } else if (input.includes('stress') || input.includes('worried') || input.includes('anxious')) {
      response = "I understand that studying can be stressful. Remember to take deep breaths and break complex problems into smaller steps. You're doing great by seeking help!";
    } else if (input.includes('hello') || input.includes('hi')) {
      response = "Hello! I'm here to support your learning journey. What would you like to work on today?";
    } else {
      response = "That's an interesting point! Can you tell me more about what you're thinking? I'm here to help guide you through any academic challenges.";
    }

    addAIMessage(response);
  };

  const addAIMessage = (text: string) => {
    const aiMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'ai',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, aiMessage]);
    
    // Speak the AI response
    if (isSpeakerOn && synthRef.current) {
      speakText(text);
    }
  };

  const speakText = (text: string) => {
    if (synthRef.current) {
      setAiSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        setAiSpeaking(false);
      };
      
      synthRef.current.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            AI Tutor Session
          </h1>
          <p className="text-gray-400">
            Connect with your AI tutor for personalized guidance and support
          </p>
        </div>

        {!isCallActive ? (
          /* Pre-call screen */
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center max-w-md">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Video className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Ready to Learn?</h2>
              <p className="text-gray-400 mb-8">
                Start a video session with your AI tutor. The AI can see, hear, and respond to help guide your learning.
              </p>
              <button
                onClick={startCall}
                className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center gap-3 mx-auto"
              >
                <Phone className="w-5 h-5" />
                Start AI Tutor Session
              </button>
            </div>
          </div>
        ) : (
          /* Active call screen */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[80vh]">
            {/* Video Area */}
            <div className="lg:col-span-2 space-y-4">
              {/* AI Avatar */}
              <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-1/2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">AI Tutor</h3>
                  <div className="flex items-center gap-2">
                    {aiSpeaking && (
                      <div className="flex items-center gap-2 text-blue-400">
                        <Volume2 className="w-4 h-4" />
                        <span className="text-sm">Speaking...</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-16 h-16 text-white" />
                    </div>
                    <p className="text-gray-300">AI Tutor is ready to help</p>
                  </div>
                </div>
              </div>

              {/* Student Video */}
              <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-1/2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">You</h3>
                  <div className="flex items-center gap-2">
                    {isListening && (
                      <div className="flex items-center gap-2 text-green-400">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm">Listening...</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-900 rounded-xl h-full overflow-hidden">
                  {isVideoOn ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <VideoOff className="w-16 h-16 text-gray-500" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chat and Controls */}
            <div className="space-y-4">
              {/* Chat Messages */}
              <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-3/4">
                <h3 className="text-lg font-semibold mb-4">Conversation</h3>
                <div className="space-y-4 h-full overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'student' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-xl ${
                          message.sender === 'student'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-100'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {currentTranscript && (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] p-3 rounded-xl bg-blue-600/50 text-white border-2 border-blue-400">
                        <p className="text-sm">{currentTranscript}</p>
                        <p className="text-xs opacity-70 mt-1">Speaking...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Text Input */}
              <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                <form onSubmit={handleTextSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type your question here..."
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!textInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-6 py-2 rounded-lg transition-colors"
                  >
                    Send
                  </button>
                </form>
              </div>

              {/* Controls */}
              <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={toggleMute}
                    className={`p-4 rounded-xl transition-all duration-200 ${
                      isMuted
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-6 h-6 mx-auto" /> : <Mic className="w-6 h-6 mx-auto" />}
                  </button>

                  <button
                    onClick={toggleVideo}
                    className={`p-4 rounded-xl transition-all duration-200 ${
                      !isVideoOn
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {isVideoOn ? <Video className="w-6 h-6 mx-auto" /> : <VideoOff className="w-6 h-6 mx-auto" />}
                  </button>

                  <button
                    onClick={toggleSpeaker}
                    className={`p-4 rounded-xl transition-all duration-200 ${
                      !isSpeakerOn
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {isSpeakerOn ? <Volume2 className="w-6 h-6 mx-auto" /> : <VolumeX className="w-6 h-6 mx-auto" />}
                  </button>

                  <button
                    onClick={isListening ? stopListening : startListening}
                    disabled={isMuted}
                    className={`p-4 rounded-xl transition-all duration-200 ${
                      isListening
                        ? 'bg-green-600 hover:bg-green-700'
                        : isMuted
                        ? 'bg-gray-800 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <MessageSquare className="w-6 h-6 mx-auto" />
                  </button>
                </div>

                <button
                  onClick={endCall}
                  className="w-full mt-4 bg-red-600 hover:bg-red-700 p-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <PhoneOff className="w-5 h-5" />
                  End Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
