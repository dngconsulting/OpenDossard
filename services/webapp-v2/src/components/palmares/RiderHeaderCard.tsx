import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { LicenceType } from '@/types/licences'

type Props = {
  licence: LicenceType
}

export function RiderHeaderCard({ licence }: Props) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-4 pt-6">
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-2xl font-bold">
            {licence.lastName} {licence.firstName}
          </h2>
          <p className="text-muted-foreground">{licence.club}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {licence.federation}
          </Badge>
          <Badge variant="secondary">
            #{licence.licenceNumber}
          </Badge>
        </div>

        <div className="w-full flex gap-4 mt-2 text-sm">
          <div>
            <span className="text-muted-foreground">Catégorie Route: </span>
            <span className="font-medium">{licence.category || 'N/A'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Catégorie CX: </span>
            <span className="font-medium">{licence.cxCategory || 'N/A'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
