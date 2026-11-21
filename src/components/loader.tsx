import { cn } from '@/lib/utils'

import './loader.css'

type LoaderProps = {
  className?: string
  // Read out by screen readers in place of the animation.
  label?: string
}

// Animated loading indicator. Sized in em, so change font-size to scale it.
export function Loader({ className, label = 'Loading' }: LoaderProps) {
  return (
    <div role="status" className={cn('loader', className)}>
      <span className="sr-only">{label}</span>
    </div>
  )
}
