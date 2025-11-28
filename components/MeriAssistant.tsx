
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useEffect, useRef, useState} from 'react';
import {GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type} from '@google/genai';
import {AppDefinition} from '../types';
import {APP_DEFINITIONS_CONFIG} from '../constants';

interface MeriAssistantProps {
  onClose: () => void;
  isOpen: boolean;
  onAppOpen: (app: AppDefinition) => void;
  onToggleTheme: () => void;
  onChangeWallpaper: () => void;
}

const tools = [
  {
    functionDeclarations: [
      {
        name: "openApp",
        description: "Opens an application by its name.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            appName: { type: Type.STRING, description: "The name of the app to open (e.g. 'Calculator', 'Settings', 'Browser')." }
          },
          required: ["appName"]
        }
      },
      {
        name: "toggleTheme",
        description: "Switches the system theme between light and dark mode.",
      },
      {
        name: "changeWallpaper",
        description: "Changes the desktop background wallpaper to the next available one.",
      }
    ]
  }
];

export const MeriAssistant: React.FC<MeriAssistantProps> = ({onClose, isOpen, onAppOpen, onToggleTheme, onChangeWallpaper}) => {
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'error'>('connecting');
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState<{user: string, model: string}>({user: '', model: ''});
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);

  useEffect(() => {
    if (!isOpen) {
        setTranscript({user: '', model: ''}); // Reset transcript on close
        return;
    }

    let cleanup = () => {};

    const startSession = async () => {
      try {
        setStatus('connecting');
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});
        
        // Initialize Audio Contexts
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});

        // Request Mic Access
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        
        let sessionPromise: Promise<any>;

        // Connect to Gemini Live
        sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Kore'}},
            },
            systemInstruction: "You are Meri, a highly intelligent and helpful OS assistant. You can control the system to open apps, change themes, and more. When asked to do something, use your tools.",
            tools: tools,
            inputAudioTranscription: {}, // Fixed: Removed invalid model argument
          },
          callbacks: {
            onopen: () => {
              setStatus('listening');
              processAudioInput(stream, sessionPromise);
            },
            onmessage: (msg: LiveServerMessage) => {
               handleServerMessage(msg, sessionPromise);
            },
            onclose: () => {
              console.log('Meri disconnected');
            },
            onerror: (err) => {
              console.error('Meri error:', err);
              setStatus('error');
            }
          }
        });
        
        const session = await sessionPromise;
        sessionRef.current = session;

        cleanup = () => {
            stream.getTracks().forEach(track => track.stop());
            processorRef.current?.disconnect();
            sourceRef.current?.disconnect();
            sourcesRef.current.forEach(source => {
                try { source.stop(); } catch(e) {}
            });
            sourcesRef.current = [];
            audioContextRef.current?.close();
            inputContextRef.current?.close();
            if (sessionRef.current) {
                try { sessionRef.current.close(); } catch(e) {}
            }
        };

      } catch (e) {
        console.error("Failed to start Meri:", e);
        setStatus('error');
      }
    };

    startSession();

    return () => {
      cleanup();
      sessionRef.current = null;
    };
  }, [isOpen]);

  const processAudioInput = (stream: MediaStream, sessionPromise: Promise<any>) => {
    if (!inputContextRef.current) return;

    const source = inputContextRef.current.createMediaStreamSource(stream);
    const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
    
    sourceRef.current = source;
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      setVolume(Math.min(rms * 5, 1)); 

      const pcmData = float32ToInt16(inputData);
      const base64Data = arrayBufferToBase64(pcmData.buffer);

      sessionPromise.then((session) => {
          session.sendRealtimeInput({
            media: {
              mimeType: 'audio/pcm;rate=16000',
              data: base64Data
            }
          });
      });
    };

    source.connect(processor);
    processor.connect(inputContextRef.current.destination);
  };

  const handleServerMessage = async (message: LiveServerMessage, sessionPromise: Promise<any>) => {
    const serverContent = message.serverContent;
    
    // Handle Transcriptions
    if (serverContent?.inputTranscription) {
        setTranscript(prev => ({...prev, user: prev.user + serverContent.inputTranscription.text}));
    }
    
    // Handle Tool Calls (Function Calling)
    if (message.toolCall) {
        for (const call of message.toolCall.functionCalls) {
            console.log("Tool call received:", call.name, call.args);
            let result = "Success";
            
            if (call.name === 'openApp') {
                const appName = (call.args as any).appName;
                const app = APP_DEFINITIONS_CONFIG.find(a => a.name.toLowerCase().includes(appName.toLowerCase()));
                if (app) {
                    onAppOpen(app);
                    result = `Opened ${app.name}`;
                } else {
                    result = `Could not find app ${appName}`;
                }
            } else if (call.name === 'toggleTheme') {
                onToggleTheme();
                result = "Theme toggled";
            } else if (call.name === 'changeWallpaper') {
                onChangeWallpaper();
                result = "Wallpaper changed";
            }

            sessionPromise.then(session => {
                session.sendToolResponse({
                    functionResponses: {
                        id: call.id,
                        name: call.name,
                        response: { result: result }
                    }
                });
            });
        }
    }

    // Handle Audio Output
    if (serverContent?.modelTurn?.parts?.[0]?.inlineData) {
       setStatus('speaking');
       const base64Audio = serverContent.modelTurn.parts[0].inlineData.data;
       const audioBytes = base64ToArrayBuffer(base64Audio);
       playAudio(audioBytes);
    }
    
    if (serverContent?.turnComplete) {
        setStatus('listening');
        // Optional: clear transcript or start new line
    }

    if (serverContent?.interrupted) {
        sourcesRef.current.forEach(source => {
            try { source.stop(); } catch(e) {}
        });
        sourcesRef.current = [];
        nextStartTimeRef.current = 0;
        setStatus('listening');
    }
  };

  const playAudio = async (arrayBuffer: ArrayBuffer) => {
    if (!audioContextRef.current) return;
    try {
        const audioBuffer = pcmToAudioBuffer(
            new Uint8Array(arrayBuffer),
            audioContextRef.current,
            24000
        );
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        const currentTime = audioContextRef.current.currentTime;
        const startTime = Math.max(currentTime, nextStartTimeRef.current);
        source.start(startTime);
        nextStartTimeRef.current = startTime + audioBuffer.duration;
        sourcesRef.current.push(source);
        source.onended = () => {
            sourcesRef.current = sourcesRef.current.filter(s => s !== source);
        };
    } catch (e) {
        console.error("Error decoding audio", e);
    }
  };

  const pcmToAudioBuffer = (data: Uint8Array, ctx: AudioContext, sampleRate: number): AudioBuffer => {
    const numChannels = 1;
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  const float32ToInt16 = (float32: Float32Array) => {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      let s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const base64ToArrayBuffer = (base64: string) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-end justify-center pb-24">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-500" onClick={onClose}></div>
      
      <div className="pointer-events-auto relative flex flex-col items-center gap-8 animate-slide-up-fade">
         
         {/* Live Transcription Display */}
         {(transcript.user || transcript.model) && (
             <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl shadow-2xl max-w-lg text-center transition-all">
                {transcript.user && <p className="text-gray-300 text-sm mb-2">"{transcript.user}"</p>}
                {status === 'speaking' && <p className="text-white text-lg font-medium animate-pulse">...</p>}
             </div>
         )}

         {/* The Orb */}
         <div className="relative w-24 h-24 flex items-center justify-center">
            <div 
              className={`absolute w-full h-full rounded-full blur-xl transition-all duration-100 ${
                  status === 'error' ? 'bg-red-500/50' : 
                  status === 'speaking' ? 'bg-purple-500/60' : 
                  'bg-blue-500/50'
              }`}
              style={{ transform: `scale(${1 + volume})` }}
            ></div>
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 shadow-[0_0_50px_rgba(0,100,255,0.6)] animate-pulse">
               <div className="absolute inset-0 bg-white/30 rounded-full blur-md" style={{ opacity: volume }}></div>
            </div>
         </div>

         {/* Status Text */}
         <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full shadow-2xl">
            <p className="text-white font-medium text-lg tracking-wide">
                {status === 'connecting' && "Connecting to Meri..."}
                {status === 'listening' && "I'm listening..."}
                {status === 'speaking' && "Meri is speaking..."}
                {status === 'error' && "Connection interrupted."}
            </p>
         </div>

         {/* Close Button */}
         <button 
           onClick={onClose}
           className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
         >
           <span className="material-symbols-rounded">close</span>
         </button>
      </div>
    </div>
  );
};
