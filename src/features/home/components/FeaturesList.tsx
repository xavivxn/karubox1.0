import { FEATURES } from '../constants/home.constants'
import { FeatureCard } from './FeatureCard'

interface FeaturesListProps {
  darkMode: boolean
}

export function FeaturesList({ darkMode }: FeaturesListProps) {
  return (
    <section className="max-w-5xl mx-auto">
      <div
        className={`grid grid-cols-1 md:grid-cols-3 gap-6 p-8 rounded-2xl ${
          darkMode ? 'bg-gray-800/50' : 'bg-white/70'
        } backdrop-blur-sm`}
      >
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} darkMode={darkMode} />
        ))}
      </div>
    </section>
  )
}
