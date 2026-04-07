export default function LoginLoading() {
  return (
    <div className="relative min-h-0 flex-1 flex items-center justify-center px-4 py-4 sm:py-6">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-gray-900">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[280px] sm:min-h-[320px]">
          <div className="hidden lg:block bg-gradient-to-br from-orange-500 to-orange-600 animate-pulse min-h-[200px]" />
          <div className="p-8 sm:p-10 flex flex-col justify-center gap-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse w-3/4" />
            <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-12 bg-orange-200/80 dark:bg-orange-900/40 rounded-xl animate-pulse mt-2" />
          </div>
        </div>
      </div>
    </div>
  )
}
