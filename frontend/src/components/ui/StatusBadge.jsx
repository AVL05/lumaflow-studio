import { Badge } from './Badge'
import { labelFor } from '../../utils/catalogs'

export function StatusBadge({ options, value }) {
  const tone = options.find((option) => option.value === value)?.tone ?? 'neutral'

  return <Badge variant={tone}>{labelFor(options, value)}</Badge>
}
