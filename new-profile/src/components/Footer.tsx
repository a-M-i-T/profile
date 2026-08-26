import { profile } from "../data"

export function Footer() {
  return (
    <footer className="border-t border-line py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 text-sm text-muted md:flex-row md:items-center md:justify-between md:px-8">
        <p>
          © {new Date().getFullYear()} {profile.name}
        </p>
        <div className="flex gap-5">
          <a href={profile.linkedin} target="_blank" rel="noreferrer" className="hover:text-lime">
            LinkedIn
          </a>
          <a href={profile.github} target="_blank" rel="noreferrer" className="hover:text-lime">
            GitHub
          </a>
          <a href="#top" className="hover:text-coral">
            Back to top
          </a>
        </div>
      </div>
    </footer>
  )
}
