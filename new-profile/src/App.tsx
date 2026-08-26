import { About } from "./components/About"
import { Contact } from "./components/Contact"
import { Experience } from "./components/Experience"
import { Footer } from "./components/Footer"
import { Hero } from "./components/Hero"
import { Nav } from "./components/Nav"
import { Projects } from "./components/Projects"
import { Skills } from "./components/Skills"
import { SnapDots, SnapProvider, SnapViewport } from "./snap/SnapScroll"

export default function App() {
  return (
    <SnapProvider>
      <div className="min-h-screen">
        <Nav />
        <SnapViewport>
          <div className="snap-panel" data-snap="top">
            <Hero />
          </div>
          <div className="snap-panel" data-snap="about">
            <About />
          </div>
          <div className="snap-panel" data-snap="work">
            <Experience />
          </div>
          <div className="snap-panel" data-snap="skills">
            <Skills />
          </div>
          <div className="snap-panel" data-snap="projects">
            <Projects />
          </div>
          <div className="snap-panel" data-snap="contact">
            <Contact />
            <Footer />
          </div>
        </SnapViewport>
        <SnapDots />
      </div>
    </SnapProvider>
  )
}
