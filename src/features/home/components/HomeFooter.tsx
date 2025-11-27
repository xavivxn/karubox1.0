interface HomeFooterProps {
  darkMode: boolean
}

export function HomeFooter({ darkMode }: HomeFooterProps) {
  return (
    <footer className={`text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
      <p>Powered by Next.js 15 • TypeScript • Supabase</p>
    </footer>
  )
}
