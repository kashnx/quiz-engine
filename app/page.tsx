import Link from "next/link"
import { QuizifyButton } from "@/components/custom/Quizify-button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Plus, Play, BarChart3, Sparkles, Rocket, Lightbulb, Award } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero Section - Brutalist Design */}
      <div className="border-b-4 border-[#ff4d00]">
        <div className="max-w-7xl mx-auto px-4 py-32">
          <div className="text-center">
            <div className="inline-block mb-8 px-6 py-3 bg-[#ff4d00] text-black font-mono font-bold text-sm uppercase tracking-widest">
              Disruptive Learning Tech
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-none">
              <span className="text-[#ff4d00]">Q</span>
              <span className="text-white">U</span>
              <span className="text-[#ff4d00]">I</span>
              <span className="text-white">Z</span>
              <span className="text-[#ff4d00]">E</span>
              <span className="text-white">N</span>
              <span className="text-[#ff4d00]">G</span>
              <span className="text-white">I</span>
              <span className="text-[#ff4d00]">N</span>
              <span className="text-white">E</span>
            </h1>

            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed font-mono">
              // SMASH YOUR DOCS. GENERATE QUIZZES. DOMINATE LEARNING. //
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link href="/create-quiz" className="group">
                <QuizifyButton 
                  size="lg" 
                  className="bg-black text-[#ff4d00] border-4 border-[#ff4d00] hover:bg-[#ff4d00] hover:text-black font-bold uppercase tracking-wider transition-all duration-200"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Build Quiz
                </QuizifyButton>
              </Link>
              <Link href="/my-quizzes" className="group">
                <QuizifyButton 
                  className="bg-[#ff4d00] text-black border-4 border-[#ff4d00] hover:bg-black hover:text-[#ff4d00] font-bold uppercase tracking-wider transition-all duration-200"
                >
                  <Play className="mr-2 h-5 w-5" />
                  My Battleground
                </QuizifyButton>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - Cyberpunk Inspired */}
      <div className="max-w-7xl mx-auto px-4 py-20 bg-[#0a0a0a]">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black mb-6 text-[#00f0ff] uppercase tracking-wider">
            <span className="border-b-4 border-[#ff4d00] pb-2">The Process</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg font-mono">
            // HOW WE BREAK KNOWLEDGE AND REBUILD IT //
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <Card className="text-center border-4 border-[#00f0ff] bg-[#0a0a0a] hover:bg-[#0f1a1a] transition-all duration-300">
            <CardHeader className="space-y-6">
              <div className="mx-auto w-20 h-20 bg-[#00f0ff] rounded-full flex items-center justify-center mb-4 text-black">
                <FileText className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-bold text-[#00f0ff] uppercase tracking-wider">
                Upload Docs
              </CardTitle>
              <CardDescription className="text-gray-400 font-mono">
                Drag and drop your files into the machine
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center border-4 border-[#ff4d00] bg-[#0a0a0a] hover:bg-[#1a0a0a] transition-all duration-300">
            <CardHeader className="space-y-6">
              <div className="mx-auto w-20 h-20 bg-[#ff4d00] rounded-full flex items-center justify-center mb-4 text-black">
                <Lightbulb className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-bold text-[#ff4d00] uppercase tracking-wider">
                AI Processing
              </CardTitle>
              <CardDescription className="text-gray-400 font-mono">
                Our neural net tears apart your content
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center border-4 border-[#00f0ff] bg-[#0a0a0a] hover:bg-[#0f1a1a] transition-all duration-300">
            <CardHeader className="space-y-6">
              <div className="mx-auto w-20 h-20 bg-[#00f0ff] rounded-full flex items-center justify-center mb-4 text-black">
                <Award className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-bold text-[#00f0ff] uppercase tracking-wider">
                Test & Conquer
              </CardTitle>
              <CardDescription className="text-gray-400 font-mono">
                Prove your dominance over the material
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Testimonials - Glitch Effect */}
      <div className="py-20 bg-black">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-black text-[#ff4d00] mb-4 uppercase tracking-wider">
              <span className="border-b-4 border-[#00f0ff] pb-2">War Stories</span>
            </h3>
            <p className="text-gray-400 max-w-2xl mx-auto font-mono">
              // FROM THE FRONTLINES OF LEARNING //
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 border-4 border-[#00f0ff] bg-[#0a0a0a] hover:border-[#ff4d00] transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#ff4d00] flex items-center justify-center text-black font-bold mr-4 text-2xl">
                  S
                </div>
                <div>
                  <div className="font-black text-xl text-[#00f0ff]">Sarah "The Crusher"</div>
                  <div className="text-sm text-gray-400 font-mono">Quantum Physics PhD</div>
                </div>
              </div>
              <p className="text-gray-300 italic">
                "This isn't your grandma's quiz tool. It's like strapping your textbooks to a rocket and blasting them into your brain."
              </p>
            </div>

            <div className="p-6 border-4 border-[#ff4d00] bg-[#0a0a0a] hover:border-[#00f0ff] transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#00f0ff] flex items-center justify-center text-black font-bold mr-4 text-2xl">
                  M
                </div>
                <div>
                  <div className="font-black text-xl text-[#ff4d00]">Mike "The Machine"</div>
                  <div className="text-sm text-gray-400 font-mono">Neuroscience Researcher</div>
                </div>
              </div>
              <p className="text-gray-300 italic">
                "I feed it research papers and it spits back combat challenges. Learning has never felt this intense."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section - Neon Sign Effect */}
      <div className="relative py-24 bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-dark.svg')] bg-[size:100px_100px] opacity-20"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <div className="w-24 h-24 bg-[#00f0ff] rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <Rocket className="h-12 w-12 text-black" />
          </div>
          <h3 className="text-4xl font-black text-white mb-6 uppercase tracking-wider">
            <span className="text-[#ff4d00]">Ready</span> to <span className="text-[#00f0ff]">Engage</span>?
          </h3>
          <p className="text-gray-400 mb-10 text-xl font-mono max-w-2xl mx-auto">
            // JOIN THE LEARNING REVOLUTION //
          </p>
          <Link href="/create-quiz">
            <QuizifyButton 
              size="lg" 
              className="bg-[#ff4d00] text-black border-4 border-[#ff4d00] hover:bg-black hover:text-[#ff4d00] font-bold uppercase tracking-wider text-xl py-6 px-10 transition-all duration-200"
            >
              <Plus className="mr-3 h-6 w-6" />
              Launch Now
            </QuizifyButton>
          </Link>
        </div>
      </div>
    </div>
  )
}