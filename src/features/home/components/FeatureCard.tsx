import type { Feature } from '../types/home.types'

interface FeatureCardProps {
  feature: Feature
  darkMode: boolean
}

export function FeatureCard({ feature, darkMode }: FeatureCardProps) {
  return (
    <div className="text-center space-y-2">
      <div className={`text-3xl mb-2 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
        {feature.icon}
      </div>
      <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {feature.title}
      </h4>
      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {feature.description}
      </p>
    </div>
  )
}
