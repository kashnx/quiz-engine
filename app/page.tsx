"use client"
import Link from "next/link"
import { QuizifyButton } from "@/components/custom/Quizify-button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Plus, Play, BarChart3, Sparkles, Rocket, Lightbulb, Award } from "lucide-react"
import { motion } from "framer-motion"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="border-b-4 border-[#ff4d00] bg-[url('/circuit-board.svg')] bg-cover bg-center">
        <div className="max-w-7xl mx-auto px-4 py-32 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-block mb-8 px-6 py-3 bg-[#ff4d00] text-black font-mono font-bold text-sm uppercase tracking-widest border-2 border-black shadow-lg">
              DISRUPTIVE LEARNING TECH
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-none">
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-[#ff4d00]"
              >
                Q
              </motion.span>
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="text-white"
              >
                U
              </motion.span>
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-[#ff4d00]"
              >
                I
              </motion.span>
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-white"
              >
                Z
              </motion.span>
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-[#ff4d00]"
              >
                E
              </motion.span>
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="text-white"
              >
                N
              </motion.span>
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-[#ff4d00]"
              >
                G
              </motion.span>
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="text-white"
              >
                I
              </motion.span>
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-[#ff4d00]"
              >
                N
              </motion.span>
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="text-white"
              >
                E
              </motion.span>
            </h1>

            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed font-mono">
              // SMASH YOUR DOCS. GENERATE QUIZZES. DOMINATE LEARNING. //
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link href="/create-quiz" className="group">
                <QuizifyButton 
                  size="lg" 
                  className="bg-black text-[#ff4d00] border-4 border-[#ff4d00] hover:bg-[#ff4d00] hover:text-black font-bold uppercase tracking-wider transition-all duration-200 group-hover:scale-105"
                >
                  <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
                  BUILD QUIZ
                </QuizifyButton>
              </Link>
              <Link href="/my-quizzes" className="group">
                <QuizifyButton 
                  className="bg-[#ff4d00] text-black border-4 border-[#ff4d00] hover:bg-black hover:text-[#ff4d00] font-bold uppercase tracking-wider transition-all duration-200 group-hover:scale-105"
                >
                  <Play className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                  MY BATTLEGROUND
                </QuizifyButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-20 bg-black">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-black mb-6 text-[#00f0ff] uppercase tracking-wider"
          >
            <span className="border-b-4 border-[#ff4d00] pb-2">THE PROCESS</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg font-mono"
          >
            // HOW WE BREAK KNOWLEDGE AND REBUILD IT //
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="text-center border-4 border-[#00f0ff] bg-[#0a0a0a] hover:bg-[#0f1a1a] transition-all duration-300 hover:shadow-lg hover:shadow-[#00f0ff]/20">
              <CardHeader className="space-y-6">
                <div className="mx-auto w-20 h-20 bg-[#00f0ff] rounded-full flex items-center justify-center mb-4 text-black border-4 border-black shadow-lg">
                  <FileText className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl font-bold text-[#00f0ff] uppercase tracking-wider">
                  UPLOAD DOCS
                </CardTitle>
                <CardDescription className="text-gray-400 font-mono">
                  // DRAG AND DROP YOUR FILES INTO THE MACHINE //
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="text-center border-4 border-[#ff4d00] bg-[#0a0a0a] hover:bg-[#1a0a0a] transition-all duration-300 hover:shadow-lg hover:shadow-[#ff4d00]/20">
              <CardHeader className="space-y-6">
                <div className="mx-auto w-20 h-20 bg-[#ff4d00] rounded-full flex items-center justify-center mb-4 text-black border-4 border-black shadow-lg">
                  <Lightbulb className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl font-bold text-[#ff4d00] uppercase tracking-wider">
                  AI PROCESSING
                </CardTitle>
                <CardDescription className="text-gray-400 font-mono">
                  // OUR NEURAL NET TEARS APART YOUR CONTENT //
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="text-center border-4 border-[#00f0ff] bg-[#0a0a0a] hover:bg-[#0f1a1a] transition-all duration-300 hover:shadow-lg hover:shadow-[#00f0ff]/20">
              <CardHeader className="space-y-6">
                <div className="mx-auto w-20 h-20 bg-[#00f0ff] rounded-full flex items-center justify-center mb-4 text-black border-4 border-black shadow-lg">
                  <Award className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl font-bold text-[#00f0ff] uppercase tracking-wider">
                  TEST & CONQUER
                </CardTitle>
                <CardDescription className="text-gray-400 font-mono">
                  // PROVE YOUR DOMINANCE OVER THE MATERIAL //
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-[url('/grid-dark.svg')] bg-cover bg-center">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h3 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-3xl font-black text-[#ff4d00] mb-4 uppercase tracking-wider"
            >
              <span className="border-b-4 border-[#00f0ff] pb-2">WAR STORIES</span>
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 max-w-2xl mx-auto font-mono"
            >
              // FROM THE FRONTLINES OF LEARNING //
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="p-6 border-4 border-[#00f0ff] bg-[#0a0a0a] hover:border-[#ff4d00] transition-all duration-300 hover:shadow-lg hover:shadow-[#00f0ff]/20"
            >
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#ff4d00] flex items-center justify-center text-black font-bold mr-4 text-2xl border-2 border-black">
                  S
                </div>
                <div>
                  <div className="font-black text-xl text-[#00f0ff]">SARAH "THE CRUSHER"</div>
                  <div className="text-sm text-gray-400 font-mono">QUANTUM PHYSICS PHD</div>
                </div>
              </div>
              <p className="text-gray-300 italic">
                "THIS ISN'T YOUR GRANDMA'S QUIZ TOOL. IT'S LIKE STRAPPING YOUR TEXTBOOKS TO A ROCKET AND BLASTING THEM INTO YOUR BRAIN."
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="p-6 border-4 border-[#ff4d00] bg-[#0a0a0a] hover:border-[#00f0ff] transition-all duration-300 hover:shadow-lg hover:shadow-[#ff4d00]/20"
            >
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#00f0ff] flex items-center justify-center text-black font-bold mr-4 text-2xl border-2 border-black">
                  M
                </div>
                <div>
                  <div className="font-black text-xl text-[#ff4d00]">MIKE "THE MACHINE"</div>
                  <div className="text-sm text-gray-400 font-mono">NEUROSCIENCE RESEARCHER</div>
                </div>
              </div>
              <p className="text-gray-300 italic">
                "I FEED IT RESEARCH PAPERS AND IT SPITS BACK COMBAT CHALLENGES. LEARNING HAS NEVER FELT THIS INTENSE."
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24 bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[url('/circuit-board.svg')] bg-[size:100px_100px] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="w-24 h-24 bg-[#00f0ff] rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-black shadow-lg"
          >
            <Rocket className="h-12 w-12 text-black" />
          </motion.div>
          <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-black text-white mb-6 uppercase tracking-wider"
          >
            <span className="text-[#ff4d00]">READY</span> TO <span className="text-[#00f0ff]">ENGAGE</span>?
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 mb-10 text-xl font-mono max-w-2xl mx-auto"
          >
            // JOIN THE LEARNING REVOLUTION //
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Link href="/create-quiz">
              <QuizifyButton 
                size="lg" 
                className="bg-[#ff4d00] text-black border-4 border-[#ff4d00] hover:bg-black hover:text-[#ff4d00] font-bold uppercase tracking-wider text-xl py-6 px-10 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-[#ff4d00]/30"
              >
                <Plus className="mr-3 h-6 w-6" />
                LAUNCH NOW
              </QuizifyButton>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}