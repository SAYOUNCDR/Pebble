import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import type { Manual } from '../../features/pipeline/types'

export interface ManualInfoPanelProps {
    manual: Manual
    onNewChecklist: () => void
}

export function ManualInfoPanel({ manual, onNewChecklist }: ManualInfoPanelProps): React.JSX.Element {
    return (
        <Card className="h-fit">
            <CardHeader>
                <CardTitle className="text-base">Manual Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="text-xs font-semibold text-slate-600">Name</p>
                    <p className="text-sm text-slate-900">{manual.manualName}</p>
                </div>

                <div>
                    <p className="text-xs font-semibold text-slate-600">File</p>
                    <p className="text-xs text-slate-700 truncate">{manual.originalFileName}</p>
                </div>

                <div>
                    <p className="text-xs font-semibold text-slate-600">Size</p>
                    <p className="text-xs text-slate-700">{(manual.fileSizeBytes / 1024 / 1024).toFixed(2)} MB</p>
                </div>

                <div>
                    <p className="text-xs font-semibold text-slate-600">Uploaded</p>
                    <p className="text-xs text-slate-700">
                        {new Date(manual.createdAt).toLocaleDateString()}
                    </p>
                </div>

                <Button onClick={onNewChecklist} className="w-full">
                    New Checklist
                </Button>
            </CardContent>
        </Card>
    )
}
