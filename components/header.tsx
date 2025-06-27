"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg relative z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">C</span>
            </div>
            <span className="text-white font-bold text-xl">ContratandoPlanos</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/planos"
              className="text-white hover:text-white/80 font-medium text-sm tracking-wide transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-white after:transition-all hover:after:w-full"
            >
              Planos
            </Link>
            <Link
              href="/sobre"
              className="text-white hover:text-white/80 font-medium text-sm tracking-wide transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-white after:transition-all hover:after:w-full"
            >
              Sobre
            </Link>
            <Link
              href="/contato"
              className="text-white hover:text-white/80 font-medium text-sm tracking-wide transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-white after:transition-all hover:after:w-full"
            >
              Contato
            </Link>
            <Link
              href="/corretor/login"
              className="text-white hover:text-white/80 font-medium text-sm tracking-wide transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-white after:transition-all hover:after:w-full"
            >
              Corretores
            </Link>
            <Link
              href="/cotacao"
              className="bg-white text-blue-600 px-6 py-2 rounded-full font-semibold text-sm hover:bg-white/90 transition-colors shadow-md"
            >
              Cotação Grátis
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-white hover:text-white/80 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-white/20">
            <div className="flex flex-col space-y-4 pt-4">
              <Link
                href="/planos"
                className="text-white hover:text-white/80 font-medium text-sm tracking-wide transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Planos
              </Link>
              <Link
                href="/sobre"
                className="text-white hover:text-white/80 font-medium text-sm tracking-wide transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Sobre
              </Link>
              <Link
                href="/contato"
                className="text-white hover:text-white/80 font-medium text-sm tracking-wide transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contato
              </Link>
              <Link
                href="/corretor/login"
                className="text-white hover:text-white/80 font-medium text-sm tracking-wide transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Corretores
              </Link>
              <Link
                href="/cotacao"
                className="bg-white text-blue-600 px-6 py-2 rounded-full font-semibold text-sm hover:bg-white/90 transition-colors shadow-md inline-block text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Cotação Grátis
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
