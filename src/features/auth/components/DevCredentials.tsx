import { FEATURES } from '@/utils/strings'

export function DevCredentials() {
  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <ul className="space-y-2">
        {FEATURES.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-lg">{feature.icon}</span>
            <div>
              <span className="font-medium text-gray-700">{feature.title}</span>{' '}
              {feature.description}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
