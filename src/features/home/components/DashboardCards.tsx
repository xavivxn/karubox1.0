import { DASHBOARD_CARDS } from '../constants/home.constants'
import { DashboardCardComponent } from './DashboardCard'

interface DashboardCardsProps {
  darkMode: boolean
}

export function DashboardCards({ darkMode }: DashboardCardsProps) {
  return (
    <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {DASHBOARD_CARDS.map((card) => (
        <DashboardCardComponent key={card.title} card={card} darkMode={darkMode} />
      ))}
    </section>
  )
}
