import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import api, { symptomApi, workoutApi, chatApi } from '../services/api.js'
import toast from 'react-hot-toast'
import { FiCheckCircle, FiActivity, FiZap, FiLoader, FiAlertCircle } from 'react-icons/fi'

const AITools = () => {
  const [symptoms, setSymptoms] = useState('')
  const [goal, setGoal] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [symptomResult, setSymptomResult] = useState(null)
  const [workoutResult, setWorkoutResult] = useState(null)

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/users/profile').then(res => res.data),
  })

  const symptomMutation = useMutation({
    mutationFn: (symptoms) => symptomApi.post('/symptom/check', { symptoms }),
    onSuccess: (res) => {
      toast.success('Analysis complete!')
      setSymptomResult(res.data.data)
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Analysis failed')
      setSymptomResult(null)
    },
  })

  const workoutMutation = useMutation({
    mutationFn: (data) => workoutApi.post('/workout/workout', data),

    onSuccess: (res) => {
      toast.success('Workout plan generated!')
      setWorkoutResult(res.data)
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Workout generation failed')
      setWorkoutResult(null)
    },
  })

  const analyzeSymptoms = () => {
    if (!symptoms.trim()) return toast.error('Please enter symptoms')
    setSymptomResult(null)
    symptomMutation.mutate(symptoms)
  }

  const generateWorkout = () => {
    if (!goal.trim()) return toast.error('Please enter your fitness goal')
    const weight = profile?.healthProfile?.weight
    const height = profile?.healthProfile?.height
    if (!weight || !height) {
      return toast.error('Please update your height and weight in Profile first')
    }
    setWorkoutResult(null)
    workoutMutation.mutate({ goal, weight, height })
  }

  const sendChat = async () => {
    if (!chatInput.trim()) return
    const userMsg = chatInput
    setChatInput('')
    setIsChatLoading(true)
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }])
    try {
      const { data } = await chatApi.post('/chat/chat', { message: userMsg })
      setChatMessages(prev => [...prev, { role: 'ai', content: data.reply }])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Chat failed. Please try again.')
      setChatMessages(prev => [...prev, { role: 'ai', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setIsChatLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent mb-6">
          AI Health Assistant
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Get instant insights with our AI-powered health tools. Symptom analysis, personalized workouts, and 24/7 chat support.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-16">
        {/* Symptom Checker */}
        <div className="card p-8 lg:col-span-1">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-red-100 rounded-2xl">
              <FiCheckCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Symptom Checker</h3>
              <p className="text-gray-500">AI analysis in seconds</p>
            </div>
          </div>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Describe your symptoms (headache, fever, cough...)"
            className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl resize-vertical min-h-[120px] focus:border-primary-300 focus:ring-2 focus:ring-primary-200 focus:outline-none"
            rows="3"
          />
          <button
            onClick={analyzeSymptoms}
            disabled={symptomMutation.isLoading}
            className="mt-4 w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50"
          >
            {symptomMutation.isLoading ? 'Analyzing...' : 'Analyze Symptoms'}
          </button>

          {/* Symptom Result */}
          {symptomResult && (
            <div className="mt-6 bg-red-50 border border-red-100 rounded-xl p-4">
              <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                <FiAlertCircle /> Result: {symptomResult.condition}
              </h4>
              <div className="space-y-2 text-sm text-red-900">
                <p><span className="font-semibold">Severity:</span> {symptomResult.severity}</p>
                <p><span className="font-semibold">Advice:</span> {symptomResult.advice}</p>
                {symptomResult.medicines && symptomResult.medicines.length > 0 && (
                  <p><span className="font-semibold">Suggested:</span> {symptomResult.medicines.join(', ')}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Workout Generator */}
        <div className="card p-8 lg:col-span-1">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-green-100 rounded-2xl">
              <FiActivity className="w-8 h-8 text-success-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Workout Generator</h3>
              <p className="text-gray-500">Personalized plans</p>
            </div>
          </div>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Your fitness goal (e.g., lose 10kg, build muscle...)"
            className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl focus:border-green-300 focus:ring-2 focus:ring-green-200 focus:outline-none"
          />
          <button
            onClick={generateWorkout}
            disabled={workoutMutation.isLoading}
            className="mt-4 w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50"
          >
            {workoutMutation.isLoading ? 'Generating...' : 'Generate Workout'}
          </button>

          {/* Workout Result */}
          {workoutResult && (
            <div className="mt-6 bg-green-50 border border-green-100 rounded-xl p-4">
              <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                <FiCheckCircle /> Your Plan (BMI: {workoutResult.bmi})
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-green-900">
                {workoutResult.plan.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* AI Chat */}
        <div className="card p-8 lg:col-span-1">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-indigo-100 rounded-2xl">
              <FiZap className="w-8 h-8 text-indigo-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">AI Health Chat</h3>
              <p className="text-gray-500">Ask anything about health</p>
            </div>
          </div>
          <div className="h-64 bg-gray-50 rounded-xl p-4 mb-4 overflow-y-auto space-y-2">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white shadow border'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="max-w-xs px-4 py-2 rounded-2xl bg-white shadow border flex items-center gap-2 text-gray-500">
                  <FiLoader className="animate-spin" /> AI is thinking...
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendChat()
                }
              }}
              placeholder="Ask HealthAI..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-transparent"
            />
            <button
              onClick={sendChat}
              disabled={isChatLoading || !chatInput.trim()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AITools

