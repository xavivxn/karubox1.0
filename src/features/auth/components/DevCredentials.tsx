import { FEATURES } from '@/utils/strings';

export function DevCredentials() {
  return (
    <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-200 animate-login-field-4">
      <ul className="space-y-2.5">
        {FEATURES.map((feature, index) => (
          <li key={index} className="flex items-center gap-2.5 text-sm text-gray-600">
            <span className="text-lg shrink-0" aria-hidden>
              {feature.icon}
            </span>
            <div>
              <span className="font-medium text-gray-700">{feature.title}</span>{' '}
              {feature.description}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
